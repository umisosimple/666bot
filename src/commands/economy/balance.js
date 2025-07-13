const { EmbedBuilder } = require('discord.js');
const { EconomyDatabase } = require('../../database/economy');

module.exports = {
  data: {
    name: 'balance',
    description: 'Kiểm tra số dư tài khoản của bạn',
    usage: 'balance [@user]',
    aliases: ['bal', 'money'],
    cooldown: 3,
    category: 'economy'
  },
  execute: async (message, args) => {
    const target = message.mentions.users.first() || message.author;
    const user = EconomyDatabase.getUser(target.id);
    
    const balanceEmbed = new EmbedBuilder()
      .setTitle(`💰 Ví tiền của ${target.displayName}`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '💵 Tiền mặt', value: `${user.money.toLocaleString()} 🪙`, inline: true },
        { name: '🏦 Ngân hàng', value: `${user.bank.toLocaleString()} 🪙`, inline: true },
        { name: '💎 Tổng cộng', value: `${(user.money + user.bank).toLocaleString()} 🪙`, inline: true },
        { name: '📊 Level', value: `${user.level}`, inline: true },
        { name: '⭐ Kinh nghiệm', value: `${user.exp}/${user.level * 100}`, inline: true },
        { name: '🔥 Streak Daily', value: `${user.streak.daily}`, inline: true }
      )
      .setColor(message.client.config.embedColors.success)
      .setTimestamp()
      .setFooter({ text: 'Hệ thống kinh tế Bot' });
    
    await message.reply({ embeds: [balanceEmbed] });
  }
};