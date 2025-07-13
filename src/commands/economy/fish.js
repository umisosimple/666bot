const { EmbedBuilder } = require('discord.js');
const { EconomyDatabase } = require('../../database/economy');

module.exports = {
  data: {
    name: 'fish',
    description: 'Đi câu cá để kiếm tiền',
    usage: 'fish',
    aliases: ['fishing'],
    cooldown: 8,
    category: 'economy'
  },
  execute: async (message, args) => {
    const user = EconomyDatabase.getUser(message.author.id);
    const now = Date.now();
    const cooldown = 45 * 1000; // 45 giây
    
    if (now - (user.lastFish || 0) < cooldown) {
      const timeLeft = Math.ceil((cooldown - (now - (user.lastFish || 0))) / 1000);
      const embed = new EmbedBuilder()
        .setTitle('🎣 Câu cá')
        .setDescription(`Bạn đang chuẩn bị câu cá! Đợi **${timeLeft}** giây nữa.`)
        .setColor(message.client.config.embedColors.error);
      
      return message.reply({ embeds: [embed] });
    }
    
    // Kiểm tra có cần câu cao cấp không
    const hasFishingRod = user.inventory && user.inventory.fishing_rod;
    const baseSuccessRate = 65;
    const rodBonus = hasFishingRod ? 20 : 0;
    const levelBonus = Math.floor(user.level * 1.5);
    const successRate = Math.min(baseSuccessRate + rodBonus + levelBonus, 90);
    
    const isSuccess = Math.random() * 100 < successRate;
    
    user.lastFish = now;
    
    if (isSuccess) {
      // Danh sách cá
      const fishTypes = [
        { name: '🐟 Cá nhỏ', value: 80, rarity: 'common', chance: 40 },
        { name: '🐠 Cá nhiệt đới', value: 120, rarity: 'common', chance: 25 },
        { name: '🐡 Cá nóc', value: 180, rarity: 'uncommon', chance: 15 },
        { name: '🦈 Cá mập nhỏ', value: 250, rarity: 'uncommon', chance: 10 },
        { name: '🐙 Bạch tuộc', value: 350, rarity: 'rare', chance: 6 },
        { name: '🦑 Mực khổng lồ', value: 500, rarity: 'rare', chance: 3 },
        { name: '🐋 Cá voi', value: 1000, rarity: 'legendary', chance: 1 }
      ];
      
      // Chọn cá dựa trên tỷ lệ
      const random = Math.random() * 100;
      let cumulativeChance = 0;
      let caughtFish = fishTypes[0]; // default
      
      for (const fish of fishTypes) {
        cumulativeChance += fish.chance;
        if (random <= cumulativeChance) {
          caughtFish = fish;
          break;
        }
      }
      
      // Tính toán thu nhập
      const baseValue = caughtFish.value;
      const rodMultiplier = hasFishingRod ? 1.2 : 1;
      const levelMultiplier = 1 + (user.level * 0.1);
      const totalValue = Math.floor(baseValue * rodMultiplier * levelMultiplier);
      
      // Cập nhật dữ liệu
      user.money += totalValue;
      user.exp += 12;
      
      // Cập nhật thống kê câu cá
      if (!user.fishingStats) {
        user.fishingStats = { totalCaught: 0, bestFish: null };
      }
      user.fishingStats.totalCaught++;
      if (!user.fishingStats.bestFish || totalValue > user.fishingStats.bestFish.value) {
        user.fishingStats.bestFish = { name: caughtFish.name, value: totalValue };
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
      
      const fishEmbed = new EmbedBuilder()
        .setTitle('🎣 Câu cá thành công!')
        .setDescription(`Bạn đã câu được ${caughtFish.name}!`)
        .addFields(
          { name: '🐟 Loại cá:', value: caughtFish.name, inline: true },
          { name: '💰 Giá trị:', value: `${totalValue.toLocaleString()} 🪙`, inline: true },
          { name: '⭐ Độ hiếm:', value: caughtFish.rarity, inline: true },
          { name: '📈 EXP:', value: `+12 EXP`, inline: true },
          { name: '💵 Số dư:', value: `${user.money.toLocaleString()} 🪙`, inline: true },
          { name: '🎯 Tổng cá câu:', value: `${user.fishingStats.totalCaught}`, inline: true }
        )
        .setColor(rarityColors[caughtFish.rarity])
        .setTimestamp()
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
      
      if (hasFishingRod) {
        fishEmbed.setFooter({ text: 'Bonus từ cần câu cao cấp!' });
      }
      
      await message.reply({ embeds: [fishEmbed] });
      
    } else {
      // Câu cá thất bại
      const failMessages = [
        'Cá đã cắn câu nhưng bỏ chạy!',
        'Cần câu của bạn bị kẹt!',
        'Không có cá nào cắn câu...',
        'Bạn làm ồn quá, cá sợ hết rồi!',
        'Mồi câu bị rơi mất!'
      ];
      
      const failMessage = failMessages[Math.floor(Math.random() * failMessages.length)];
      
      // Vẫn nhận được ít EXP
      user.exp += 3;
      EconomyDatabase.updateUser(message.author.id, user);
      
      const failEmbed = new EmbedBuilder()
        .setTitle('🎣 Câu cá thất bại!')
        .setDescription(failMessage)
        .addFields(
          { name: '📈 EXP nhận được:', value: `+3 EXP (kinh nghiệm)`, inline: true },
          { name: '🎯 Tỷ lệ thành công:', value: `${successRate}%`, inline: true },
          { name: '💡 Mẹo:', value: 'Mua cần câu cao cấp để tăng tỷ lệ!', inline: true }
        )
        .setColor(message.client.config.embedColors.error)
        .setTimestamp()
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
      
      await message.reply({ embeds: [failEmbed] });
    }
  }
};