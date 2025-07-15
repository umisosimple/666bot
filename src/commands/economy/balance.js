const { EmbedBuilder } = require('discord.js');
const EconomyDatabase = require('../../database/economy');

module.exports = {
  data: {
    name: 'balance',
    description: 'Kiểm tra số dư tài khoản của bạn hoặc người khác',
    usage: 'balance [@user] | cash [@user]',
    aliases: ['bal', 'money', 'cash'],
    cooldown: 3,
    category: 'economy'
  },
  execute: async (message, args) => {
    const target = message.mentions.users.first() || message.author;
    const user = EconomyDatabase.getUser(target.id);

    // Level và exp
    const levelInfo = EconomyDatabase.getUserLevel(target.id);

    // Thông tin số dư
    const cash = user.money?.toLocaleString() ?? '0';
    const bank = user.bank?.toLocaleString() ?? '0';
    const total = (user.money + user.bank)?.toLocaleString() ?? '0';

    // Streak
    const streak = user.streak?.daily || 0;

    // Block số dư
    const blockBalance = [
      `🪙 **Ví tiền:** \`${cash}\``,
      `🏦 **Ngân hàng:** \`${bank}\``,
      `💰 **Tổng cộng:** \`${total}\``
    ].join('\n');

    // Block thông tin cá nhân
    const blockInfo = [
      `📊 **Level:** \`${levelInfo.level}\``,
      `⭐ **Exp:** \`${levelInfo.exp}/${levelInfo.requiredExp}\` (${levelInfo.progress}%)`,
      `🔥 **Chuỗi Daily:** \`${streak}\` ngày`
    ].join('\n');

    const embed = new EmbedBuilder()
      .setColor('#00D187')
      .setTitle(`💸 Số dư của ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Số dư tài khoản', value: blockBalance, inline: false },
        { name: 'Thông tin cá nhân', value: blockInfo, inline: false }
      )
      .setFooter({ text: `Tra cứu bởi: ${message.author.tag} • Hệ thống kinh tế Bot` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
