const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

async function loadCommands(client) {
  const commandsPath = path.join(__dirname, '../commands');
  
  // Kiểm tra xem thư mục lệnh có tồn tại không
  if (!fs.existsSync(commandsPath)) {
    logger.error(`Commands directory not found: ${commandsPath}`);
    return;
  }

  const commandFolders = fs.readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const commandsFolder = path.join(commandsPath, folder);
    
    // Kiểm tra xem thư mục lệnh con có tồn tại không
    if (!fs.existsSync(commandsFolder)) {
      logger.warn(`Command folder not found: ${commandsFolder}`);
      continue;
    }

    const commandFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(commandsFolder, file);
      const command = require(filePath);

      // Kiểm tra xem lệnh có chứa các thuộc tính cần thiết không
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        logger.info(`Loaded command: ${command.data.name}`);

        // Thêm alias vào client.commands
        if (command.data.aliases) {
          command.data.aliases.forEach(alias => {
            client.commands.set(alias, command);
            logger.info(`Loaded alias: ${alias} for command: ${command.data.name}`);
          });
        }
      } else {
        logger.warn(`Command at ${filePath} is missing required "data" or "execute" property`);
      }
    }
  }
}

module.exports = { loadCommands };
