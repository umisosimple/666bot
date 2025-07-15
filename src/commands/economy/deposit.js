const { EmbedBuilder } = require('discord.js');
const EconomyDatabase = require('../../database/economy'); // Đã sửa cách require

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
          { name: 'Cách sử dụng:', value: `\`${message.client.config?.prefix || '!'}deposit <số tiền>\`` },
          { name: 'Ví dụ:', value: `\`${message.client.config?.prefix || '!'}deposit 1000\`` },
          { name: 'Gửi toàn bộ:', value: `\`${message.client.config?.prefix || '!'}deposit all\`` }
        )
        .setColor('#FFD580');
      
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
        .setColor(' #FF89A0');
      
      return message.reply({ embeds: [embed] });
    }
    
    if (amount > user.money) {
      const embed = new EmbedBuilder()
        .setTitle('💸 Không đủ tiền')
        .setDescription(`Bạn chỉ có **${user.money.toLocaleString()} 🪙** trong ví!`)
        .setColor('#FF89A0');
      
      return message.reply({ embeds: [embed] });
    }
    
    user.money -= amount;
    user.bank += amount;
    EconomyDatabase.updateUser(message.author.id, user);
    
    const embed = new EmbedBuilder()
      .setTitle('🏦 Gửi tiền thành công!')
      .setDescription(`Bạn đã gửi **${amount.toLocaleString()} 🪙** vào ngân hàng!`)
      .addFields(
        { name: '💵 Tiền mặt còn lại', value: `${user.money.toLocaleString()} 🪙`, inline: true },
        { name: '🏦 Tiền trong ngân hàng', value: `${user.bank.toLocaleString()} 1🪙`, inline: true },
        { name: '💎 Tổng tài sản', value: `${(user.money + user.bank).toLocaleString()} 🪙`, inline: true }
      )
      .setColor('#43EA97')
      .setTimestamp()
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
    
    await message.reply({ embeds: [embed] });
  }
};
