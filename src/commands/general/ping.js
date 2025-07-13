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
      .setColor(client.config.embedColors.info)
      .setTimestamp();
    
    const start = Date.now();
    const msg = await message.channel.send({ embeds: [pingEmbed] });
    const apiPing = Date.now() - start;
    
    const color = apiPing < 100 ? 
      client.config.embedColors.success : 
      apiPing < 300 ? 
      client.config.embedColors.warning : 
      client.config.embedColors.error;
    
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