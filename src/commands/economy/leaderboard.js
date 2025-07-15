const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const EconomyDatabase = require('../../database/economy');

module.exports = {
  data: {
    name: 'leaderboard',
    description: 'Xem bảng xếp hạng người giàu nhất',
    usage: 'leaderboard [money|level|total] hoặc bxh [money|level|total]',
    aliases: ['lb', 'top', 'bxh'],
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
        .setColor(message.client.config?.embedColors?.error || '#FF89A0');
      return message.reply({ embeds: [embed] });
    }

    // Lấy dữ liệu bảng xếp hạng dựa trên từng loại
    let leaderboardData = [];
    if (type === 'money') {
      leaderboardData = EconomyDatabase.getLeaderboard('money');
    } else if (type === 'level') {
      leaderboardData = EconomyDatabase.getLeaderboard('level');
    } else if (type === 'total') {
      leaderboardData = EconomyDatabase.getLeaderboard('total');
    }

    if (!Array.isArray(leaderboardData) || leaderboardData.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('📊 Bảng xếp hạng')
        .setDescription('Chưa có dữ liệu!')
        .setColor(message.client.config?.embedColors?.warning || '#FFD580');
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

    const pageSize = 10;
    let currentPage = 0;
    const totalPages = Math.ceil(leaderboardData.length / pageSize);

    const userId = message.author.id;
    const userRank = leaderboardData.findIndex(user => user.userId === userId) + 1;
    let userValue = 'Chưa xếp hạng';

    if (userRank > 0) {
      const userData = leaderboardData[userRank - 1];
      if (type === 'money') {
        userValue = `${userData.money.toLocaleString()} 🪙`;
      } else if (type === 'level') {
        userValue = `Level ${userData.level}`;
      } else if (type === 'total') {
        userValue = `${(userData.money + userData.bank).toLocaleString()} 🪙`;
      }
    }

    // Tạo Embed cho từng trang
    const generateEmbed = async (page) => {
      const start = page * pageSize;
      const end = start + pageSize;
      const pageData = leaderboardData.slice(start, end);

      let description = '';
      for (let i = 0; i < pageData.length; i++) {
        const userData = pageData[i];
        let userDiscord;
        try {
          userDiscord = await message.client.users.fetch(userData.userId);
        } catch (error) {
          userDiscord = { username: 'Ẩn danh' };
        }

        const position = start + i + 1;

        // Xác định emoji cho từng vị trí
        let medal = '';
        if (userData.userId === message.client.config.ownerId) {
          medal = '👑'; // Gắn cho owner nếu muốn (sửa ownerId trong config)
        } else if (position === 1) {
          medal = '🥇';
        } else if (position === 2) {
          medal = '🥈';
        } else if (position === 3) {
          medal = '🥉';
        } else if (position <= 10) {
          medal = '🏅';
        } else {
          medal = '🔰';
        }

        let value;
        if (type === 'money') {
          value = `${userData.money.toLocaleString()} 🪙`;
        } else if (type === 'level') {
          value = `Level ${userData.level}`;
        } else if (type === 'total') {
          value = `${(userData.money + userData.bank).toLocaleString()} 🪙`;
        }

        description += `${medal} **${userDiscord.globalName || userDiscord.username}** — ${value}\n`;
      }

      // ...phần sau giữ nguyên...
      const embed = new EmbedBuilder()
        .setTitle(`${typeEmojis[type]} Bảng xếp hạng - ${typeNames[type]}`)
        .setDescription(description || 'Không có dữ liệu cho trang này')
        .addFields({
          name: '📍 Vị trí của bạn',
          value: userRank > 0 ? `#${userRank} — ${userValue}` : userValue,
          inline: false
        })
        .setColor(message.client.config?.embedColors?.info || '#43EA97')
        .setTimestamp()
        .setFooter({
          text: `Trang ${page + 1}/${totalPages} • Tổng ${leaderboardData.length} người chơi`,
          iconURL: message.author.displayAvatarURL({ dynamic: true })
        });

      return embed;
    };


    // Tạo nút chuyển trang
    const createButtons = (page) => {
      return new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('first')
            .setLabel('⏮️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('◀️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId('next')
            .setLabel('▶️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === totalPages - 1),
          new ButtonBuilder()
            .setCustomId('last')
            .setLabel('⏭️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === totalPages - 1),
          new ButtonBuilder()
            .setCustomId('stop')
            .setLabel('⏹️')
            .setStyle(ButtonStyle.Danger)
        );
    };

    const replyMessage = await message.reply({
      embeds: [await generateEmbed(currentPage)],
      components: totalPages > 1 ? [createButtons(currentPage)] : []
    });

    if (totalPages <= 1) return;

    const collector = replyMessage.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 300000
    });

    collector.on('collect', async (interaction) => {
      switch (interaction.customId) {
        case 'first':
          currentPage = 0; break;
        case 'prev':
          if (currentPage > 0) currentPage--; break;
        case 'next':
          if (currentPage < totalPages - 1) currentPage++; break;
        case 'last':
          currentPage = totalPages - 1; break;
        case 'stop':
          collector.stop('user_stopped'); return;
      }
      try {
        await interaction.update({
          embeds: [await generateEmbed(currentPage)],
          components: [createButtons(currentPage)]
        });
      } catch (error) { }
    });

    collector.on('end', () => {
      const disabledRow = createButtons(currentPage);
      disabledRow.components.forEach(button => button.setDisabled(true));
      replyMessage.edit({ components: [disabledRow] }).catch(() => { });
    });
  }
};
