const { Events, ActivityType } = require('discord.js');
const { logger } = require('../utils/logger');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logger.info(`${client.user.tag} is online! PID: ${process.pid}`);
    
    // Set presence
    client.user.setPresence({
      activities: [{ 
        name: client.config.presence.name,
        type: ActivityType.Listening,
        url: client.config.presence.url
      }],
      status: client.config.presence.status
    });
  },
};
