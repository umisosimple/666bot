const { EmbedBuilder } = require('discord.js');
const { validateContent, parseChannelMention } = require('../../utils/validator');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embedBuilder');

module.exports = {
  data: {
    name: 'say',
    description: 'Làm cho bot nói một thứ gì đó',
    usage: 'say <text> [--channel #channel] [--embed] [--no-delete]',
    cooldown: 3,
    category: 'general'
  },
  execute: async (message, args) => {
    if (args.length === 0) {
      const helpEmbed = new EmbedBuilder()
        .setTitle('❓ Cách sử dụng lệnh say')
        .setDescription('Làm cho bot nói một thứ gì đó')
        .addFields(
          { name: 'Cú pháp:', value: `\`${message.client.config.prefix}say <text>\``, inline: false },
          { name: 'Tùy chọn:', value: '`--channel #channel` - Gửi đến kênh khác\n`--embed` - Gửi dưới dạng embed\n`--no-delete` - Không xóa tin nhắn gốc', inline: false }
        )
        .setColor(message.client.config.embedColors.info)
        .setTimestamp();
      
      return message.reply({ embeds: [helpEmbed] });
    }
    
    // Parse arguments and flags
    let content = args.join(' ');
    let targetChannel = message.channel;
    let useEmbed = false;
    let shouldDelete = true;
    
    // Parse flags
    const channelMatch = content.match(/--channel\s+<#(\d+)>/);
    if (channelMatch) {
      const channel = message.guild.channels.cache.get(channelMatch[1]);
      if (channel?.isTextBased()) {
        targetChannel = channel;
        content = content.replace(/--channel\s+<#\d+>/, '').trim();
      }
    }
    
    if (content.includes('--embed')) {
      useEmbed = true;
      content = content.replace(/--embed/, '').trim();
    }
    
    if (content.includes('--no-delete')) {
      shouldDelete = false;
      content = content.replace(/--no-delete/, '').trim();
    }
    
    // Validate content
    const validation = validateContent(content);
    if (!validation.valid) {
      const embed = createErrorEmbed('Lỗi', validation.message);
      return message.reply({ embeds: [embed] });
    }
    
    try {
      // Delete original message if requested
      if (shouldDelete && message.deletable) {
        await message.delete();
      }
      
      // Send message
      if (useEmbed) {
        const sayEmbed = new EmbedBuilder()
          .setDescription(content)
          .setColor(message.client.config.embedColors.success)
          .setFooter({ 
            text: `Được gửi bởi ${message.author.tag}`, 
            iconURL: message.author.displayAvatarURL({ dynamic: true })
          })
          .setTimestamp();
        
        await targetChannel.send({ embeds: [sayEmbed] });
      } else {
        await targetChannel.send(content);
      }
      
      // Send confirmation if needed
      if (targetChannel.id !== message.channel.id && shouldDelete) {
        const confirmEmbed = createSuccessEmbed(
          'Thành công',
          `Tin nhắn đã được gửi đến ${targetChannel}`
        );
        await message.channel.send({ embeds: [confirmEmbed] });
      }
      
    } catch (error) {
      const embed = createErrorEmbed('Lỗi', 'Có lỗi xảy ra khi gửi tin nhắn!');
      return message.reply({ embeds: [embed] });
    }
  }
};
