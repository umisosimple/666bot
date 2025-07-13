const { EmbedBuilder } = require('discord.js');
const { EconomyDatabase } = require('../../database/economy');

module.exports = {
  data: {
    name: 'withdraw',
    description: 'Rút tiền từ ngân hàng',
    usage: 'withdraw <amount|all>',
    aliases: ['with'],
    cooldown: 3,
    category: 'economy'
  },
  execute: async (message, args) => {
    const user = EconomyDatabase.getUser(message.author.id);
    
    if (!args[0]) {
      const embed = new EmbedBuilder()
        .setTitle('🏦 Rút tiền')
        .setDescription('Vui lòng nhập số tiền muốn rút!')
        .addFields(
          { name: 'Cách sử dụng:', value: `\`${message.client.config.prefix}withdraw <số tiền>\`` },
          { name: 'Ví dụ:', value: `\`${message.client.config.prefix}withdraw 1000\`` },
          { name: 'Rút toàn bộ:', value: `\`${message.client.config.prefix}withdraw all\`` }
        )
        .setColor(message.client.config.embedColors.warning);
      
      return message.reply({ embeds: [embed] });
    }
    
    let amount;
    if (args[0].toLowerCase() === 'all') {
      amount = user.bank;
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
    
    if (amount > user.bank) {
      const embed = new EmbedBuilder()
        .setTitle('🏦 Không đủ tiền trong ngân hàng')
        .setDescription(`Bạn chỉ có **${user.bank.toLocaleString()} 🪙** trong ngân hàng!`)
        .setColor(message.client.config.embedColors.error);
      
      return message.reply({ embeds: [embed] });
    }
    
    const success = EconomyDatabase.withdrawFromBank(message.author.id, amount);
    
    if (success) {
      const updatedUser = EconomyDatabase.getUser(message.author.id);
      
      const embed = new EmbedBuilder()
        .setTitle('🏦 Rút tiền thành công!')
        .setDescription(`Bạn đã rút **${amount.toLocaleString()} 🪙** từ ngân hàng!`)
        .addFields(
          { name: '💵 Tiền mặt', value: `${updatedUser.money.toLocaleString()} 🪙`, inline: true },
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
        .setDescription('Có lỗi xảy ra khi rút tiền!')
        .setColor(message.client.config.embedColors.error);
      
      await message.reply({ embeds: [embed] });
    }
  }
};
