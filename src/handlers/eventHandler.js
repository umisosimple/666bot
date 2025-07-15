// src/handlers/eventHandler.js
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

async function loadEvents(client) {
  const eventsPath = path.join(__dirname, '../events');
  
  // QUAN TRỌNG: Xóa toàn bộ event listener cũ trước khi đăng ký lại
  client.removeAllListeners();

  // Tiếp tục như cũ...
  if (!fs.existsSync(eventsPath)) {
    logger.error(`Events directory not found: ${eventsPath}`);
    return;
  }

  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (!event.name) {
      logger.warn(`Event file at ${filePath} is missing a name property`);
      continue;
    }

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
    
    logger.info(`Loaded event: ${event.name}`);
  }
}

module.exports = { loadEvents };
