const { EmbedBuilder } = require('discord.js');
const { EconomyDatabase } = require('../../database/economy');

module.exports = {
  data: {
    name: 'deposit',
    description: 'Gửi tiền vào ngân hàng',
    usage: 'deposit <amount|all>',
    aliases: ['dep'],
    cooldown: 3,
    category: 'economy'
  },
  execute: async (message, args) => {
    const user = EconomyDatabase.getUser(message.author.id);
    
    if (!args[0]) {
      const embed = new EmbedBuilder()
        .setTitle('🏦 Gửi tiền')
        .setDescription('Vui lòng nhập số tiền muốn gửi!')
        .addFields(
          { name: 'Cách sử dụng:', value: `\`${message.client.config.prefix}deposit <số tiền>\`` },
          { name: 'Ví dụ:', value: `\`${message.client.config.prefix}deposit 1000\`` },
          { name: 'Gửi toàn bộ:', value: `\`${message.client.config.prefix}deposit all\`` }
        )
        .setColor(message.client.config.embedColors.warning);
      
      return message.reply({ embeds: [embed] });
    }
    
    let amount;
    if (args[0].toLowerCase() === 'all') {
      amount = user.money;
    } else {
      amount = parseInt(args[0]);
    }
    
    if (isNaN(amount) || amount <= 0) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Lỗi')
        .setDescription('Vui lòng nhập số tiền hợp lệ!')
        .setColor(message.client.config.embedColors.error);
      
      return message.reply({ embeds: [embed] });
    }
    
    if (amount > user.money) {
      const embed = new EmbedBuilder()
        .setTitle('💸 Không đủ tiền')
        .setDescription(`Bạn chỉ có **${user.money.toLocaleString()} 🪙** trong ví!`)
        .setColor(message.client.config.embedColors.error);
      
      return message.reply({ embeds: [embed] });
    }
    
    const success = EconomyDatabase.addToBank(message.author.id, amount);
    
    if (success) {
      const updatedUser = EconomyDatabase.getUser(message.author.id);
      
      const embed = new EmbedBuilder()
        .setTitle('🏦 Gửi tiền thành công!')
        .setDescription(`Bạn đã gửi **${amount.toLocaleString()} 🪙** vào ngân hàng!`)
        .addFields(
          { name: '💵 Tiền mặt còn lại', value: `${updatedUser.money.toLocaleString()} 🪙`, inline: true },
          { name: '🏦 Tiền trong ngân hàng', value: `${updatedUser.bank.toLocaleString()} 🪙`, inline: true },
          { name: '💎 Tổng tài sản', value: `${(updatedUser.money + updatedUser.bank).toLocaleString()} 🪙`, inline: true }
        )
        .setColor(message.client.config.embedColors.success)
        .setTimestamp()
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
      
      await message.reply({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder()
        .setTitle('❌ Lỗi')
        .setDescription('Có lỗi xảy ra khi gửi tiền!')
        .setColor(message.client.config.embedColors.error);
      
      await message.reply({ embeds: [embed] });
    }
  }
};
