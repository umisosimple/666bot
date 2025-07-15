const { EmbedBuilder } = require('discord.js');
const EconomyDatabase = require('../../database/economy');
const { onDailyReward } = require('./achievements');

module.exports = {
  data: {
    name: 'daily',
    description: 'Nhận phần thưởng hàng ngày.',
    usage: 'daily',
    cooldown: 86400,
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
            .setColor('#FF89A0') // Error pastel
        ]
      });
    }
    const now = Date.now();
    const diff = now - (user.lastDaily || 0);

    if (diff < 86400000) {
      const timeLeft = 86400000 - diff;
      const hours = Math.floor(timeLeft / 3600000);
      const minutes = Math.floor((timeLeft % 3600000) / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('⏰ Chưa đến giờ nhận thưởng')
            .setDescription(`Bạn cần đợi **${hours}h ${minutes}m ${seconds}s** để nhận daily tiếp theo.`)
            .setColor('#FF89A0')
        ]
      });
    }

    const coinReward = 1000 + Math.floor(Math.random() * 1000);
    user.coins += coinReward;
    user.lastDaily = now;

    // Initialize tasks if not exists
    if (!user.tasks) {
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
    }

    // Reset tasks if needed
    const resetResult = EconomyDatabase.resetTasksIfNeeded(userId, now);
    if (!resetResult.success) {
      console.error(`Failed to reset tasks for user ${userId}:`, resetResult.message);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Lỗi')
            .setDescription('Không thể reset nhiệm vụ hàng ngày. Vui lòng thử lại sau!')
            .setColor('#FF89A0')
        ]
      });
    }

    // Mark daily task as completed
    user.tasks.daily = true;
    console.log(`Before saving user ${userId} in daily.js:`, user.tasks);

    // Save user data
    const saveResult = EconomyDatabase.updateUser(userId, user);
    if (!saveResult.success) {
      console.error(`Failed to save user ${userId} in daily.js:`, saveResult.message);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Lỗi')
            .setDescription('Không thể lưu dữ liệu. Vui lòng thử lại sau!')
            .setColor('#FF89A0')
        ]
      });
    }
    console.log(`Successfully saved user ${userId} in daily.js:`, user.tasks);

    // Check achievement
    const newAchievements = onDailyReward(userId);

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('🎁 Nhận thưởng hàng ngày!')
          .setDescription(`Bạn đã nhận được **${coinReward.toLocaleString()}** 🪙!`)
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