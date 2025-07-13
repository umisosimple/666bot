const { EmbedBuilder } = require('discord.js');
const { EconomyDatabase } = require('../../database/economy');

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
        .setTitle(`📦 Túi đồ của ${target.displayName}`)
        .setDescription('Túi đồ trống! Hãy mua vật phẩm tại cửa hàng.')
        .addFields(
          { name: '🏪 Cửa hàng:', value: `\`${message.client.config.prefix}shop\`` }
        )
        .setColor(message.client.config.embedColors.warning)
        .setThumbnail(target.displayAvatarURL({ dynamic: true }));
      
      return message.reply({ embeds: [embed] });
    }
    
    let inventoryDescription = '';
    
    // Hiển thị vật phẩm
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
        const purchaseDate = new Date(item.purchaseDate).toLocaleDateString('vi-VN');
        inventoryDescription += `${emoji} **${item.name}**\n`;
        inventoryDescription += `   📅 Mua: ${purchaseDate}\n`;
        inventoryDescription += `   📝 ${item.description}\n\n`;
      });
    }
    
    // Hiển thị thú cưng
    if (pets.length > 0) {
      inventoryDescription += '**🐾 Thú cưng:**\n';
      
      pets.forEach((pet, index) => {
        const petAge = Math.floor((Date.now() - pet.adoptDate) / (1000 * 60 * 60 * 24));
        inventoryDescription += `${pet.emoji} **${pet.name}** (${pet.species})\n`;
        inventoryDescription += `   💖 Độ thân thiết: ${pet.happiness}/100\n`;
        inventoryDescription += `   📊 Level: ${pet.level}\n`;
        inventoryDescription += `   🗓️ Tuổi: ${petAge} ngày\n\n`;
      });
    }
    
    // Tính tổng giá trị túi đồ
    let totalValue = 0;
    Object.values(inventory).forEach(item => {
      // Giá trị ước tính dựa trên loại vật phẩm
      const valueMultiplier = {
        'tool': 0.7,
        'accessory': 0.8,
        'consumable': 0.3,
        'upgrade': 0.9,
        'premium': 0.85
      };
      
      // Ước tính giá trị từ shop items (này sẽ cần reference từ shop.js)
      const estimatedValue = item.type === 'premium' ? 20000 : 
                           item.type === 'upgrade' ? 8000 :
                           item.type === 'accessory' ? 4000 :
                           item.type === 'tool' ? 2750 : 1200;
      
      totalValue += Math.floor(estimatedValue * (valueMultiplier[item.type] || 0.5));
    });
    
    const inventoryEmbed = new EmbedBuilder()
      .setTitle(`📦 Túi đồ của ${target.displayName}`)
      .setDescription(inventoryDescription)
      .addFields(
        { name: '📊 Thống kê:', value: `**${Object.keys(inventory).length}** vật phẩm | **${pets.length}** thú cưng`, inline: true },
        { name: '💰 Tổng giá trị:', value: `~${totalValue.toLocaleString()} 🪙`, inline: true },
        { name: '🏪 Mua thêm:', value: `\`${message.client.config.prefix}shop\``, inline: true }
      )
      .setColor(message.client.config.embedColors.info)
      .setTimestamp()
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'Túi đồ • Sưu tập của bạn' });
    
    await message.reply({ embeds: [inventoryEmbed] });
  }
};
