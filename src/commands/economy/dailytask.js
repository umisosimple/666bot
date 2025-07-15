// src/commands/economy/dailytasks.js
const { EmbedBuilder } = require('discord.js');
const EconomyDatabase = require('../../database/economy');

function autoResetTasks(user, now, oneDay) {
  if (!user.tasks.lastReset || now - user.tasks.lastReset >= oneDay) {
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
    EconomyDatabase.updateUser(user.id, user);
    return true;
  }
  return false;
}

function buildDailytaskEmbed(user, rewardsMsg, avatarUrl) {
  // Tiền thưởng cố định (nếu bạn muốn random thì ghi chú ~10-100c)
  const rewardSmall = '10~100';
  const rewardBig = '100~300';

  const list = [
    `🎣 **Câu cá:**      \`${user.tasks.fish}/3\`   (Thưởng: ${rewardSmall})`,
    `🏹 **Săn bắt:**     \`${user.tasks.hunt}/3\`   (Thưởng: ${rewardSmall})`,
    `💼 **Làm việc:**   \`${user.tasks.work}/3\`   (Thưởng: ${rewardSmall})`,
    `🔥 **Nhận Daily:** \`${user.tasks.daily ? 1 : 0}/1\`   (Thưởng: ${rewardSmall})`
  ].join('\n');

  // Điều kiện thưởng lớn
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
    .setColor('#00D187') // Discord Jade Green
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
    const user = EconomyDatabase.getUser(message.author.id);
    user.id = message.author.id; // cần thiết nếu chưa có trường id
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    autoResetTasks(user, now, oneDay);

    // ---- Thưởng từng nhiệm vụ nhỏ ----
    let taskRewardMessages = [];
    // fish
    if (user.tasks.fish >= 3 && !user.tasks.fishClaimed) {
      const reward = Math.floor(Math.random() * 91) + 10; // 10-100
      EconomyDatabase.addMoney(user.id, reward);
      user.tasks.fishClaimed = true;
      taskRewardMessages.push(`🎣 Hoàn thành **Câu cá**, nhận **${reward} coins**`);
    }
    // hunt
    if (user.tasks.hunt >= 3 && !user.tasks.huntClaimed) {
      const reward = Math.floor(Math.random() * 91) + 10; // 10-100
      EconomyDatabase.addMoney(user.id, reward);
      user.tasks.huntClaimed = true;
      taskRewardMessages.push(`🏹 Hoàn thành **Săn bắt**, nhận **${reward} coins**`);
    }
    // work
    if (user.tasks.work >= 3 && !user.tasks.workClaimed) {
      const reward = Math.floor(Math.random() * 91) + 10; // 10-100
      EconomyDatabase.addMoney(user.id, reward);
      user.tasks.workClaimed = true;
      taskRewardMessages.push(`💼 Hoàn thành **Làm việc**, nhận **${reward} coins**`);
    }
    // daily
    if (user.tasks.daily && !user.tasks.dailyClaimed) {
      const reward = Math.floor(Math.random() * 91) + 10; // 10-100
      EconomyDatabase.addMoney(user.id, reward);
      user.tasks.dailyClaimed = true;
      taskRewardMessages.push(`🔥 Nhận **Daily**, nhận **${reward} coins**`);
    }

    // ---- Thưởng lớn khi hoàn thành tất cả ----
    if (
      user.tasks.fish >= 3 &&
      user.tasks.hunt >= 3 &&
      user.tasks.work >= 3 &&
      user.tasks.daily &&
      !user.tasks.claimed
    ) {
      const totalReward = Math.floor(Math.random() * 201) + 100; // 100-300
      EconomyDatabase.addMoney(user.id, totalReward);
      user.tasks.claimed = true;
      taskRewardMessages.push(`🎁 **HOÀN THÀNH TẤT CẢ!** Nhận **${totalReward} coins**!`);
    }

    // Lưu lại user sau khi nhận thưởng
    EconomyDatabase.updateUser(user.id, user);

    // Gộp các dòng thưởng vừa nhận
    const rewardsMsg = taskRewardMessages.length > 0
      ? taskRewardMessages.map(m=>`• ${m}`).join('\n')
      : '';

    // Hiển thị trạng thái nhiệm vụ embed đẹp mắt
    const embed = buildDailytaskEmbed(
      user,
      rewardsMsg,
      message.author.displayAvatarURL({ dynamic: true })
    );

    await message.reply({ embeds: [embed] });
  }
};
