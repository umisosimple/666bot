const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const EconomyDatabase = require('../../database/economy'); // Đã sửa cách require

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
      },
      { 
        id: 'fishing_rod_pro', 
        name: '🎣 Cần câu chuyên nghiệp', 
        price: 5000, 
        description: 'Tăng 30% tỷ lệ câu cá thành công',
        type: 'tool'
      },
      { 
        id: 'hunting_bow_pro', 
        name: '🏹 Cung săn cao cấp', 
        price: 6000, 
        description: 'Tăng 35% tỷ lệ săn thành công',
        type: 'tool'
      },
      { 
        id: 'golden_charm', 
        name: '🏆 Bùa may mắn vàng', 
        price: 10000, 
        description: 'Tăng 20% thu nhập từ mọi hoạt động',
        type: 'accessory'
      }
    ];
    
    if (!args[0]) {
      const itemsPerPage = 5;
      const totalPages = Math.ceil(shopItems.length / itemsPerPage);
      let currentPage = 1;
      
      const generateEmbed = (page) => {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentItems = shopItems.slice(startIndex, endIndex);
        
        const embed = new EmbedBuilder()
          .setTitle('🏪 Cửa hàng')
          .setDescription(`Chào mừng đến với cửa hàng! Sử dụng \`${message.client.config.prefix}shop buy <số>\` để mua.`)
          .setColor('#00BFFF')
          .setTimestamp()
          .setFooter({ text: `Trang ${page}/${totalPages} • Mua sắm thông minh!` });
        
        currentItems.forEach((item, index) => {
          const itemNumber = shopItems.indexOf(item) + 1;
          const itemInfo = `💰 **${item.price.toLocaleString()}** 🪙\n📝 ${item.description}`;
          
          embed.addFields({
            name: `${itemNumber}. ${item.name}`,
            value: itemInfo,
            inline: true
          });
        });
        
        const fieldsCount = currentItems.length;
        if (fieldsCount % 3 !== 0) {
          const emptyFields = 3 - (fieldsCount % 3);
          for (let i = 0; i < emptyFields; i++) {
            embed.addFields({ name: '\u200b', value: '\u200b', inline: true });
          }
        }
        
        embed.addFields(
          { name: '💡 Hướng dẫn', value: `\`${message.client.config.prefix}shop buy <số>\` - Mua vật phẩm\n\`${message.client.config.prefix}inventory\` - Xem túi đồ`, inline: false }
        );
        
        return embed;
      };
      
      const generateButtons = (page) => {
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('shop_first')
              .setLabel('⏮️')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(page === 1),
            new ButtonBuilder()
              .setCustomId('shop_prev')
              .setLabel('◀️')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page === 1),
            new ButtonBuilder()
              .setCustomId('shop_page')
              .setLabel(`${page}/${totalPages}`)
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('shop_next')
              .setLabel('▶️')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page === totalPages),
            new ButtonBuilder()
              .setCustomId('shop_last')
              .setLabel('⏭️')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(page === totalPages)
          );
        
        return totalPages > 1 ? [row] : [];
      };
      
      const initialEmbed = generateEmbed(currentPage);
      const initialButtons = generateButtons(currentPage);
      
      const response = await message.reply({ 
        embeds: [initialEmbed], 
        components: initialButtons 
      });
      
      if (totalPages <= 1) return;
      
      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000
      });
      
      collector.on('collect', async (interaction) => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({ 
            content: '❌ Chỉ người gọi lệnh mới có thể sử dụng nút này!', 
            ephemeral: true 
          });
        }
        
        switch (interaction.customId) {
          case 'shop_first':
            currentPage = 1;
            break;
          case 'shop_prev':
            currentPage = Math.max(1, currentPage - 1);
            break;
          case 'shop_next':
            currentPage = Math.min(totalPages, currentPage + 1);
            break;
          case 'shop_last':
            currentPage = totalPages;
            break;
        }
        
        const newEmbed = generateEmbed(currentPage);
        const newButtons = generateButtons(currentPage);
        
        await interaction.update({ 
          embeds: [newEmbed], 
          components: newButtons 
        });
      });
      
      collector.on('end', () => {
        const disabledButtons = generateButtons(currentPage).map(row => {
          const newRow = new ActionRowBuilder();
          row.components.forEach(button => {
            newRow.addComponents(ButtonBuilder.from(button).setDisabled(true));
          });
          return newRow;
        });
        
        response.edit({ components: disabledButtons }).catch(() => {});
      });
      
      return;
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
          .setColor('#FFD580');
        
        return message.reply({ embeds: [embed] });
      }
      
      const user = EconomyDatabase.getUser(message.author.id);
      let selectedItem;
      
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
          .setColor('#FF89A0');
        
        return message.reply({ embeds: [embed] });
      }
      
      if (!user.inventory) {
        user.inventory = {};
      }
      
      if (user.inventory[selectedItem.id]) {
        const embed = new EmbedBuilder()
          .setTitle('📦 Đã sở hữu')
          .setDescription(`Bạn đã có ${selectedItem.name} rồi!`)
          .setColor('#FFD580');
        
        return message.reply({ embeds: [embed] });
      }
      
      if (user.money < selectedItem.price) {
        const embed = new EmbedBuilder()
          .setTitle('💸 Không đủ tiền')
          .setDescription(`Bạn cần **${selectedItem.price.toLocaleString()} 🪙** để mua ${selectedItem.name}!`)
          .addFields(
            { name: '💰 Tiền hiện tại:', value: `${user.money.toLocaleString()} 🪙`, inline: true },
            { name: '💵 Còn thiếu:', value: `${(selectedItem.price - user.money).toLocaleString()} 🪙`, inline: true }
          )
          .setColor('#FF89A0');
        
        return message.reply({ embeds: [embed] });
      }
      
      EconomyDatabase.removeMoney(message.author.id, selectedItem.price); // Sử dụng removeMoney
      
      const updatedUser = EconomyDatabase.getUser(message.author.id); // Lấy lại user sau khi trừ tiền
      updatedUser.inventory[selectedItem.id] = {
        name: selectedItem.name,
        type: selectedItem.type,
        description: selectedItem.description,
        purchaseDate: Date.now()
      };
      
      EconomyDatabase.updateUser(message.author.id, updatedUser); // Cập nhật lại user với inventory mới
      
      const successEmbed = new EmbedBuilder()
       .setTitle('🛒🎉 Mua thành công!')
       .setDescription(`Bạn đã mua **${item.emoji || ''} ${item.name}** thành công!`)
       .addFields(
        { name: '💰 Số dư còn lại', value: `${updatedUser.money.toLocaleString()} 🪙`, inline: true },
        { name: '🧳 Tổng vật phẩm', value: `${(user.inventory[itemKey] || 0).toLocaleString()} cái`, inline: true }
       )
       .setColor(message.client.config?.embedColors?.success || '#43EA97')
       .setFooter({ text: 'Cảm ơn bạn đã mua sắm tại Shop!' })
       .setTimestamp();
       await message.reply({ embeds: [successEmbed] });

    }
  }
};
