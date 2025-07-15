const { EmbedBuilder } = require('discord.js');
const EconomyDatabase = require('../../database/economy');

function createProgressBar(progress, size = 15) {
  // Tạo progress bar kiểu █ và ░
  const filled = Math.round((progress / 100) * size);
  return '▰'.repeat(filled) + '▱'.repeat(size - filled);
}

module.exports = {
  data: {
    name: 'level',
    description: 'Kiểm tra cấp độ và kinh nghiệm của bạn',
    usage: 'level',
    cooldown: 5,
    category: 'economy'
  },
  
  async execute(message, args) {
    try {
      const userId = message.author.id;
      const levelInfo = EconomyDatabase.getUserLevel(userId);

      const progressBar = createProgressBar(levelInfo.progress);

      const embed = new EmbedBuilder()
        .setColor('#00BFFF') // Ngọc bích Discord
        .setTitle('🎖️ Thông tin cấp độ')
        .setDescription(`Cấp độ hiện tại của <@${userId}>`)
        .addFields(
          { name: '📊 Cấp độ', value: `\`${levelInfo.level}\``, inline: true },
          { name: '⭐ Kinh nghiệm', value: `\`${levelInfo.exp}/${levelInfo.requiredExp}\``, inline: true },
          { name: '📈 Tiến độ', value: `\`${levelInfo.progress}%\`\n${progressBar}`, inline: false },
          { name: '🎁 Thưởng cấp tiếp theo', value: `\`${levelInfo.nextLevelReward.toLocaleString()} coins\``, inline: false }
        )
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setFooter({ 
          text: `Yêu cầu bởi ${message.author.tag} • Level System`, 
          iconURL: message.author.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in level command:', error);
      await message.reply('❌ Có lỗi xảy ra khi lấy thông tin cấp độ của bạn!');
    }
  }
};
