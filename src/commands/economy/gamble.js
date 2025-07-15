const { EmbedBuilder } = require('discord.js');
const EconomyDatabase = require('../../database/economy'); // Đã sửa cách require

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
    const userId = message.author.id;
    const user = EconomyDatabase.getUser(userId);
    
    const colors = {
      success: message.client.config?.embedColors?.success || '#43EA97',
      error: message.client.config?.embedColors?.error || '#FF89A0',
      warning: message.client.config?.embedColors?.warning || '#FFD580',
      info: message.client.config?.embedColors?.info || '#0099ff'
    };
    
    const prefix = message.client.config?.prefix || '!';
    
    if (!args[0]) {
      const embed = new EmbedBuilder()
        .setTitle('🎰 Cá cược')
        .setDescription('Vui lòng nhập số tiền muốn cá cược!')
        .addFields(
          { name: 'Cách sử dụng:', value: `\`${prefix}gamble <số tiền>\`` },
          { name: 'Ví dụ:', value: `\`${prefix}gamble 100\`` },
          { name: 'Cược tất cả:', value: `\`${prefix}gamble all\`` }
        )
        .setColor(colors.warning);
      
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
        .addFields({
          name: 'Ví dụ hợp lệ:',
          value: `\`${prefix}gamble 100\`\n\`${prefix}gamble all\``
        })
        .setColor(colors.error);
      
      return message.reply({ embeds: [embed] });
    }
    
    if (amount > user.money) {
      const embed = new EmbedBuilder()
        .setTitle('💸 Không đủ tiền')
        .setDescription(`Bạn chỉ có **${user.money.toLocaleString()} 🪙** trong ví!`)
        .addFields({
          name: 'Gợi ý:',
          value: `Sử dụng \`${prefix}work\` hoặc \`${prefix}daily\` để kiếm thêm tiền!`
        })
        .setColor(colors.error);
      
      return message.reply({ embeds: [embed] });
    }
    
    const minBet = 10;
    const maxBet = 10000;
    
    if (amount < minBet) {
      const embed = new EmbedBuilder()
        .setTitle('📉 Cá cược quá nhỏ')
        .setDescription(`Số tiền cá cược tối thiểu là **${minBet.toLocaleString()} 🪙**`)
        .addFields({
          name: 'Số tiền hiện tại:',
          value: `${user.money.toLocaleString()} 🪙`
        })
        .setColor(colors.error);
      
      return message.reply({ embeds: [embed] });
    }
    
    if (amount > maxBet) {
      const embed = new EmbedBuilder()
        .setTitle('📈 Cá cược quá lớn')
        .setDescription(`Số tiền cá cược tối đa là **${maxBet.toLocaleString()} 🪙**`)
        .addFields({
          name: 'Gợi ý:',
          value: `Hãy chia nhỏ số tiền cược để giảm rủi ro!`
        })
        .setColor(colors.error);
      
      return message.reply({ embeds: [embed] });
    }
    
    const isWin = Math.random() < 0.49;
    
    if (isWin) {
      const winAmount = amount;
      EconomyDatabase.addMoney(userId, winAmount);
      
      const levelUpResult = EconomyDatabase.addExp(userId, 5); // Thêm EXP
      
      const updatedUser = EconomyDatabase.getUser(userId); // Lấy lại user sau khi cập nhật
      
      const winEmbed = new EmbedBuilder()
        .setTitle('🎉 Thắng cá cược!')
        .setDescription(`Chúc mừng! Bạn đã thắng **${winAmount.toLocaleString()} 🪙**!`)
        .addFields(
          { name: '💰 Tiền cược', value: `${amount.toLocaleString()} 🪙`, inline: true },
          { name: '🎁 Tiền thắng', value: `${winAmount.toLocaleString()} 🪙`, inline: true },
          { name: '💵 Số dư mới', value: `${updatedUser.money.toLocaleString()} 🪙`, inline: true },
          { name: '⭐ EXP nhận được', value: '+5 EXP', inline: true },
          { name: '📊 Tổng EXP', value: `${updatedUser.exp} EXP`, inline: true },
          { name: '🎯 Tỷ lệ thắng', value: '49%', inline: true }
        )
        .setColor(colors.success)
        .setTimestamp()
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setFooter({ 
          text: `${message.author.username} • Chúc mừng!`,
          iconURL: message.author.displayAvatarURL({ dynamic: true })
        });
      
      await message.reply({ embeds: [winEmbed] });

      if (levelUpResult) {
        setTimeout(() => {
          message.channel.send({ content: levelUpResult.message });
        }, 1000);
      }

    } else {
      EconomyDatabase.removeMoney(userId, amount);
      const updatedUser = EconomyDatabase.getUser(userId); // Lấy lại user sau khi cập nhật
      
      const loseEmbed = new EmbedBuilder()
        .setTitle('💸 Thua cá cược!')
        .setDescription(`Rất tiếc! Bạn đã mất **${amount.toLocaleString()} 🪙**!`)
        .addFields(
          { name: '💸 Tiền mất', value: `${amount.toLocaleString()} 🪙`, inline: true },
          { name: '💵 Số dư còn lại', value: `${updatedUser.money.toLocaleString()} 🪙`, inline: true },
          { name: '🎯 Tỷ lệ thắng', value: '49%', inline: true },
          { name: '💡 Lời khuyên', value: 'Hãy cẩn thận khi cá cược!\nChỉ cược số tiền bạn có thể mất!', inline: false },
          { name: '🔄 Kiếm tiền:', value: `\`${prefix}work\` • \`${prefix}daily\` • \`${prefix}hunt\``, inline: false }
        )
        .setColor(colors.error)
        .setTimestamp()
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setFooter({ 
          text: `${message.author.username} • Chúc may mắn lần sau!`,
          iconURL: message.author.displayAvatarURL({ dynamic: true })
        });
      
      await message.reply({ embeds: [loseEmbed] });
    }
  }
};
