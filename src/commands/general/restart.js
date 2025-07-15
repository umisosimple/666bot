const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'restart',
    description: 'Khởi động lại bot (Chỉ chủ sở hữu)',
    usage: 'restart',
    aliases: ['reboot', 'reload'],
    cooldown: 5,
    category: 'admin'
  },
  execute: async (message, args) => {
    try {
      // Kiểm tra quyền owner - hỗ trợ cả mảng và string
      const ownerIds = message.client.config.ownerIds || message.client.config.ownerId;
      let isOwner = false;

      if (Array.isArray(ownerIds)) {
        isOwner = ownerIds.includes(message.author.id);
      } else if (typeof ownerIds === 'string') {
        isOwner = ownerIds === message.author.id;
      }

      if (!isOwner) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Không có quyền')
          .setDescription('Bạn không có quyền sử dụng lệnh này!')
          .setColor('#FF0000')
          .setTimestamp()
          .setFooter({ 
            text: 'Chỉ chủ sở hữu bot mới có thể sử dụng lệnh này',
            iconURL: message.author.displayAvatarURL({ dynamic: true })
          });

        return message.reply({ embeds: [errorEmbed] });
      }

      // Tạo embed thông báo restart
      const restartEmbed = new EmbedBuilder()
        .setTitle('🔄 Khởi động lại Bot')
        .setDescription('Bot đang được khởi động lại...')
        .addFields(
          { name: '⏰ Thời gian', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
          { name: '👤 Được thực hiện bởi', value: `${message.author.tag}`, inline: true },
          { name: '📍 Server', value: `${message.guild.name}`, inline: true },
          { name: '⚠️ Lưu ý', value: 'Bot sẽ mất kết nối trong vài giây và tự động kết nối lại.', inline: false }
        )
        .setColor('#FFA500')
        .setTimestamp()
        .setThumbnail(message.client.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ 
          text: 'Hệ thống khởi động lại',
          iconURL: message.author.displayAvatarURL({ dynamic: true })
        });

      await message.reply({ embeds: [restartEmbed] });

      // Log restart action
      console.log(`🔄 Bot restart initiated by ${message.author.tag} (${message.author.id}) in ${message.guild.name}`);

      // Graceful shutdown
      setTimeout(async () => {
        try {
          // Đóng kết nối database nếu có
          console.log('💾 Saving data before restart...');
          
          // Thông báo cho các channel quan trọng (nếu cần)
          const logChannel = message.guild.channels.cache.find(
            channel => channel.name.includes('log') || channel.name.includes('admin')
          );
          
          if (logChannel && logChannel.id !== message.channel.id) {
            const logEmbed = new EmbedBuilder()
              .setTitle('🔄 Bot Restart')
              .setDescription(`Bot đã được khởi động lại bởi ${message.author.tag}`)
              .setColor('#00FF00')
              .setTimestamp();
            
            await logChannel.send({ embeds: [logEmbed] }).catch(console.error);
          }

          console.log('🔄 Restarting bot...');
          
          // Đóng client trước khi exit
          await message.client.destroy();
          
          // Exit process
          process.exit(0);
          
        } catch (error) {
          console.error('❌ Error during restart:', error);
          process.exit(1);
        }
      }, 2000); // Tăng thời gian chờ lên 2 giây để đảm bảo message được gửi

    } catch (error) {
      console.error('❌ Error in restart command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Lỗi khởi động lại')
        .setDescription('Có lỗi xảy ra khi khởi động lại bot!')
        .addFields({
          name: '🐛 Chi tiết lỗi',
          value: `\`\`\`${error.message}\`\`\``,
          inline: false
        })
        .setColor('#FF0000')
        .setTimestamp();

      await message.reply({ embeds: [errorEmbed] }).catch(console.error);
    }
  }
};
