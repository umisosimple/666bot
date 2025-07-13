
const { Client: DiscordClient, IntentsBitField, Collection } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const { logger } = require('./utils/logger');
const config = require('./config/botConfig');

class Client extends DiscordClient {
  constructor() {
    super({
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
      ],
    });
    
    this.commands = new Collection(); // Sử dụng Collection thay vì Map
    this.cooldowns = new Collection();
    this.config = config;
  }

  async start() {
    try {
      await loadCommands(this);
      await loadEvents(this);
      await this.login(process.env.TOKEN);
      logger.info('Bot started successfully!');
    } catch (error) {
      logger.error('Failed to start bot:', error);
      process.exit(1);
    }
  }
}

module.exports = { Client };
