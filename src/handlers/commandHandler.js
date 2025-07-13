const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

async function loadCommands(client) {
  const commandsPath = path.join(__dirname, '../commands');
  const commandFolders = fs.readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const commandsFolder = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(commandsFolder, file);
      const command = require(filePath);

      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        logger.info(`Loaded command: ${command.data.name}`);
      } else {
        logger.warn(`Command at ${filePath} is missing required "data" or "execute" property`);
      }
    }
  }
}

module.exports = { loadCommands };