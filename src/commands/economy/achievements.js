const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const EconomyDatabase = require('../../database/economy');

// Cấu hình hiển thị
const CONFIG = {
  MAX_ACHIEVEMENTS_PER_PAGE: 5, // Số thành tựu mỗi trang (có thể thay đổi)
  COMPLETED_EMOJI: '✅',
  INCOMPLETE_EMOJI: '❌',
  EMBED_COLOR: '#FFD580',
  PAGE_TIMEOUT: 60000
};

module.exports = {
  data: {
    name: 'achievements',
    description: 'Xem thành tựu của bạn',
    aliases: ['ach'],
    usage: 'achievements',
  },
  execute: async (message) => {
    try {
      const userId = message.author.id;
      updateAchievements(userId);
      const user = EconomyDatabase.getUser(userId);

      if (!user.achievements || user.achievements.length === 0) {
        await message.reply('Bạn chưa có thành tựu nào!');
        return;
      }

      // Tính toán tiến độ
      const completed = user.achievements.filter(a => a.completed).length;
      const total = user.achievements.length;
      const completionRate = Math.round((completed / total) * 100);

      // Phân trang
      const pages = [];
      for (let i = 0; i < total; i += CONFIG.MAX_ACHIEVEMENTS_PER_PAGE) {
        pages.push(user.achievements.slice(i, i + CONFIG.MAX_ACHIEVEMENTS_PER_PAGE));
      }
      let currentPage = 0;

      const sendEmbed = async (pageIdx) => {
        const offset = pageIdx * CONFIG.MAX_ACHIEVEMENTS_PER_PAGE;
        const embed = createAchievementEmbed(pages[pageIdx], pageIdx + 1, pages.length, completed, total, completionRate, offset);
        const row = createPaginationRow(pageIdx, pages.length);
        return { embeds: [embed], components: [row] };
      };

      const msg = await message.reply(await sendEmbed(currentPage));

      // Xử lý nút chuyển trang
      const collector = msg.createMessageComponentCollector({ time: CONFIG.PAGE_TIMEOUT });
      collector.on('collect', async (interaction) => {
        if (!interaction.isButton()) return;
        if (interaction.customId === 'prev' && currentPage > 0) currentPage--;
        if (interaction.customId === 'next' && currentPage < pages.length - 1) currentPage++;
        await interaction.update(await sendEmbed(currentPage));
      });
      collector.on('end', () => {
        const row = createPaginationRow(currentPage, pages.length, true);
        msg.edit({ components: [row] }).catch(() => {});
      });

    } catch (error) {
      console.error('Lỗi hiển thị thành tựu:', error);
      await message.reply('❌ Đã xảy ra lỗi khi hiển thị thành tựu!');
    }
  }
};

// ======= Hàm tạo embed mới gọn đẹp =======
function createAchievementEmbed(achievements, page, totalPages, completed, total, completionRate, offset = 0) {
  const achievementList = achievements.map((ach, idx) =>
    `${offset + idx + 1}. ${ach.completed ? CONFIG.COMPLETED_EMOJI : CONFIG.INCOMPLETE_EMOJI} ${ach.name} (+${ach.reward.toLocaleString()}c)`
  ).join('\n');

  return new EmbedBuilder()
    .setTitle('📜 Danh Sách Thành Tựu')
    .setColor(CONFIG.EMBED_COLOR)
    .setDescription([
      `**Tiến độ:** ${completed}/${total} (${completionRate}%)   |   **Trang:** ${page}/${totalPages}`,
      '────────────────────────────',
      achievementList.length ? achievementList : 'Không có thành tựu nào!',
      '────────────────────────────',
      'Dùng nút bên dưới để chuyển trang.'
    ].join('\n'))
    .setFooter({ text: 'Hãy cố gắng hoàn thành nhiều thành tựu nhé!' });
}

// ======= Hàm tạo nút chuyển trang =======
function createPaginationRow(currentPage, totalPages, disabled = false) {
  const row = new ActionRowBuilder();
  row.addComponents(
    new ButtonBuilder()
      .setCustomId('prev')
      .setLabel('◀ Trang trước')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || currentPage === 0),
    new ButtonBuilder()
      .setCustomId('next')
      .setLabel('Trang sau ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || currentPage === totalPages - 1)
  );
  return row;
}

// Các hàm khởi tạo và check achievements giữ nguyên...
// ... (copy nguyên phần updateAchievements, checkAchievements và các hàm success/daily ở cuối file của bạn không đổi)

const updateAchievements = (userId) => { /* ... giữ nguyên ... */ };
const checkAchievements = (userId) => { /* ... giữ nguyên ... */ };
const onFishSuccess = (userId) => { /* ... giữ nguyên ... */ };
const onHuntSuccess = (userId) => { /* ... giữ nguyên ... */ };
const onWorkSuccess = (userId) => { /* ... giữ nguyên ... */ };
const onDailyReward = (userId) => { /* ... giữ nguyên ... */ };

module.exports.updateAchievements = updateAchievements;
module.exports.onFishSuccess = onFishSuccess;
module.exports.onHuntSuccess = onHuntSuccess;
module.exports.onWorkSuccess = onWorkSuccess;
module.exports.onDailyReward = onDailyReward;
