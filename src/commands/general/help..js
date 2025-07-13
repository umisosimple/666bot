// ===========================================
// 📄 src/commands/general/help.js - Help command
// ===========================================
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createInfoEmbed } = require('../../utils/embedBuilder');

module.exports = {
  data: {
    name: 'help',
    description: 'Hiển thị danh sách các lệnh có sẵn',
    usage: 'help [command]',
    cooldown: 5,
    category: 'general' // Giữ nguyên hoặc đổi thành 'utility'
  },
  execute: async (message, args) => {
    const client = message.client;
    
    // Định nghĩa các emoji cho từng danh mục (chỉ một lần ở đây)
    const categoryEmojis = {
      'general': '🔧',
      'moderation': '🛡️',
      'fun': '🎉',
      'utility': '🔨',
      'music': '🎵',
      'admin': '👑',
      'economy': '💰' // Đã thêm emoji cho danh mục economy
    };

    // Nếu có tham số lệnh cụ thể
    if (args.length > 0) {
      const commandName = args[0].toLowerCase();
      // **CHỈNH SỬA 1: Kiểm tra cả alias khi tìm kiếm lệnh chi tiết**
      const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.data.aliases && cmd.data.aliases.includes(commandName));
      
      if (!command) {
        const embed = createInfoEmbed(
          'Lệnh không tồn tại',
          `Không tìm thấy lệnh \`${commandName}\`.\nSử dụng \`${client.config.prefix}help\` để xem tất cả lệnh.`
        );
        return message.reply({ embeds: [embed] });
      }
      
      // Hiển thị thông tin chi tiết về lệnh
      const commandEmbed = new EmbedBuilder()
        .setTitle(`📋 Chi tiết lệnh: ${command.data.name}`)
        .setDescription(command.data.description || 'Không có mô tả')
        .addFields(
          { name: '🔧 Cách sử dụng:', value: `\`${client.config.prefix}${command.data.usage || command.data.name}\``, inline: false },
          { name: '⏱️ Cooldown:', value: `${command.data.cooldown || 3} giây`, inline: true },
          { name: '📂 Danh mục:', value: command.data.category || 'Chung', inline: true }
        )
        .setColor(client.config.embedColors.info)
        .setTimestamp()
        .setFooter({ 
          text: `Được yêu cầu bởi ${message.author.tag}`, 
          iconURL: message.author.displayAvatarURL({ dynamic: true })
        });
      
      return message.reply({ embeds: [commandEmbed] });
    }
    
    // Tổ chức lệnh theo danh mục
    const categories = {};
    client.commands.forEach(command => {
      const category = command.data.category || 'Chung';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(command);
    });
    
    // Tạo embed chính
    const mainEmbed = new EmbedBuilder()
      .setTitle('📚 Danh sách lệnh')
      .setDescription(`Sử dụng \`${client.config.prefix}help <tên lệnh>\` để xem chi tiết lệnh cụ thể.`)
      .setColor(client.config.embedColors.default)
      .setTimestamp()
      .setFooter({ 
        text: `Tổng cộng ${client.commands.size} lệnh • Prefix: ${client.config.prefix}`, 
        iconURL: client.user.displayAvatarURL({ dynamic: true })
      })
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }));
    
    // Thêm các field cho từng danh mục
    Object.keys(categories).forEach(category => {
      // **CHỈNH SỬA 2: Sử dụng categoryEmojis đã định nghĩa ở trên**
      const emoji = categoryEmojis[category.toLowerCase()] || '📁';
      const commands = categories[category];
      const commandList = commands.map(cmd => `\`${cmd.data.name}\``).join(', ');
      
      mainEmbed.addFields({
        name: `${emoji} ${category.charAt(0).toUpperCase() + category.slice(1)} (${commands.length})`,
        value: commandList || 'Không có lệnh nào',
        inline: false
      });
    });
    
    // Tạo select menu cho navigation
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('help_category_select')
      .setPlaceholder('Chọn danh mục để xem chi tiết...')
      .addOptions(
        {
          label: 'Tổng quan',
          description: 'Xem tất cả lệnh',
          value: 'overview',
          emoji: '📚'
        },
        ...Object.keys(categories).map(category => ({
          label: category.charAt(0).toUpperCase() + category.slice(1),
          description: `Xem lệnh trong danh mục ${category}`,
          value: category.toLowerCase(),
          // **CHỈNH SỬA 2: Sử dụng categoryEmojis đã định nghĩa ở trên**
          emoji: categoryEmojis[category.toLowerCase()] || '📁' 
        }))
      );
    
    // Tạo buttons
    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('help_refresh')
          .setLabel('Làm mới')
          .setEmoji('🔄')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('help_delete')
          .setLabel('Xóa')
          .setEmoji('🗑️')
          .setStyle(ButtonStyle.Danger)
      );
    
    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
    
    // Gửi tin nhắn với components
    const helpMessage = await message.reply({ 
      embeds: [mainEmbed], 
      components: [selectRow, buttons] 
    });
    
    // Tạo collector cho interactions
    const collector = helpMessage.createMessageComponentCollector({ 
      filter: i => i.user.id === message.author.id,
      time: 300000 // 5 phút
    });
    
    collector.on('collect', async interaction => {
      if (interaction.customId === 'help_delete') {
        await interaction.update({ 
          content: '✅ Đã xóa tin nhắn help!', 
          embeds: [], 
          components: [] 
        });
        setTimeout(() => helpMessage.delete().catch(() => {}), 2000);
        return;
      }
      
      if (interaction.customId === 'help_refresh') {
        // Tạo lại embed chính
        const refreshedEmbed = new EmbedBuilder()
          .setTitle('📚 Danh sách lệnh (Đã làm mới)')
          .setDescription(`Sử dụng \`${client.config.prefix}help <tên lệnh>\` để xem chi tiết lệnh cụ thể.`)
          .setColor(client.config.embedColors.success)
          .setTimestamp()
          .setFooter({ 
            text: `Tổng cộng ${client.commands.size} lệnh • Prefix: ${client.config.prefix}`, 
            iconURL: client.user.displayAvatarURL({ dynamic: true })
          })
          .setThumbnail(client.user.displayAvatarURL({ dynamic: true }));
        
        Object.keys(categories).forEach(category => {
          // **CHỈNH SỬA 2: Sử dụng categoryEmojis đã định nghĩa ở trên**
          const emoji = categoryEmojis[category.toLowerCase()] || '📁';
          const commands = categories[category];
          const commandList = commands.map(cmd => `\`${cmd.data.name}\``).join(', ');
          
          refreshedEmbed.addFields({
            name: `${emoji} ${category.charAt(0).toUpperCase() + category.slice(1)} (${commands.length})`,
            value: commandList || 'Không có lệnh nào',
            inline: false
          });
        });
        
        await interaction.update({ embeds: [refreshedEmbed] });
        return;
      }
      
      if (interaction.customId === 'help_category_select') {
        const selectedCategory = interaction.values[0];
        
        if (selectedCategory === 'overview') {
          await interaction.update({ embeds: [mainEmbed] });
          return;
        }
        
        // Tạo embed cho danh mục cụ thể
        const categoryCommands = categories[selectedCategory] || [];
        const categoryEmbed = new EmbedBuilder()
          .setTitle(`📁 Danh mục: ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`)
          .setDescription(`Danh sách lệnh trong danh mục **${selectedCategory}**`)
          .setColor(client.config.embedColors.info)
          .setTimestamp()
          .setFooter({ 
            text: `${categoryCommands.length} lệnh trong danh mục này`, 
            iconURL: client.user.displayAvatarURL({ dynamic: true })
          });
        
        if (categoryCommands.length > 0) {
          // **CHỈNH SỬA 3: Sắp xếp và chia field cho categoryEmbed**
          categoryCommands.sort((a, b) => a.data.name.localeCompare(b.data.name)); // Sắp xếp theo tên

          const commandsPerField = 10; // Số lệnh tối đa mỗi field
          for (let i = 0; i < categoryCommands.length; i += commandsPerField) {
            const currentCommands = categoryCommands.slice(i, i + commandsPerField);
            const fieldName = i === 0 ? 'Lệnh:' : '\u200B'; // Tên field rỗng cho các field tiếp theo
            const fieldValue = currentCommands.map(command => 
              `\`${client.config.prefix}${command.data.name}\` - ${command.data.description || 'Không có mô tả'}`
            ).join('\n');
            categoryEmbed.addFields({ name: fieldName, value: fieldValue, inline: false });
          }
        } else {
          categoryEmbed.setDescription('Không có lệnh nào trong danh mục này.');
        }
        
        await interaction.update({ embeds: [categoryEmbed] });
      }
    });
    
    collector.on('end', () => {
      // Vô hiệu hóa các components khi collector kết thúc
      const disabledSelectRow = new ActionRowBuilder()
        .addComponents(
          StringSelectMenuBuilder.from(selectMenu)
            .setDisabled(true)
            .setPlaceholder('Phiên tương tác đã hết hạn...')
        );
      
      const disabledButtons = new ActionRowBuilder()
        .addComponents(
          ...buttons.components.map(button => 
            ButtonBuilder.from(button).setDisabled(true)
          )
        );
      
      helpMessage.edit({ 
        components: [disabledSelectRow, disabledButtons] 
      }).catch(() => {});
    });
  }
};
