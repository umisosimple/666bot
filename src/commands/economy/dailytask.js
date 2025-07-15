const { EmbedBuilder } = require('discord.js');
const EconomyDatabase = require('../../database/economy');

function getStatusBar(current, max, length = 10) {
  const safeCurrent = Math.max(0, Math.min(current || 0, max || 1));
  const safeMax = Math.max(1, max || 1);
  const safeLength = Math.max(1, length || 10);
  
  const progress = Math.floor((safeCurrent / safeMax) * safeLength);
  const filled = Math.max(0, progress);
  const empty = Math.max(0, safeLength - filled);
  
  return '▰'.repeat(filled) + '▱'.repeat(empty);
}

function buildDailytaskEmbed(user, rewardsMsg, avatarUrl) {
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
      lastReset: Date.now()
    };
  }

  const rewardSmall = '10~100';
  const rewardBig = '100~300';

  const fishBar = getStatusBar(user.tasks.fish, 3);
  const huntBar = getStatusBar(user.tasks.hunt, 3);
  const workBar = getStatusBar(user.tasks.work, 3);
  const dailyBar = getStatusBar(user.tasks.daily ? 1 : 0, 1);

  const list = [
    `🎣 **Câu cá:**      \`${user.tasks.fish}/3\` ${fishBar} (Thưởng: ${rewardSmall})`,
    `🏹 **Săn bắt:**     \`${user.tasks.hunt}/3\` ${huntBar} (Thưởng: ${rewardSmall})`,
    `💼 **Làm việc:**   \`${user.tasks.work}/3\` ${workBar} (Thưởng: ${rewardSmall})`,
    `🔥 **Nhận Daily:** \`${user.tasks.daily ? 1 : 0}/1\` ${dailyBar} (Thưởng: ${rewardSmall})`
  ].join('\n');

  const completedAll =
    user.tasks.fish >= 3 &&
    user.tasks.hunt >= 3 &&
    user.tasks.work >= 3 &&
    user.tasks.daily;

  const claimedAll =
    user.tasks.fishClaimed &&
    user.tasks.huntClaimed &&
    user.tasks.workClaimed &&
    user.tasks.dailyClaimed;

  let bigRewardLine = `🏆 **Thưởng lớn:** `;
  if (claimedAll && user.tasks.claimed) {
    bigRewardLine += `Đã nhận (${rewardBig})`;
  } else if (completedAll) {
    bigRewardLine += `Đủ điều kiện nhận thưởng lớn! (${rewardBig})`;
  } else {
    bigRewardLine += `Chưa đủ điều kiện (${rewardBig})`;
  }

  return new EmbedBuilder()
    .setTitle('🌟 Nhiệm Vụ Hàng Ngày')
    .setColor('#00D187')
    .setDescription([
      list,
      '─────────────',
      bigRewardLine,
      rewardsMsg ? `\n**🎉 Thưởng vừa nhận:**\n${rewardsMsg}` : '',
      '─────────────',
      '*Nhiệm vụ sẽ reset mỗi 24h. Sử dụng các lệnh economy như `fish`, `hunt`, `work`, `daily` để hoàn thành nhiệm vụ và nhận thưởng!*'
    ].filter(Boolean).join('\n'))
    .setFooter({ text: "Tiến trình được reset mỗi ngày. Đừng quên nhận thưởng!" })
    .setTimestamp()
    .setThumbnail(avatarUrl);
}

