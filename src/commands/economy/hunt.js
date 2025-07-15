const { EmbedBuilder } = require('discord.js');
const EconomyDatabase = require('../../database/economy');
const { onHuntSuccess } = require('./achievements');

function autoResetTasks(user, now, oneDay) {
  if (!user.tasks || !user.tasks.lastReset || now - user.tasks.lastReset >= oneDay) {
    user.tasks = {
      fish: 0,
      hunt: 0,
      work: 0,
      daily: false,
      fishClaimed: false,
      huntClaimed: false,
      workClaimed: false,
      dailyClaimed: false,
      claimed: false,
      lastReset: now
    };
    EconomyDatabase.updateUser(user.id || user.userId, user);
    return true;
  }
  return false;
}

module.exports = {
  data: {
    name: 'hunt',
    description: 'Đi săn động vật để kiếm tiền',
    usage: 'hunt',
    aliases: ['hunting'],
    cooldown: 60,
    category: 'economy'
  },
  execute: async (message, args) => {
    const userId = message.author.id;
    const user = EconomyDatabase.getUser(userId);
    user.id = userId;
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // Reset nhiệm vụ nếu đã qua 24h
    autoResetTasks(user, now, oneDay);

    // Cooldown
    const cooldownCheck = EconomyDatabase.validateCooldown(user.lastHunt, 60000, 'săn bắn');
    if (!cooldownCheck.valid) {
      const embed = new EmbedBuilder()
        .setTitle('🏹 Săn bắn')
        .setDescription(cooldownCheck.message)
        .setColor('#FFD580');
      return message.reply({ embeds: [embed] });
    }

    user.lastHunt = now;

    // Tăng tiến trình nhiệm vụ hunt
    user.tasks = user.tasks || {};
    user.tasks.hunt = (user.tasks.hunt || 0) + 1;

    const hasHuntingBow = user.inventory && user.inventory.hunting_bow;
    const baseSuccessRate = 55;
    const bowBonus = hasHuntingBow ? 25 : 0;
    const levelBonus = Math.floor(user.level * 2);
    const successRate = Math.min(baseSuccessRate + bowBonus + levelBonus, 85);

    const isSuccess = Math.random() * 100 < successRate;

    if (isSuccess) {
      const reward = Math.floor(Math.random() * (50 - 10 + 1)) + 10;
      const expGain = 15;

      EconomyDatabase.addMoney(userId, reward);
      const levelUpResult = EconomyDatabase.addExp(userId, expGain);

      if (!user.huntingStats) {
        user.huntingStats = { totalHunted: 0, bestHunt: null };
      }
      user.huntingStats.totalHunted++;

      EconomyDatabase.updateUser(userId, user);

      const newAchievements = onHuntSuccess(userId);

      const updatedUser = EconomyDatabase.getUser(userId);

      // CREATE EMBED FIRST, THEN USE IT
      const huntEmbed = new EmbedBuilder()
        .setTitle('🏹 Săn bắn thành công!')
        .setDescription(`Bạn đã săn được và nhận được **${reward} coins**!`)
        .addFields(
          { name: '📈 EXP:', value: `+${expGain} EXP`, inline: true },
          { name: '💵 Số dư:', value: `${updatedUser.money.toLocaleString()} 🪙`, inline: true },
          { name: '🎯 Tổng săn được:', value: `${updatedUser.huntingStats.totalHunted}`, inline: true }
        )
        .setColor('#43EA97')
        .setTimestamp()
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

      await message.reply({ embeds: [huntEmbed] });

      if (levelUpResult) {
        setTimeout(() => {
          message.channel.send({ content: levelUpResult.message });
        }, 1000);
      }

      // ===== GỬI EMBED THÀNH TỰU MỚI (nếu có) =====
      if (newAchievements && newAchievements.length > 0) {
        setTimeout(() => {
          newAchievements.forEach(achievement => {
            const achievementEmbed = new EmbedBuilder()
              .setTitle('🏆 Thành tựu mới!')
              .setDescription(`Bạn đã hoàn thành: **${achievement.name}**`)
              .addFields(
                { name: '🎁 Phần thưởng:', value: `+${achievement.reward.toLocaleString()} coins`, inline: true }
              )
              .setColor('#FFD580')
              .setTimestamp();
            message.channel.send({ embeds: [achievementEmbed] });
          });
        }, 2000);
      }

    } else {
      const failMessages = [
        'Động vật đã phát hiện ra bạn và bỏ chạy!',
        'Mũi tên bắn trượt mục tiêu!',
        'Bạn làm ồn và làm động vật sợ hãi!',
        'Không tìm thấy động vật nào...',
        'Thời tiết không thuận lợi để săn!'
      ];

      const failMessage = failMessages[Math.floor(Math.random() * failMessages.length)];

      const expGain = 5;
      EconomyDatabase.addExp(userId, expGain);
      EconomyDatabase.updateUser(userId, user);

      const failEmbed = new EmbedBuilder()
        .setTitle('🏹 Săn bắn thất bại!')
        .setDescription(failMessage)
        .addFields(
          { name: '📈 EXP nhận được:', value: `+${expGain} EXP (kinh nghiệm)`, inline: true },
          { name: '💡 Mẹo:', value: 'Mua cung săn để tăng tỷ lệ!', inline: true }
        )
        .setColor('#FF89A0')
        .setTimestamp()
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

      await message.reply({ embeds: [failEmbed] });
    }
  }
};