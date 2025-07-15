const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'ping',
    description: 'Kiểm tra độ trễ của bot',
    usage: 'ping',
    cooldown: 5,
    category: 'general'
  },
  execute: async (message, args) => {
    const client = message.client;
    
    const pingEmbed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .addFields(
        { name: 'WebSocket Ping:', value: `${client.ws.ping} ms`, inline: true },
        { name: 'API Ping:', value: 'Đang tính...', inline: true }
      )
      .setColor(client.config?.embedColors?.info || '#3498db') // Fallback color
      .setTimestamp();
    
    const start = Date.now();
    const msg = await message.channel.send({ embeds: [pingEmbed] });
    const apiPing = Date.now() - start;
    
    // Xác định màu sắc dựa trên độ trễ API
    const color = apiPing < 100 ? 
      client.config?.embedColors?.success || '#00FF00' : // Fallback color
      apiPing < 300 ? 
      client.config?.embedColors?.warning || '#FFA500' : // Fallback color
      client.config?.embedColors?.error || '#FF0000'; // Fallback color
    
    const updatedEmbed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .addFields(
        { name: 'WebSocket Ping:', value: `${client.ws.ping} ms`, inline: true },
        { name: 'API Ping:', value: `${apiPing} ms`, inline: true }
      )
      .setColor(color)
      .setTimestamp();
    
    await msg.edit({ embeds: [updatedEmbed] });
  }
};
