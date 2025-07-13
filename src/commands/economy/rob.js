const { EmbedBuilder } = require('discord.js');
const { EconomyDatabase } = require('../../database/economy');

module.exports = {
  data: {
    name: 'rob',
    description: 'Cướp tiền của người khác (có rủi ro)',
    usage: 'rob <@user>',
    aliases: ['steal'],
    cooldown: 10,
    category: 'economy'
  },
  execute: async (message, args) => {
    const user = EconomyDatabase.getUser(message.author.id);
    const now = Date.now();
    const cooldown = 2 * 60 * 60 * 1000; // 2 giờ
    
    if (now - (user.lastRob || 0) < cooldown) {
      const timeLeft = Math.ceil((cooldown - (now - (user.lastRob || 0))) / (1000 * 60 * 60));
      const embed = new EmbedBuilder()
        .setTitle('🕵️ Cướp tiền')
        .setDescription(`Cảnh sát đang theo dõi bạn! Hãy đợi **${timeLeft}** giờ nữa.`)
        .setColor(message.client.config.embedColors.error);
      
      return message.reply({ embeds: [embed] });
    }
    
    const target = message.mentions.users.first();
    if (!target) {
      const embed = new EmbedBuilder()
        .setTitle('🕵️ Cướp tiền')
        .setDescription('Vui lòng mention người bạn muốn cướp!')
        .addFields(
          { name: 'Cách sử dụng:', value: `\`${message.client.config.prefix}rob @user\`` }
        )
        .setColor(message.client.config.embedColors.warning);
      
      return message.reply({ embeds: [embed] });
    }
    
    if (target.id === message.author.id) {
      const embed = new EmbedBuilder()
        .setTitle('🤦‍♂️ Lỗi')
        .setDescription('Bạn không thể cướp chính mình!')
        .setColor(message.client.config.embedColors.error);
      
      return message.reply({ embeds: [embed] });
    }
    
    if (target.bot) {
      const embed = new EmbedBuilder()
        .setTitle('🤖 Lỗi')
        .setDescription('Bạn không thể cướp bot!')
        .setColor(message.client.config.embedColors.error);
      
      return message.reply({ embeds: [embed] });
    }
    
    const targetUser = EconomyDatabase.getUser(target.id);
    
    if (targetUser.money < 100) {
      const embed = new EmbedBuilder()
        .setTitle('💸 Mục tiêu quá nghèo')
        .setDescription(`${target.displayName} không có đủ tiền để cướp! (tối thiểu 100 🪙)`)
        .setColor(message.client.config.embedColors.error);
      
      return message.reply({ embeds: [embed] });
    }
    
    // Tính xác suất thành công (40% base + level bonus)
    const successRate = Math.min(40 + (user.level * 2), 70);
    const isSuccess = Math.random() * 100 < successRate;
    
    user.lastRob = now;
    
    if (isSuccess) {
      // Cướp thành công
      const maxSteal = Math.floor(targetUser.money * 0.3); // Tối đa 30% tiền của nạn nhân
      const stolenAmount = Math.floor(Math.random() * maxSteal) + 50;
      
      user.money += stolenAmount;
      targetUser.money -= stolenAmount;
      user.exp += 8;
      
      EconomyDatabase.updateUser(message.author.id, user);
      EconomyDatabase.updateUser(target.id, targetUser);
      
      const successEmbed = new EmbedBuilder()
        .setTitle('🕵️ Cướp thành công!')
        .setDescription(`Bạn đã cướp được **${stolenAmount.toLocaleString()} 🪙** từ ${target.displayName}!`)
        .addFields(
          { name: '💰 Tiền cướp được', value: `${stolenAmount.toLocaleString()} 🪙`, inline: true },
          { name: '💵 Số dư mới', value: `${user.money.toLocaleString()} 🪙`, inline: true },
          { name: '📊 EXP nhận được', value: `+8 EXP`, inline: true }
        )
        .setColor(message.client.config.embedColors.success)
        .setTimestamp()
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
      
      await message.reply({ embeds: [successEmbed] });
    } else {
      // Cướp thất bại
      const fine = Math.floor(Math.random() * 200) + 100;
      user.money = Math.max(0, user.money - fine);
      
      EconomyDatabase.updateUser(message.author.id, user);
      
      const failEmbed = new EmbedBuilder()
        .setTitle('🚨 Cướp thất bại!')
        .setDescription(`Bạn đã bị bắt và phải nộp phạt **${fine.toLocaleString()} 🪙**!`)
        .addFields(
          { name: '💸 Tiền phạt', value: `${fine.toLocaleString()} 🪙`, inline: true },
          { name: '💵 Số dư còn lại', value: `${user.money.toLocaleString()} 🪙`, inline: true },
          { name: '⚠️ Cảnh báo', value: 'Hãy cẩn thận hơn!', inline: true }
        )
        .setColor(message.client.config.embedColors.error)
        .setTimestamp()
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
      
      await message.reply({ embeds: [failEmbed] });
    }
  }
};
