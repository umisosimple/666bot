// src/commands/moderation/warn.js

const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embedBuilder');
const moderationDB = require('../../database/moderation');
const config = require('../../config/config');

module.exports = {
  data: {
    name: 'warn',
    description: 'Cảnh báo một thành viên. Nếu đủ số lần sẽ tự động ban.',
    usage: 'bng warn <@user|userId> [lý do]',
    example: 'bng warn @username Spam nhiều quá',
    permissions: ['KICK_MEMBERS', 'BAN_MEMBERS'], // Cần quyền kick hoặc ban
    cooldown: 5,
    category: 'moderation'
  },
  /**
   * Cách dùng:
   * - bng warn @user [lý do]
   * - bng warn 1234567890 [lý do]
   */
  execute: async (message, args) => {
    // 1. Kiểm tra quyền
    if (!message.guild) return;
    if (
      !message.member.permissions.has('KICK_MEMBERS') &&
      !message.member.permissions.has('BAN_MEMBERS')
    ) {
      return message.reply({ embeds: [createErrorEmbed('Thiếu quyền', 'Bạn cần quyền Kick hoặc Ban để warn!')] });
    }

    // 2. Lấy target từ @mention hoặc ID
    const userArg = args[0];
    if (!userArg) {
      return message.reply({ embeds: [createErrorEmbed('Thiếu thông tin', `Cách dùng: \`${this.data.usage}\``)] });
    }
    let target = message.mentions.members.first();
    if (!target) {
      target = await message.guild.members.fetch(userArg).catch(() => null);
    }
    if (!target) {
      return message.reply({ embeds: [createErrorEmbed('Không tìm thấy thành viên', 'Vui lòng nhập đúng @user hoặc ID user trong server!')] });
    }
    if (target.id === message.author.id) {
      return message.reply({ embeds: [createErrorEmbed('Không hợp lệ', 'Bạn không thể tự warn mình!')] });
    }
    if (target.user.bot) {
      return message.reply({ embeds: [createErrorEmbed('Không hợp lệ', 'Không thể warn bot!')] });
    }

    // 3. Lấy lý do
    const reason = args.slice(1).join(' ') || 'Không có lý do';

    // 4. Ghi log warn vào database
    moderationDB.addWarning({
      user: target.id,
      mod: message.author.id,
      reason,
      guild: message.guild.id
    });

    // 5. Đếm số warn hiện tại của user trong guild này
    const warns = moderationDB.getActiveWarns(target.id, message.guild.id);
    const maxWarns = config.moderation.autoBanWarns || 3;

    // 6. Nếu chưa đủ warn để auto-ban
    if (warns.length < maxWarns) {
      const embed = createSuccessEmbed(
        'Cảnh báo thành công',
        [
          `👤 **Thành viên:** <@${target.id}>`,
          `👮 **Mod:** <@${message.author.id}>`,
          `🔢 **Số lần cảnh báo:** ${warns.length}/${maxWarns}`,
          `📝 **Lý do:** ${reason}`,
        ].join('\n')
      );
      await message.reply({ embeds: [embed] });
      moderationDB.sendModLog(message.client, embed);
      return;
    }

    // 7. Nếu đủ số warn => auto-ban & reset warn
    try {
      await target.ban({
        reason: `Tự động ban sau khi bị cảnh báo ${maxWarns} lần. Mod: ${message.author.tag}. Lý do cuối: ${reason}`
      });
      // Log ban vào db
      moderationDB.addBan({
        user: target.id,
        mod: message.author.id,
        reason: `Tự động ban sau khi warn đủ ${maxWarns} lần. Lý do cuối: ${reason}`,
        guild: message.guild.id
      });
      // Xoá toàn bộ warn của user này
      moderationDB.clearWarns(target.id, message.guild.id);

      // Thông báo
      const banEmbed = createSuccessEmbed(
        'Tự động BAN',
        [
          `👤 **Thành viên:** <@${target.id}>`,
          `👮 **Mod:** <@${message.author.id}>`,
          `🔢 **Số lần cảnh báo:** ${warns.length}/${maxWarns}`,
          `🚫 **Đã tự động BAN thành viên này do bị cảnh báo đủ số lần.**`,
          `📝 **Lý do cuối:** ${reason}`
        ].join('\n')
      );
      await message.reply({ embeds: [banEmbed] });
      moderationDB.sendModLog(message.client, banEmbed);
    } catch (e) {
      return message.reply({ embeds: [createErrorEmbed('Không thể ban', 'Bot không thể ban user này (có thể do role quá cao hoặc thiếu quyền)!')] });
    }
  }
};
