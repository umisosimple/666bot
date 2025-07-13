const { EmbedBuilder } = require('discord.js');
const { EconomyDatabase } = require('../../database/economy');

module.exports = {
  data: {
    name: 'daily',
    description: 'Nhận phần thưởng hàng ngày',
    usage: 'daily',
    cooldown: 5,
    category: 'economy'
  },
  execute: async (message, args) => {
    const user = EconomyDatabase.getUser(message.author.id);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (now - user.daily < oneDay) {
      const timeLeft = oneDay - (now - user.daily);
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      
      const embed = new EmbedBuilder()
        .setTitle('⏰ Phần thưởng hàng ngày')
        .setDescription(`Bạn đã nhận phần thưởng hôm nay rồi!\nHãy quay lại sau **${hours}h ${minutes}m**`)
        .setColor(message.client.config.embedColors.error)
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    }
    
    // Tính toán streak
    const isConsecutive = (now - user.daily) < (oneDay + 60 * 60 * 1000); // 25 giờ tolerance
    if (isConsecutive && user.daily > 0) {
      user.streak.daily++;
    } else {
      user.streak.daily = 1;
    }
    
    // Tính phần thưởng
    const baseReward = 500;
    const streakBonus = user.streak.daily * 50;
    const levelBonus = user.level * 25;
    const totalReward = baseReward + streakBonus + levelBonus;
    
    // Cập nhật dữ liệu
    user.daily = now;
    user.money += totalReward;
    user.exp += 25;
    
    // Kiểm tra level up
    const expNeeded = user.level * 100;
    if (user.exp >= expNeeded) {
      user.level++;
      user.exp -= expNeeded;
    }
    
    EconomyDatabase.updateUser(message.author.id, user);
    
    const rewardEmbed = new EmbedBuilder()
      .setTitle('🎁 Phần thưởng hàng ngày!')
      .setDescription(`Bạn đã nhận được **${totalReward.toLocaleString()} 🪙**!`)
      .addFields(
        { name: '💰 Phần thưởng cơ bản', value: `${baseReward.toLocaleString()} 🪙`, inline: true },
        { name: '🔥 Streak bonus', value: `${streakBonus.toLocaleString()} 🪙`, inline: true },
        { name: '📊 Level bonus', value: `${levelBonus.toLocaleString()} 🪙`, inline: true },
        { name: '🔥 Streak hiện tại', value: `${user.streak.daily} ngày`, inline: true },
        { name: '💵 Số dư mới', value: `${user.money.toLocaleString()} 🪙`, inline: true },
        { name: '📊 Level', value: `${user.level} (${user.exp}/${user.level * 100} EXP)`, inline: true }
      )
      .setColor(message.client.config.embedColors.success)
      .setTimestamp()
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
    
    await message.reply({ embeds: [rewardEmbed] });
  }
};
