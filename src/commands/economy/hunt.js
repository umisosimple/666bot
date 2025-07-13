const { EmbedBuilder } = require('discord.js');
const { EconomyDatabase } = require('../../database/economy');

module.exports = {
  data: {
    name: 'hunt',
    description: 'Đi săn động vật để kiếm tiền',
    usage: 'hunt',
    aliases: ['hunting'],
    cooldown: 10,
    category: 'economy'
  },
  execute: async (message, args) => {
    const user = EconomyDatabase.getUser(message.author.id);
    const now = Date.now();
    const cooldown = 60 * 1000; // 1 phút
    
    if (now - (user.lastHunt || 0) < cooldown) {
      const timeLeft = Math.ceil((cooldown - (now - (user.lastHunt || 0))) / 1000);
      const embed = new EmbedBuilder()
        .setTitle('🏹 Săn bắn')
        .setDescription(`Bạn đang nghỉ ngơi! Đợi **${timeLeft}** giây nữa.`)
        .setColor(message.client.config.embedColors.error);
      
      return message.reply({ embeds: [embed] });
    }
    
    // Kiểm tra có cung săn không
    const hasHuntingBow = user.inventory && user.inventory.hunting_bow;
    const baseSuccessRate = 55;
    const bowBonus = hasHuntingBow ? 25 : 0;
    const levelBonus = Math.floor(user.level * 2);
    const successRate = Math.min(baseSuccessRate + bowBonus + levelBonus, 85);
    
    const isSuccess = Math.random() * 100 < successRate;
    
    user.lastHunt = now;
    
    if (isSuccess) {
      // Danh sách động vật
      const animals = [
        { name: '🐰 Thỏ rừng', value: 150, rarity: 'common', chance: 35 },
        { name: '🦌 Hươu', value: 300, rarity: 'common', chance: 25 },
        { name: '🐗 Heo rừng', value: 450, rarity: 'uncommon', chance: 20 },
        { name: '🐺 Sói', value: 600, rarity: 'uncommon', chance: 12 },
        { name: '🐻 Gấu', value: 900, rarity: 'rare', chance: 5 },
        { name: '🦅 Đại bàng', value: 1200, rarity: 'rare', chance: 2.5 },
        { name: '🐯 Hổ', value: 2000, rarity: 'legendary', chance: 0.5 }
      ];
      
      // Chọn động vật dựa trên tỷ lệ
      const random = Math.random() * 100;
      let cumulativeChance = 0;
      let huntedAnimal = animals[0]; // default
      
      for (const animal of animals) {
        cumulativeChance += animal.chance;
        if (random <= cumulativeChance) {
          huntedAnimal = animal;
          break;
        }
      }
      
      // Tính toán thu nhập
      const baseValue = huntedAnimal.value;
      const bowMultiplier = hasHuntingBow ? 1.25 : 1;
      const levelMultiplier = 1 + (user.level * 0.12);
      const totalValue = Math.floor(baseValue * bowMultiplier * levelMultiplier);
      
      // Cập nhật dữ liệu
      user.money += totalValue;
      user.exp += 15;
      
      // Cập nhật thống kê săn bắn
      if (!user.huntingStats) {
        user.huntingStats = { totalHunted: 0, bestHunt: null };
      }
      user.huntingStats.totalHunted++;
      if (!user.huntingStats.bestHunt || totalValue > user.huntingStats.bestHunt.value) {
        user.huntingStats.bestHunt = { name: huntedAnimal.name, value: totalValue };
      }
      
      // Level up
      const expNeeded = user.level * 100;
      if (user.exp >= expNeeded) {
        user.level++;
        user.exp -= expNeeded;
      }
      
      EconomyDatabase.updateUser(message.author.id, user);
      
      const rarityColors = {
        'common': 0x95a5a6,
        'uncommon': 0x3498db,
        'rare': 0x9b59b6,
        'legendary': 0xf39c12
      };
      
      const huntEmbed = new EmbedBuilder()
        .setTitle('🏹 Săn bắn thành công!')
        .setDescription(`Bạn đã săn được ${huntedAnimal.name}!`)
        .addFields(
          { name: '🎯 Con mồi:', value: huntedAnimal.name, inline: true },
          { name: '💰 Giá trị:', value: `${totalValue.toLocaleString()} 🪙`, inline: true },
          { name: '⭐ Độ hiếm:', value: huntedAnimal.rarity, inline: true },
          { name: '📈 EXP:', value: `+15 EXP`, inline: true },
          { name: '💵 Số dư:', value: `${user.money.toLocaleString()} 🪙`, inline: true },
          { name: '🎯 Tổng săn được:', value: `${user.huntingStats.totalHunted}`, inline: true }
        )
        .setColor(rarityColors[huntedAnimal.rarity])
        .setTimestamp()
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
      
      if (hasHuntingBow) {
        huntEmbed.setFooter({ text: 'Bonus từ cung săn chuyên nghiệp!' });
      }
      
      await message.reply({ embeds: [huntEmbed] });
      
    } else {
      // Săn bắn thất bại
      const failMessages = [
        'Động vật đã phát hiện ra bạn và bỏ chạy!',
        'Mũi tên bắn trượt mục tiêu!',
        'Bạn làm ồn và làm động vật sợ hãi!',
        'Không tìm thấy động vật nào...',
        'Thời tiết không thuận lợi để săn!'
      ];
      
      const failMessage = failMessages[Math.floor(Math.random() * failMessages.length)];
      
      // Vẫn nhận được ít EXP
      user.exp += 5;
      EconomyDatabase.updateUser(message.author.id, user);
      
      const failEmbed = new EmbedBuilder()
        .setTitle('🏹 Săn bắn thất bại!')
        .setDescription(failMessage)
        .addFields(
          { name: '📈 EXP nhận được:', value: `+5 EXP (kinh nghiệm)`, inline: true },
          { name: '🎯 Tỷ lệ thành công:', value: `${successRate}%`, inline: true },
          { name: '💡 Mẹo:', value: 'Mua cung săn để tăng tỷ lệ!', inline: true }
        )
        .setColor(message.client.config.embedColors.error)
        .setTimestamp()
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
      
      await message.reply({ embeds: [failEmbed] });
    }
  }
};