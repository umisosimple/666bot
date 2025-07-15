const { Events, ActivityType } = require('discord.js');
const { logger } = require('../utils/logger');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logger.info(`${client.user.tag} is online! PID: ${process.pid}`);
    
    // Thiết lập trạng thái hiện diện
    try {
      client.user.setPresence({
        activities: [{ 
          name: client.config.presence.name || 'Một hoạt động nào đó', // Giá trị mặc định
          type: ActivityType.Listening,
          url: client.config.presence.url || 'https://example.com' // Giá trị mặc định
        }],
        status: client.config.presence.status || 'online' // Giá trị mặc định
      });
      logger.info('Presence set successfully.');
    } catch (error) {
      logger.error('Error setting presence:', error);
    }
  },
};
