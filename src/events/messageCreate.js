const { Events } = require('discord.js');
const { logger } = require('../utils/logger');
const { checkCooldown } = require('../utils/cooldown');
const { createErrorEmbed } = require('../utils/embedBuilder');

module.exports = {
  name: Events.MessageCreate,
  execute: async (message) => {
    const client = message.client;
    
    if (message.author.bot) return;
    
    logger.debug(`Processing message: "${message.content}" from ${message.author.tag}`);
    
    const messageContent = message.content.toLowerCase();
    
    // Handle simple commands
    if (messageContent === 'ping') {
      return await message.channel.send('Pong!');
    }
    
    if (messageContent === 'ai béo nhất') {
      return await message.reply('tui béo nhất');
    }
    
    // Handle prefix commands
    if (!message.content.startsWith(client.config.prefix)) return;
    
    const args = message.content.slice(client.config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    const command = client.commands.get(commandName);
    if (!command) return;
    
    // Check cooldown
    const cooldownLeft = checkCooldown(client, message.author.id, commandName);
    if (cooldownLeft) {
      const embed = createErrorEmbed(
        'Cooldown',
        `Vui lòng đợi ${cooldownLeft.toFixed(1)} giây nữa trước khi sử dụng lệnh này!`
      );
      return message.reply({ embeds: [embed] });
    }
    
    try {
      await command.execute(message, args);
    } catch (error) {
      logger.error('Error executing command:', error);
      const embed = createErrorEmbed('Lỗi', 'Có lỗi xảy ra khi thực hiện lệnh!');
      await message.reply({ embeds: [embed] });
    }
  },
};