const { EmbedBuilder } = require('discord.js');
const EconomyDatabase = require('../../database/economy'); // Đã sửa cách require

module.exports = {
  data: {
    name: 'inventory',
    description: 'Xem túi đồ của bạn',
    usage: 'inventory [@user]',
    aliases: ['inv', 'bag'],
    cooldown: 3,
    category: 'economy'
  },
  execute: async (message, args) => {
    const target = message.mentions.users.first() || message.author;
    const user = EconomyDatabase.getUser(target.id);
    
    const inventory = user.inventory || {};
    const pets = user.pets || [];
    
    if (Object.keys(inventory).length === 0 && pets.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle(`📦 Túi đồ của ${target.username}`)
        .setDescription('Túi đồ trống! Hãy mua vật phẩm tại cửa hàng.')
        .addFields(
          { name: '🏪 Cửa hàng:', value: `\`${message.client.config?.prefix || '!'}shop\`` }
        )
        .setColor('#FFD580')
        .setThumbnail(target.displayAvatarURL({ dynamic: true }));
      
      return message.reply({ embeds: [embed] });
    }
    
    let inventoryDescription = '';
    
    if (Object.keys(inventory).length > 0) {
      inventoryDescription += '**🎒 Vật phẩm:**\n';
      
      const typeEmojis = {
        'tool': '🔧',
        'accessory': '💎',
        'consumable': '🧪',
        'upgrade': '⬆️',
        'premium': '👑'
      };
      
      Object.entries(inventory).forEach(([itemId, item]) => {
        const emoji = typeEmojis[item.type] || '📦';
        const purchaseDate = item.purchaseDate ? 
          new Date(item.purchaseDate).toLocaleDateString('vi-VN') : 'Không xác định';
        inventoryDescription += `${emoji} **${item.name}**\n`;
        inventoryDescription += `   📅 Mua: ${purchaseDate}\n`;
        inventoryDescription += `   📝 ${item.description}\n\n`;
      });
    }
    
    if (pets.length > 0) {
      inventoryDescription += '**🐾 Thú cưng:**\n';
      
      pets.forEach((pet) => {
        const petAge = pet.adoptDate ? 
          Math.floor((Date.now() - pet.adoptDate) / (1000 * 60 * 60 * 24)) : 0;
        inventoryDescription += `${pet.emoji || '🐾'} **${pet.name}** (${pet.species})\n`;
        inventoryDescription += `   💖 Độ thân thiết: ${pet.happiness || 0}/100\n`;
        inventoryDescription += `   📊 Level: ${pet.level || 1}\n`;
        inventoryDescription += `   🗓️ Tuổi: ${petAge} ngày\n\n`;
      });
    }
    
    const shopItems = { // Cần đảm bảo shopItems này khớp với shop.js
      'fishing_rod': { price: 2500, type: 'tool' },
      'hunting_bow': { price: 3000, type: 'tool' },
      'lucky_charm': { price: 5000, type: 'accessory' },
      'exp_booster': { price: 1500, type: 'consumable' },
      'bank_upgrade': { price: 10000, type: 'upgrade' },
      'vip_pass': { price: 25000, type: 'premium' },
      'fishing_rod_pro': { price: 5000, type: 'tool' },
      'hunting_bow_pro': { price: 6000, type: 'tool' },
      'golden_charm': { price: 10000, type: 'accessory' }
    };
    
    let totalValue = 0;
    Object.entries(inventory).forEach(([itemId, item]) => {
      const shopItem = shopItems[itemId];
      if (shopItem) {
        const originalPrice = shopItem.price;
        const valueMultiplier = {
          'tool': 0.7,
          'accessory': 0.8,
          'consumable': 0.3,
          'upgrade': 0.9,
          'premium': 0.85
        };
        totalValue += Math.floor(originalPrice * (valueMultiplier[item.type] || 0.5));
      }
    });
    
    const inventoryEmbed = new EmbedBuilder()
      .setTitle(`📦 Túi đồ của ${target.username}`)
      .setDescription(inventoryDescription)
      .addFields(
        { name: '📊 Thống kê:', value: `**${Object.keys(inventory).length}** vật phẩm | **${pets.length}** thú cưng`, inline: true },
        { name: '💰 Tổng giá trị:', value: `~${totalValue.toLocaleString()} 🪙`, inline: true },
        { name: '🏪 Mua thêm:', value: `\`${message.client.config?.prefix || '!'}shop\``, inline: true }
      )
      .setColor('#00BFFF')
      .setTimestamp()
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'Túi đồ • Sưu tập của bạn' });
    
    await message.reply({ embeds: [inventoryEmbed] });
  }
};
