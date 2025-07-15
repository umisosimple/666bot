const { EmbedBuilder } = require('discord.js');
const EconomyDatabase = require('../../database/economy');
const { onWorkSuccess } = require('./achievements');

module.exports = {
  data: {
    name: 'work',
    description: 'Làm việc kiếm tiền mỗi 30 phút.',
    usage: 'work',
    cooldown: 1800,
    category: 'economy'
  },
  async execute(message, args) {
    const userId = message.author.id;
    const user = EconomyDatabase.getUser(userId);
    if (!user) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Lỗi')
            .setDescription('Bạn chưa có tài khoản! Hãy chat hoặc thực hiện lệnh bất kỳ để tạo tài khoản.')
            .setColor('#FF89A0')
        ]
      });
    }
    const now = Date.now();
    const diff = now - (user.lastWork || 0);

    if (diff < 1800000) {
      const timeLeft = 1800000 - diff;
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('⏰ Bạn vừa làm việc xong')
            .setDescription(`Hãy đợi **${minutes} phút ${seconds} giây** để làm việc tiếp.`)
            .setColor('#FF89A0')
        ]
      });
    }

    const coinReward = 800 + Math.floor(Math.random() * 500);
    user.coins += coinReward;
    user.lastWork = now;
    EconomyDatabase.updateUser(userId, user);

    // Check achievement
    const newAchievements = onWorkSuccess(userId);

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('💼 Làm việc thành công!')
          .setDescription(`Bạn đã nhận được **${coinReward.toLocaleString()}** 🪙 từ công việc.`)
          .setColor('#43EA97')
          .setTimestamp()
      ]
    });

    // Gửi embed thành tựu nếu có
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
      }, 1200);
    }
  }
};
