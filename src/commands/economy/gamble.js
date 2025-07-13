const { EmbedBuilder } = require('discord.js');
const { EconomyDatabase } = require('../../database/economy');

module.exports = {
  data: {
    name: 'gamble',
    description: 'Cá cược với bot (50/50)',
    usage: 'gamble <amount>',
    aliases: ['bet'],
    cooldown: 10,
    category: 'economy'
  },
  execute: async (message, args) => {
    const user = EconomyDatabase.getUser(message.author.id);
    
    if (!args[0]) {
      const embed = new EmbedBuilder()
        .setTitle('🎰 Cá cược')
        .setDescription('Vui lòng nhập số tiền muốn cá cược!')
        .addFields(
          { name: 'Cách sử dụng:', value: `\`${message.client.config.prefix}gamble <số tiền>\`` },
          { name: 'Ví dụ:', value: `\`${message.client.config.prefix}gamble 100\`` }
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
    
    const minBet = 10;
    const maxBet = 10000;
    
    if (amount < minBet) {
      const embed = new EmbedBuilder()
        .setTitle('📉 Cá cược quá nhỏ')
        .setDescription(`Số tiền cá cược tối thiểu là **${minBet.toLocaleString()} 🪙**`)
        .setColor(message.client.config.embedColors.error);
      
      return message.reply({ embeds: [embed] });
    }
    
    if (amount > maxBet) {
      const embed = new EmbedBuilder()
        .setTitle('📈 Cá cược quá lớn')
        .setDescription(`Số tiền cá cược tối đa là **${maxBet.toLocaleString()} 🪙**`)
        .setColor(message.client.config.embedColors.error);
      
      return message.reply({ embeds: [embed] });
    }
    
    // Xác định thắng thua (49% thắng, 51% thua để house edge)
    const isWin = Math.random() < 0.49;
    
    if (isWin) {
      const winAmount = amount;
      user.money += winAmount;
      user.exp += 5;
      
      const winEmbed = new EmbedBuilder()
        .setTitle('🎉 Thắng cá cược!')
        .setDescription(`Chúc mừng! Bạn đã thắng **${winAmount.toLocaleString()} 🪙**!`)
        .addFields(
          { name: '💰 Tiền cược', value: `${amount.toLocaleString()} 🪙`, inline: true },
          { name: '🎁 Tiền thắng', value: `${winAmount.toLocaleString()} 🪙`, inline: true },
          { name: '💵 Số dư mới', value: `${user.money.toLocaleString()} 🪙`, inline: true }
        )
        .setColor(message.client.config.embedColors.success)
        .setTimestamp()
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
      
      EconomyDatabase.updateUser(message.author.id, user);
      return message.reply({ embeds: [winEmbed] });
    } else {
      user.money -= amount;
      
      const loseEmbed = new EmbedBuilder()
        .setTitle('💸 Thua cá cược!')
        .setDescription(`Rất tiếc! Bạn đã mất **${amount.toLocaleString()} 🪙**!`)
        .addFields(
          { name: '💸 Tiền mất', value: `${amount.toLocaleString()} 🪙`, inline: true },
          { name: '💵 Số dư còn lại', value: `${user.money.toLocaleString()} 🪙`, inline: true },
          { name: '💡 Lời khuyên', value: 'Hãy cẩn thận khi cá cược!', inline: true }
        )
        .setColor(message.client.config.embedColors.error)
        .setTimestamp()
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
      
      EconomyDatabase.updateUser(message.author.id, user);
      return message.reply({ embeds: [loseEmbed] });
    }
  }
};
