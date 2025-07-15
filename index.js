require('dotenv').config();

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const config = require('./src/config/config');
const { loadCommands } = require('./src/handlers/commandHandler');
const EconomyDatabase = require('./src/database/economy');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Gán config vào client
client.config = config;

// Collections
client.commands = new Collection();
client.cooldowns = new Collection();

// Load commands
try {
  loadCommands(client);
  console.log('✅ Commands loaded successfully');
} catch (error) {
  console.error('❌ Error loading commands:', error);
  process.exit(1);
}

// Event handlers
client.once('ready', () => {
  console.log(`✅ Bot đã sẵn sàng! Đăng nhập với tên: ${client.user.tag}`);
  console.log(`📊 Đang phục vụ ${client.guilds.cache.size} servers`);
  console.log(`👥 Đang phục vụ ${client.users.cache.size} users`);
});

// Xử lý lỗi kết nối
client.on('error', error => {
  console.error('❌ Discord client error:', error);
});

client.on('warn', warning => {
  console.warn('⚠️ Discord client warning:', warning);
});

// Xử lý slash commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error('❌ Lỗi khi thực thi lệnh:', error);
    const reply = {
      content: 'Có lỗi xảy ra khi thực thi lệnh!',
      ephemeral: true
    };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

// Xử lý EXP system
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Xử lý EXP cho tin nhắn thường
  if (!message.content.startsWith(config.prefix)) {
    try {
      const levelUpResult = EconomyDatabase.addMessageExp(message.author.id);
      
      // FIX: Kiểm tra message tồn tại và không rỗng trước khi gửi
      if (levelUpResult && levelUpResult.message && levelUpResult.message.trim() !== '') {
        await message.channel.send(levelUpResult.message);
      }
    } catch (error) {
      console.error('Error adding message EXP:', error);
    }
    return;
  }

  // Xử lý prefix commands
  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  
  const command = client.commands.get(commandName) || 
                  client.commands.find(cmd => cmd.data && cmd.data.aliases && cmd.data.aliases.includes(commandName));
  
  if (!command) return;

  // Xử lý cooldown
  if (command.data.cooldown) {
    const { cooldowns } = client;
    
    if (!cooldowns.has(command.data.name)) {
      cooldowns.set(command.data.name, new Collection());
    }
    
    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name);
    const cooldownAmount = command.data.cooldown * 1000;

    if (timestamps.has(message.author.id)) {
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return message.reply(`⏰ Vui lòng đợi thêm **${timeLeft.toFixed(1)}** giây trước khi sử dụng lệnh \`${command.data.name}\` lần nữa.`);
      }
    }
    
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
  }

  try {
    await command.execute(message, args);
  } catch (error) {
    console.error(`❌ Error executing ${commandName}:`, error);
    message.reply('❌ Có lỗi xảy ra khi thực thi lệnh!').catch(console.error);
  }
});

// Xử lý voice state changes để cộng EXP
client.on('voiceStateUpdate', async (oldState, newState) => {
  try {
    // Người dùng tham gia voice channel và không phải bot
    if (!oldState.channel && newState.channel && !newState.member.user.bot) {
      const levelUpResult = EconomyDatabase.addVoiceExp(newState.id);
      
      // FIX: Kiểm tra message tồn tại và không rỗng trước khi gửi
      if (levelUpResult && levelUpResult.message && levelUpResult.message.trim() !== '') {
        // Tìm text channel để gửi thông báo
        const textChannel = newState.guild.channels.cache.find(
          channel => channel.type === 0 && channel.name.includes('general')
        ) || newState.guild.systemChannel;

        if (textChannel) {
          await textChannel.send(levelUpResult.message);
        }
      }
    }
  } catch (error) {
    console.error('Error adding voice EXP:', error);
  }
});

// Error handling
process.on('unhandledRejection', error => {
  console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Đăng nhập vào bot
console.log('🔄 Đang kết nối với Discord...');
client.login(config.token).catch(error => {
  console.error('❌ Lỗi khi đăng nhập:', error);
  console.error('💡 Kiểm tra lại DISCORD_TOKEN trong file .env');
  process.exit(1);
});
