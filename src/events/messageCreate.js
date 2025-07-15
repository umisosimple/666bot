const { Events } = require('discord.js');
const { logger } = require('../utils/logger');
const { checkAndApplyCooldown, formatTime } = require('../utils/cooldown');
const { createErrorEmbed, createWarningEmbed, createSuccessEmbed } = require('../utils/embedBuilder');
const moderationDB = require('../database/moderation');
const { validateContent } = require('../utils/validator');

const BAD_WORDS = moderationDB.getSettings().filters?.badWords || ['spam', 'toxic'];
const MAX_MENTIONS = moderationDB.getSettings().filters?.massMention || 5;
const SPAM_TIME_LIMIT = 3000;
const INVITE_LINK_REGEX = /https?:\/\/(www\.)?(discord\.gg|discordapp\.com|discord\.me|discord\.io|discord\.com)\/[a-zA-Z0-9]+/g;
const MAX_WARNINGS = moderationDB.getSettings().autoModeration?.maxWarnings || 3;
const AUTO_MUTE_DURATION = moderationDB.getSettings().autoModeration?.muteDuration || 3600000; // 1h

const userLastMessage = new Map();

module.exports = {
  name: Events.MessageCreate,
  execute: async (message) => {
    const client = message.client;

    // Bỏ qua tin nhắn từ bot
    if (message.author.bot) return;

    logger.debug(`Processing message: "${message.content}" from ${message.author.tag}`);

    // Xử lý các lệnh có tiền tố
    if (!message.content.startsWith(client.config.prefix)) return;

    const args = message.content.slice(client.config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Lấy lệnh từ client.commands (bao gồm cả alias)
    const command = client.commands.get(commandName);
    if (!command) {
      logger.debug(`Command not found: ${commandName}`);
      return;
    }

    // --- Logic kiểm tra Cooldown chung cho tất cả lệnh ---
    if (command.data.cooldown) {
      const { isOnCooldown, timeLeft } = checkAndApplyCooldown(
        message.author.id,
        command.data.name,
        command.data.cooldown
      );

      if (isOnCooldown) {
        const timeString = formatTime(timeLeft);
        const cooldownEmbed = createErrorEmbed(
          '⏰ Cooldown!',
          `Bạn cần đợi **${timeString}** để sử dụng lệnh \`${command.data.name}\` lần nữa.`
        );
        logger.debug(`User ${message.author.tag} is on cooldown for ${command.data.name}. Time left: ${timeString}`);
        return message.reply({ embeds: [cooldownEmbed] });
      }
    }

    try {
      await command.execute(message, args);
      logger.info(`Command executed: ${command.data.name} by ${message.author.tag}`);
    } catch (error) {
      logger.error(`Error executing command ${command.data.name} by ${message.author.tag}:`, error);
      const errorEmbed = createErrorEmbed('❌ Lỗi!', 'Đã xảy ra lỗi khi thực thi lệnh này. Vui lòng thử lại sau.');
      await message.reply({ embeds: [errorEmbed] }).catch(e => logger.error('Failed to send error message:', e));
    }
  },
};

// Hàm tự động mute nếu quá số warning
async function checkAutoMute(message, client) {
  const userId = message.author.id;
  const warnings = moderationDB.getActiveWarnings(userId);
  const MAX_WARNINGS = moderationDB.getSettings().autoModeration?.maxWarnings || 3;
  const AUTO_MUTE_DURATION = moderationDB.getSettings().autoModeration?.muteDuration || 3600000;

  // Kiểm tra đã bị mute chưa
  const activeMute = moderationDB.getActiveMute(userId);
  if (warnings.length >= MAX_WARNINGS && !activeMute) {
    // Tìm role muted
    const mutedRoleId = client.config?.moderation?.roles?.muted;
    const member = message.guild?.members.cache.get(userId);
    if (member && mutedRoleId) {
      try {
        await member.roles.add(mutedRoleId, `Tự động mute do vượt quá ${MAX_WARNINGS} warnings`);
        moderationDB.addMute(userId, `Tự động mute do vượt quá ${MAX_WARNINGS} warnings`, client.user.id, AUTO_MUTE_DURATION);
        await message.channel.send({
          embeds: [createSuccessEmbed('Tự động mute', `<@${userId}> đã bị mute trong ${AUTO_MUTE_DURATION / 60000} phút do vượt quá số lượng cảnh báo!`)]
        });
        logger.info(`Auto-muted ${userId} for exceeding warnings`);
      } catch (err) {
        logger.error(`Không thể tự động mute ${userId}:`, err);
      }
    }
  }
}

// ===================== TỰ ĐỘNG CỘNG EXP/LEVEL KHI NHẮN TIN =====================
const EconomyDatabase = require('../database/economy'); // Thêm dòng này ở đầu file
if (!message.author.bot && message.guild) {
  // Không cộng EXP cho bot và chỉ cộng trong server
  const userId = message.author.id;
  // Cộng ngẫu nhiên từ 2~4 exp, tuỳ chỉnh cho vui
  const randomExp = Math.floor(Math.random() * 3) + 2;
  const levelUpResult = EconomyDatabase.addExp(userId, randomExp);

  // Nếu lên cấp, gửi thông báo nhỏ
  if (levelUpResult && levelUpResult.levelUp) {
    try {
      await message.channel.send({
        content: `🎉 <@${userId}> đã lên cấp **${levelUpResult.newLevel}**! ${levelUpResult.message ? levelUpResult.message : ''}`,
      });
    } catch (e) {/* ignore */}
  }
}
// ==============================================================================
