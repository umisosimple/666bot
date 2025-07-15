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
    
    this.commands = new Collection(); // Sử dụng Collection để lưu trữ lệnh
    this.cooldowns = new Collection(); // Sử dụng Collection để quản lý cooldown
    this.config = config; // Cấu hình bot
  }

  /**
   * Khởi động bot.
   */
  async start() {
    try {
      await loadCommands(this); // Tải lệnh
      await loadEvents(this); // Tải sự kiện
      await this.login(process.env.TOKEN); // Đăng nhập vào Discord
      logger.info('Bot started successfully!'); // Ghi log thông báo khởi động thành công
    } catch (error) {
      logger.error('Failed to start bot:', error); // Ghi log lỗi nếu khởi động không thành công
      process.exit(1); // Thoát ứng dụng với mã lỗi
    }
  }
}

module.exports = { Client };
