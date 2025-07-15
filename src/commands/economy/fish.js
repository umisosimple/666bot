const { EmbedBuilder } = require('discord.js');
const EconomyDatabase = require('../../database/economy');
const { onFishSuccess } = require('./achievements');

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
    name: 'fish',
    description: 'Đi câu cá để kiếm tiền',
    usage: 'fish',
    aliases: ['fishing'],
    cooldown: 45,
    category: 'economy'
  },
  execute: async (message, args) => {
    const userId = message.author.id;
    const user = EconomyDatabase.getUser(userId);
    user.id = userId; // Đảm bảo có trường id cho autoResetTasks
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // Reset nhiệm vụ nếu đã qua 24h
    autoResetTasks(user, now, oneDay);

    // Cooldown
    const cooldownCheck = EconomyDatabase.validateCooldown(user.lastFish, 45000, 'câu cá');
    if (!cooldownCheck.valid) {
      const embed = new EmbedBuilder()
        .setTitle('🎣 Câu cá')
        .setDescription(cooldownCheck.message)
        .setColor('#FFD580');
      return message.reply({ embeds: [embed] });
    }

    user.lastFish = now;

    // Tăng tiến trình nhiệm vụ fish
    user.tasks = user.tasks || {};
    user.tasks.fish = (user.tasks.fish || 0) + 1;

    const hasFishingRod = user.inventory && user.inventory.fishing_rod;
    const baseSuccessRate = 65;
    const rodBonus = hasFishingRod ? 20 : 0;
    const levelBonus = Math.floor(user.level * 1.5);
    const successRate = Math.min(baseSuccessRate + rodBonus + levelBonus, 90);

    const isSuccess = Math.random() * 100 < successRate;

    if (isSuccess) {
      const reward = Math.floor(Math.random() * (50 - 10 + 1)) + 10;
      const expGain = 12;

      EconomyDatabase.addMoney(userId, reward);
      const levelUpResult = EconomyDatabase.addExp(userId, expGain);

      if (!user.fishingStats) {
        user.fishingStats = { totalCaught: 0, bestFish: null };
      }
      user.fishingStats.totalCaught++;

      EconomyDatabase.updateUser(userId, user);

      const newAchievements = onFishSuccess(userId);

      const updatedUser = EconomyDatabase.getUser(userId);
      const levelInfo = EconomyDatabase.getUserLevel(userId);

      const fishEmbed = new EmbedBuilder()
        .setTitle('🎣 Câu cá thành công!')
        .setDescription(`Bạn đã câu được cá và nhận được **${reward} coins**!`)
        .addFields(
          { name: '📈 EXP:', value: `+${expGain} EXP`, inline: true },
          { name: '💵 Số dư:', value: `${updatedUser.money.toLocaleString()} 🪙`, inline: true },
          { name: '🎯 Tổng cá câu:', value: `${updatedUser.fishingStats.totalCaught}`, inline: true }
        )
        .setColor('#43EA97')
        .setTimestamp()
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

      await message.reply({ embeds: [fishEmbed] });

      if (levelUpResult) {
        setTimeout(() => {
          message.channel.send({ content: levelUpResult.message });
        }, 1000);
      }

      if (newAchievements && newAchievements.length > 0) {
        setTimeout(() => {
          newAchievements.forEach(achievement => {
            const achievementEmbed = new EmbedBuilder()
              .setTitle('🏆 Thành tựu mới!')
              .setDescription(`Bạn đã hoàn thành: **${achievement.name}**`)
              .addFields(
                { name: '🎁 Phần thưởng:', value: `+${achievement.reward.toLocaleString()} coins`, inline: true }
              )
              .setColor('#00BFFF')
              .setTimestamp();

            message.channel.send({ embeds: [achievementEmbed] });
          });
        }, 2000);
      }

    } else {
      const failMessages = [
        'Cá đã cắn câu nhưng bỏ chạy!',
        'Cần câu của bạn bị kẹt!',
        'Không có cá nào cắn câu...',
        'Bạn làm ồn quá, cá sợ hết rồi!',
        'Mồi câu bị rơi mất!'
      ];

      const failMessage = failMessages[Math.floor(Math.random() * failMessages.length)];

      const expGain = 3;
      EconomyDatabase.addExp(userId, expGain);
      EconomyDatabase.updateUser(userId, user);

      const failEmbed = new EmbedBuilder()
        .setTitle('🎣 Câu cá thất bại!')
        .setDescription(failMessage)
        .addFields(
          { name: '📈 EXP nhận được:', value: `+${expGain} EXP (kinh nghiệm)`, inline: true },
          { name: '💡 Mẹo:', value: 'Mua cần câu cao cấp để tăng tỷ lệ!', inline: true }
        )
        .setColor('#FF89A0')
        .setTimestamp()
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

      await message.reply({ embeds: [failEmbed] });
    }
  }
};
