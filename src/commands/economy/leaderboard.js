const { EmbedBuilder } = require('discord.js');
const { EconomyDatabase } = require('../../database/economy');

module.exports = {
  data: {
    name: 'leaderboard',
    description: 'Xem bảng xếp hạng người giàu nhất',
    usage: 'leaderboard [money|level|total]',
    aliases: ['lb', 'top'],
    cooldown: 5,
    category: 'economy'
  },
  execute: async (message, args) => {
    const type = args[0]?.toLowerCase() || 'money';
    const validTypes = ['money', 'level', 'total'];
    
    if (!validTypes.includes(type)) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Loại không hợp lệ')
        .setDescription(`Các loại có sẵn: ${validTypes.join(', ')}`)
        .setColor(message.client.config.embedColors.error);
      
      return message.reply({ embeds: [embed] });
    }
    
    const leaderboard = EconomyDatabase.getLeaderboard(type, 10);
    
    if (leaderboard.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('📊 Bảng xếp hạng')
        .setDescription('Chưa có dữ liệu!')
        .setColor(message.client.config.embedColors.warning);
      
      return message.reply({ embeds: [embed] });
    }
    
    const typeNames = {
      money: 'Tiền mặt',
      level: 'Cấp độ',
      total: 'Tổng tài sản'
    };
    
    const typeEmojis = {
      money: '💰',
      level: '📊',
      total: '💎'
    };
    
    let description = '';
    
    for (let i = 0; i < leaderboard.length; i++) {
      const userData = leaderboard[i];
      let user;
      
      try {
        user = await message.client.users.fetch(userData.userId);
      } catch (error) {
        user = { displayName: 'Unknown User', username: 'unknown' };
      }
      
      const position = i + 1;
      const medals = ['🥇', '🥈', '🥉'];
      const medal = medals[i] || `${position}.`;
      
      let value;
      if (type === 'money') {
        value = `${userData.money.toLocaleString()} 🪙`;
      } else if (type === 'level') {
        value = `Level ${userData.level}`;
      } else if (type === 'total') {
        value = `${(userData.money + userData.bank).toLocaleString()} 🪙`;
      }
      
      description += `${medal} **${user.displayName || user.username}** - ${value}\n`;
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`${typeEmojis[type]} Bảng xếp hạng - ${typeNames[type]}`)
      .setDescription(description)
      .setColor(message.client.config.embedColors.info)
      .setTimestamp()
      .setFooter({ text: `Trang 1 • ${leaderboard.length} người chơi` });
    
    await message.reply({ embeds: [embed] });
  }
};
