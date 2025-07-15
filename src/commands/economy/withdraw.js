const { EmbedBuilder } = require('discord.js');
const EconomyDatabase = require('../../database/economy');

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
          { name: 'Cách sử dụng:', value: `\`${message.client.config?.prefix || '!'}withdraw <số tiền>\`` },
          { name: 'Ví dụ:', value: `\`${message.client.config?.prefix || '!'}withdraw 1000\`` },
          { name: 'Rút toàn bộ:', value: `\`${message.client.config?.prefix || '!'}withdraw all\`` }
        )
        .addFields(
          { name: '💵 Tiền mặt hiện tại:', value: `${user.money.toLocaleString()} 🪙`, inline: true },
          { name: '🏦 Tiền trong ngân hàng:', value: `${user.bank.toLocaleString()} 🪙`, inline: true }
        )
        .setColor('#00BFFF')
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
      
      return message.reply({ embeds: [embed] });
    }
    
    let amount;
    let isWithdrawAll = false;
    
    if (args[0].toLowerCase() === 'all') {
      amount = user.bank;
      isWithdrawAll = true;
    } else {
      amount = parseInt(args[0]);
    }
    
    if (isNaN(amount) || amount <= 0) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Lỗi')
        .setDescription('Vui lòng nhập số tiền hợp lệ!')
        .addFields(
          { name: '💡 Gợi ý:', value: 'Sử dụng số nguyên dương hoặc "all" để rút toàn bộ' }
        )
        .setColor('#FFD580')
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
      
      return message.reply({ embeds: [embed] });
    }
    
    if (amount > user.bank) {
      const embed = new EmbedBuilder()
        .setTitle('🏦 Không đủ tiền trong ngân hàng')
        .setDescription(`Bạn chỉ có **${user.bank.toLocaleString()} 🪙** trong ngân hàng!`)
        .addFields(
          { name: '💡 Gợi ý:', value: `Hãy rút tối đa **${user.bank.toLocaleString()} 🪙** hoặc sử dụng \`${message.client.config?.prefix || '!'}withdraw all\`` }
        )
        .setColor('#FF89A0')
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
      
      return message.reply({ embeds: [embed] });
    }
    
    // Kiểm tra nếu ngân hàng trống
    if (user.bank === 0) {
      const embed = new EmbedBuilder()
        .setTitle('🏦 Ngân hàng trống')
        .setDescription('Bạn không có tiền trong ngân hàng để rút!')
        .addFields(
          { name: '💡 Gợi ý:', value: `Sử dụng \`${message.client.config?.prefix || '!'}deposit\` để gửi tiền vào ngân hàng` }
        )
        .setColor('#FF89A0')
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
      
      return message.reply({ embeds: [embed] });
    }
    
    // Lưu số tiền trước khi thay đổi để hiển thị
    const oldMoney = user.money;
    const oldBank = user.bank;
    
    // Thực hiện giao dịch
    user.bank -= amount;
    user.money += amount;
    EconomyDatabase.updateUser(message.author.id, user);
    
    // Tạo embed thông báo thành công
    const embed = new EmbedBuilder()
      .setTitle('✅ Rút tiền thành công!')
      .setDescription(isWithdrawAll ? 
        `Bạn đã rút **toàn bộ ${amount.toLocaleString()} 🪙** từ ngân hàng!` : 
        `Bạn đã rút **${amount.toLocaleString()} 🪙** từ ngân hàng!`)
      .addFields(
        { name: '📊 Thông tin giao dịch:', value: '\u200b' },
        { name: '💰 Số tiền rút:', value: `${amount.toLocaleString()} 🪙`, inline: true },
        { name: '⏰ Thời gian:', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: '💵 Tiền mặt:', value: `${oldMoney.toLocaleString()} 🪙 ➜ ${user.money.toLocaleString()} 🪙`, inline: true },
        { name: '🏦 Ngân hàng:', value: `${oldBank.toLocaleString()} 🪙 ➜ ${user.bank.toLocaleString()} 🪙`, inline: true },
        { name: '💎 Tổng tài sản:', value: `${(user.money + user.bank).toLocaleString()} 🪙`, inline: true }
      )
      .setColor('#43EA97')
      .setTimestamp()
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setFooter({ 
        text: `ID: ${message.author.id}`, 
        iconURL: message.client.user.displayAvatarURL() 
      });
    
    await message.reply({ embeds: [embed] });
  }
};