module.exports = {
  data: {
    name: 'dailytasks',
    description: 'Xem & nhận thưởng nhiệm vụ hàng ngày',
    cooldown: 3,
    aliases: ['dt', 'task'],
    category: 'economy'
  },
  execute: async (message, args) => {
    try {
      const user = EconomyDatabase.getUser(message.author.id);
      user.id = message.author.id;
      
      const now = Date.now();
      console.log(`Before reset user ${user.id} in dailytask.js:`, user.tasks);
      
      const resetResult = EconomyDatabase.resetTasksIfNeeded(user.id, now);
      if (!resetResult.success) {
        console.error(`Failed to reset tasks for user ${user.id}:`, resetResult.message);
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle('Lỗi')
              .setDescription('Không thể reset nhiệm vụ hàng ngày. Vui lòng thử lại sau!')
              .setColor('#FF89A0')
          ]
        });
      }
      console.log(`After reset user ${user.id} in dailytask.js:`, user.tasks);

      let taskRewardMessages = [];
      
      if ((user.tasks.fish || 0) >= 3 && !user.tasks.fishClaimed) {
        const reward = Math.floor(Math.random() * 91) + 10; // 10-100
        const saveResult = EconomyDatabase.addMoney(user.id, reward);
        if (!saveResult.success) {
          console.error(`Failed to save fish reward for user ${user.id}:`, saveResult.message);
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle('Lỗi')
                .setDescription('Không thể lưu thưởng câu cá. Vui lòng thử lại sau!')
                .setColor('#FF89A0')
            ]
          });
        }
        user.tasks.fishClaimed = true;
        taskRewardMessages.push(`🎣 Hoàn thành **Câu cá**, nhận **${reward} coins**`);
      }
      
      if ((user.tasks.hunt || 0) >= 3 && !user.tasks.huntClaimed) {
        const reward = Math.floor(Math.random() * 91) + 10; // 10-100
        const saveResult = EconomyDatabase.addMoney(user.id, reward);
        if (!saveResult.success) {
          console.error(`Failed to save hunt reward for user ${user.id}:`, saveResult.message);
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle('Lỗi')
                .setDescription('Không thể lưu thưởng săn bắt. Vui lòng thử lại sau!')
                .setColor('#FF89A0')
            ]
          });
        }
        user.tasks.huntClaimed = true;
        taskRewardMessages.push(`🏹 Hoàn thành **Săn bắt**, nhận **${reward} coins**`);
      }
      
      if ((user.tasks.work || 0) >= 3 && !user.tasks.workClaimed) {
        const reward = Math.floor(Math.random() * 91) + 10; // 10-100
        const saveResult = EconomyDatabase.addMoney(user.id, reward);
        if (!saveResult.success) {
          console.error(`Failed to save work reward for user ${user.id}:`, saveResult.message);
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle('Lỗi')
                .setDescription('Không thể lưu thưởng làm việc. Vui lòng thử lại sau!')
                .setColor('#FF89A0')
            ]
          });
        }
        user.tasks.workClaimed = true;
        taskRewardMessages.push(`💼 Hoàn thành **Làm việc**, nhận **${reward} coins**`);
      }
      
      if (user.tasks.daily && !user.tasks.dailyClaimed) {
        const reward = Math.floor(Math.random() * 91) + 10; // 10-100
        const saveResult = EconomyDatabase.addMoney(user.id, reward);
        if (!saveResult.success) {
          console.error(`Failed to save daily reward for user ${user.id}:`, saveResult.message);
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle('Lỗi')
                .setDescription('Không thể lưu thưởng daily. Vui lòng thử lại sau!')
                .setColor('#FF89A0')
            ]
          });
        }
        user.tasks.dailyClaimed = true;
        taskRewardMessages.push(`🔥 Nhận **Daily**, nhận **${reward} coins**`);
      }

      if (
        (user.tasks.fish || 0) >= 3 &&
        (user.tasks.hunt || 0) >= 3 &&
        (user.tasks.work || 0) >= 3 &&
        user.tasks.daily &&
        !user.tasks.claimed
      ) {
        const totalReward = Math.floor(Math.random() * 201) + 100; // 100-300
        const saveResult = EconomyDatabase.addMoney(user.id, totalReward);
        if (!saveResult.success) {
          console.error(`Failed to save big reward for user ${user.id}:`, saveResult.message);
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle('Lỗi')
                .setDescription('Không thể lưu thưởng lớn. Vui lòng thử lại sau!')
                .setColor('#FF89A0')
            ]
          });
        }
        user.tasks.claimed = true;
        taskRewardMessages.push(`🎁 **HOÀN THÀNH TẤT CẢ!** Nhận **${totalReward} coins**!`);
      }

      const saveResult = EconomyDatabase.updateUser(user.id, user);
      if (!saveResult.success) {
        console.error(`Failed to save user ${user.id} in dailytask.js:`, saveResult.message);
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle('Lỗi')
              .setDescription('Không thể lưu dữ liệu. Vui lòng thử lại sau!')
              .setColor('#FF89A0')
          ]
        });
      }
      console.log(`Successfully saved user ${user.id} in dailytask.js:`, user.tasks);

      const rewardsMsg = taskRewardMessages.length > 0
        ? taskRewardMessages.map(m => `• ${m}`).join('\n')
        : '';

      const embed = buildDailytaskEmbed(
        user,
        rewardsMsg,
        message.author.displayAvatarURL({ dynamic: true })
      );

      await message.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Error in dailytasks command:', error);
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Lỗi')
            .setDescription('Đã xảy ra lỗi khi thực hiện lệnh. Vui lòng thử lại sau!')
            .setColor('#FF89A0')
        ]
      });
    }
  }
};