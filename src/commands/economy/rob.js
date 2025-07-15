const { EmbedBuilder } = require('discord.js');
const EconomyDatabase = require('../../database/economy');

module.exports = {
  data: {
    name: 'rob',
    description: 'Cướp tiền của người khác (có rủi ro)',
    usage: 'rob <@user hoặc id>',
    aliases: ['steal'],
    cooldown: 10,
    category: 'economy'
  },
  execute: async (message, args) => {
    const userId = message.author.id;
    const user = EconomyDatabase.getUser(userId);
    const now = Date.now();
    const robCooldown = 2 * 60 * 60 * 1000; // 2 giờ

    // Cooldown
    const cooldownCheck = EconomyDatabase.validateCooldown(user.lastRob, robCooldown, 'cướp tiền');
    if (!cooldownCheck.valid) {
      const timeLeft = cooldownCheck.timeLeft;
      const totalSeconds = Math.floor(timeLeft / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      let timeString = '';
      if (hours > 0) timeString += `${hours} giờ `;
      if (minutes > 0) timeString += `${minutes} phút `;
      if (!timeString) timeString = 'ít hơn 1 phút';
      const nextRobTimestamp = Math.floor((now + cooldownCheck.timeLeft) / 1000);

      const embed = new EmbedBuilder()
        .setTitle('🚨 Cảnh sát đang theo dõi!')
        .setDescription(
          [
            'Bạn vừa bị phát hiện cướp tiền!',
            `⏳ **Chờ:** ${timeString.trim()} (**<t:${nextRobTimestamp}:R>**) để tiếp tục cướp.`
          ].join('\n')
        )
        .addFields(
          { name: '📅 Thời gian cụ thể', value: `<t:${nextRobTimestamp}:F>`, inline: false }
        )
        .setColor(message.client.config?.embedColors?.error || '#FF89A0')
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'Đừng quá tham lam, hãy kiên nhẫn!' });
      return message.reply({ embeds: [embed] });
    }

    // Mục tiêu
    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!target) {
      const embed = new EmbedBuilder()
        .setTitle('🕵️‍♂️ Lỗi mục tiêu')
        .setDescription(
          `Vui lòng **mention hoặc nhập ID** người bạn muốn cướp!\n`
          + `Ví dụ: \`${message.client.config.prefix}rob @user\``
        )
        .setColor(message.client.config?.embedColors?.warning || '#FFD580')
        .setFooter({ text: 'Chọn mục tiêu hợp lệ để cướp!' });
      return message.reply({ embeds: [embed] });
    }

    if (target.id === message.author.id || target.user.bot) {
      const embed = new EmbedBuilder()
        .setTitle('🚫 Hành động không hợp lệ')
        .setDescription(
          target.id === message.author.id
            ? 'Bạn không thể cướp chính mình!'
            : 'Bạn không thể cướp bot!'
        )
        .setColor(message.client.config?.embedColors?.error || '#FF89A0');
      return message.reply({ embeds: [embed] });
    }

    const targetUser = EconomyDatabase.getUser(target.id);
    if (!targetUser || targetUser.money < 100) {
      const embed = new EmbedBuilder()
        .setTitle('💸 Mục tiêu quá nghèo')
        .setDescription(
          `${target.displayName} không có đủ tiền để cướp!\n`
          + `> (Tối thiểu **100 🪙** mới có thể bị cướp)`
        )
        .setColor(message.client.config?.embedColors?.error || '#FF89A0');
      return message.reply({ embeds: [embed] });
    }

    // Tính xác suất cướp thành công
    const successRate = Math.min(40 + (user.level * 2), 70);
    const isSuccess = Math.random() * 100 < successRate;
    user.lastRob = now;

    if (isSuccess) {
      const maxSteal = Math.floor(targetUser.money * 0.3);
      const stolenAmount = Math.floor(Math.random() * maxSteal) + 50;
      EconomyDatabase.addMoney(userId, stolenAmount);
      EconomyDatabase.removeMoney(target.id, stolenAmount);
      const levelUpResult = EconomyDatabase.addExp(userId, 8);
      const updatedUser = EconomyDatabase.getUser(userId);

      const successEmbed = new EmbedBuilder()
        .setTitle('💥 Cướp thành công!')
        .setDescription(
          `Bạn đã cướp được **${stolenAmount.toLocaleString()} 🪙** từ **${target.displayName}**!`
        )
        .addFields(
          { name: '💰 Tiền cướp được', value: `${stolenAmount.toLocaleString()} 🪙`, inline: true },
          { name: '💵 Số dư mới', value: `${updatedUser.money.toLocaleString()} 🪙`, inline: true },
          { name: '📈 EXP nhận được', value: `+8 EXP`, inline: true }
        )
        .setColor(message.client.config?.embedColors?.success || '#43EA97')
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'Cẩn thận, cảnh sát luôn rình rập!' })
        .setTimestamp();

      await message.reply({ embeds: [successEmbed] });
      if (levelUpResult) {
        setTimeout(() => {
          message.channel.send({ content: levelUpResult.message });
        }, 1000);
      }
    } else {
      const fine = Math.floor(Math.random() * 200) + 100;
      EconomyDatabase.removeMoney(userId, fine);
      const updatedUser = EconomyDatabase.getUser(userId);

      const failEmbed = new EmbedBuilder()
        .setTitle('❗ Cướp thất bại!')
        .setDescription(
          `Bạn đã bị cảnh sát tóm gọn và nộp phạt **${fine.toLocaleString()} 🪙**!`
        )
        .addFields(
          { name: '💸 Tiền phạt', value: `${fine.toLocaleString()} 🪙`, inline: true },
          { name: '💵 Số dư còn lại', value: `${updatedUser.money.toLocaleString()} 🪙`, inline: true },
          { name: '💡 Mẹo', value: 'Thử vận may vào lần tới, hoặc cày tiền chăm chỉ hơn nhé!', inline: false }
        )
        .setColor(message.client.config?.embedColors?.error || '#FF89A0')
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setTimestamp();
      await message.reply({ embeds: [failEmbed] });
    }
  }
};
