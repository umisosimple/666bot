const { EmbedBuilder } = require('discord.js');
const { EconomyDatabase } = require('../../database/economy');

module.exports = {
  data: {
    name: 'shop',
    description: 'Xem cửa hàng và mua vật phẩm',
    usage: 'shop [buy <item>]',
    aliases: ['store'],
    cooldown: 3,
    category: 'economy'
  },
  execute: async (message, args) => {
    const shopItems = [
      { 
        id: 'fishing_rod', 
        name: '🎣 Cần câu cao cấp', 
        price: 2500, 
        description: 'Tăng 20% tỷ lệ câu cá thành công',
        type: 'tool'
      },
      { 
        id: 'hunting_bow', 
        name: '🏹 Cung săn chuyên nghiệp', 
        price: 3000, 
        description: 'Tăng 25% tỷ lệ săn thành công',
        type: 'tool'
      },
      { 
        id: 'lucky_charm', 
        name: '🍀 Bùa may mắn', 
        price: 5000, 
        description: 'Tăng 10% thu nhập từ mọi hoạt động',
        type: 'accessory'
      },
      { 
        id: 'exp_booster', 
        name: '⚡ Thuốc tăng EXP', 
        price: 1500, 
        description: 'Tăng gấp đôi EXP nhận được trong 1 giờ',
        type: 'consumable'
      },
      { 
        id: 'bank_upgrade', 
        name: '🏦 Nâng cấp ngân hàng', 
        price: 10000, 
        description: 'Tăng giới hạn ngân hàng lên 50%',
        type: 'upgrade'
      },
      { 
        id: 'vip_pass', 
        name: '👑 VIP Pass', 
        price: 25000, 
        description: 'Giảm 50% thời gian cooldown của tất cả lệnh',
        type: 'premium'
      }
    ];
    
    if (!args[0]) {
      // Hiển thị cửa hàng
      let shopDescription = '';
      
      shopItems.forEach((item, index) => {
        shopDescription += `**${index + 1}.** ${item.name}\n`;
        shopDescription += `💰 Giá: ${item.price.toLocaleString()} 🪙\n`;
        shopDescription += `📝 ${item.description}\n\n`;
      });
      
      const shopEmbed = new EmbedBuilder()
        .setTitle('🏪 Cửa hàng')
        .setDescription(shopDescription)
        .addFields(
          { name: '💡 Cách mua:', value: `\`${message.client.config.prefix}shop buy <tên vật phẩm>\`` },
          { name: '📦 Xem túi đồ:', value: `\`${message.client.config.prefix}inventory\`` }
        )
        .setColor(message.client.config.embedColors.info)
        .setTimestamp()
        .setFooter({ text: 'Mua sắm thông minh!' });
      
      return message.reply({ embeds: [shopEmbed] });
    }
    
    if (args[0].toLowerCase() === 'buy') {
      if (!args[1]) {
        const embed = new EmbedBuilder()
          .setTitle('🛒 Mua vật phẩm')
          .setDescription('Vui lòng chọn vật phẩm muốn mua!')
          .addFields(
            { name: 'Cách sử dụng:', value: `\`${message.client.config.prefix}shop buy <số thứ tự hoặc tên>\`` },
            { name: 'Ví dụ:', value: `\`${message.client.config.prefix}shop buy 1\`` }
          )
          .setColor(message.client.config.embedColors.warning);
        
        return message.reply({ embeds: [embed] });
      }
      
      const user = EconomyDatabase.getUser(message.author.id);
      let selectedItem;
      
      // Tìm vật phẩm theo số thứ tự hoặc tên
      const itemIndex = parseInt(args[1]) - 1;
      if (!isNaN(itemIndex) && itemIndex >= 0 && itemIndex < shopItems.length) {
        selectedItem = shopItems[itemIndex];
      } else {
        const itemName = args.slice(1).join(' ').toLowerCase();
        selectedItem = shopItems.find(item => 
          item.name.toLowerCase().includes(itemName) || 
          item.id.includes(itemName)
        );
      }
      
      if (!selectedItem) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Không tìm thấy vật phẩm')
          .setDescription('Vui lòng chọn vật phẩm hợp lệ!')
          .setColor(message.client.config.embedColors.error);
        
        return message.reply({ embeds: [embed] });
      }
      
      // Kiểm tra đã sở hữu
      if (user.inventory[selectedItem.id]) {
        const embed = new EmbedBuilder()
          .setTitle('📦 Đã sở hữu')
          .setDescription(`Bạn đã có ${selectedItem.name} rồi!`)
          .setColor(message.client.config.embedColors.warning);
        
        return message.reply({ embeds: [embed] });
      }
      
      // Kiểm tra tiền
      if (user.money < selectedItem.price) {
        const embed = new EmbedBuilder()
          .setTitle('💸 Không đủ tiền')
          .setDescription(`Bạn cần **${selectedItem.price.toLocaleString()} 🪙** để mua ${selectedItem.name}!`)
          .addFields(
            { name: '💰 Tiền hiện tại:', value: `${user.money.toLocaleString()} 🪙` },
            { name: '💵 Còn thiếu:', value: `${(selectedItem.price - user.money).toLocaleString()} 🪙` }
          )
          .setColor(message.client.config.embedColors.error);
        
        return message.reply({ embeds: [embed] });
      }
      
      // Mua vật phẩm
      user.money -= selectedItem.price;
      user.inventory[selectedItem.id] = {
        name: selectedItem.name,
        type: selectedItem.type,
        description: selectedItem.description,
        purchaseDate: Date.now()
      };
      
      EconomyDatabase.updateUser(message.author.id, user);
      
      const purchaseEmbed = new EmbedBuilder()
        .setTitle('🛒 Mua thành công!')
        .setDescription(`Bạn đã mua **${selectedItem.name}** với giá **${selectedItem.price.toLocaleString()} 🪙**!`)
        .addFields(
          { name: '📦 Vật phẩm:', value: selectedItem.name },
          { name: '📝 Mô tả:', value: selectedItem.description },
          { name: '💵 Số dư còn lại:', value: `${user.money.toLocaleString()} 🪙` }
        )
        .setColor(message.client.config.embedColors.success)
        .setTimestamp()
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
      
      await message.reply({ embeds: [purchaseEmbed] });
    }
  }
};
