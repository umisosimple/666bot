// src/commands/moderation/warnings.js

const { createInfoEmbed, createErrorEmbed } = require('../../utils/embedBuilder');
const moderationDB = require('../../database/moderation');
const config = require('../../config/config');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const USERS_PER_PAGE = 5; // Số user mỗi trang, bạn đổi nếu muốn

module.exports = {
  data: {
    name: 'warnings',
    description: 'Xem cảnh báo của thành viên hoặc toàn bộ server (phân trang)',
    usage: 'bng warnings <@user|userId>  hoặc  bng warnings all',
    example: 'bng warnings @user   hoặc   bng warnings all',
    permissions: ['KICK_MEMBERS', 'BAN_MEMBERS'],
    cooldown: 3,
    category: 'moderation'
  },
  async execute(message, args) {
    if (!message.guild) return;
    if (
      !message.member.permissions.has('KICK_MEMBERS') &&
      !message.member.permissions.has('BAN_MEMBERS')
    ) {
      return message.reply({ embeds: [createErrorEmbed('Thiếu quyền', 'Bạn cần quyền Kick hoặc Ban để dùng lệnh này!')] });
    }

    // ========= Warnings ALL (phân trang) =========
    if (args[0] && args[0].toLowerCase() === 'all') {
      // Lấy toàn bộ warn của guild
      const allWarns = moderationDB.getLogs({ guildId: message.guild.id, type: 'warn' });
      if (!allWarns.length)
        return message.reply({ embeds: [createInfoEmbed('Không có cảnh báo', 'Hiện không có cảnh báo nào trong server.')] });

      // Group theo userId
      const grouped = {};
      for (const w of allWarns) {
        if (!grouped[w.user]) grouped[w.user] = [];
        grouped[w.user].push(w);
      }
      // Danh sách userId
      const users = Object.entries(grouped)
        .map(([userId, warns]) => ({ userId, warns }))
        .sort((a, b) => b.warns.length - a.warns.length);

      // Hàm tạo embed cho từng trang
      const getPageEmbed = async (page) => {
        const totalPage = Math.ceil(users.length / USERS_PER_PAGE);
        const start = (page - 1) * USERS_PER_PAGE;
        const end = start + USERS_PER_PAGE;
        const currentUsers = users.slice(start, end);

        let lines = [];
        for (const u of currentUsers) {
          let member;
          try {
            member = await message.guild.members.fetch(u.userId);
          } catch (e) {
            member = null;
          }
          const name = member ? `${member.user.tag} (${u.userId})` : u.userId;
          const warnLines = u.warns
            .map(
              (w, i) =>
                `\`${i + 1}.\` **Lý do:** ${w.reason} | **Mod:** <@${w.mod}> | <t:${Math.floor(w.timestamp / 1000)}:d> | **ID:** \`${w.id}\``
            )
            .join('\n');
          lines.push(
            `**${name}** — Tổng: **${u.warns.length} cảnh báo**\n${warnLines}`
          );
        }

        const embed = createInfoEmbed(
          `Cảnh báo trong server (${users.length} thành viên) — Trang ${page}/${totalPage}`,
          lines.join('\n\n')
        );
        return embed;
      };

      // Gửi trang đầu tiên với nút
      let currentPage = 1;
      const totalPage = Math.ceil(users.length / USERS_PER_PAGE);
      const embed = await getPageEmbed(currentPage);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev_warnings_page')
          .setLabel('⬅️ Trang trước')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 1),
        new ButtonBuilder()
          .setCustomId('next_warnings_page')
          .setLabel('Trang sau ➡️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === totalPage)
      );

      const reply = await message.reply({ embeds: [embed], components: [row] });

      // Tạo collector để xử lý nút chuyển trang
      const filter = (i) =>
        i.user.id === message.author.id &&
        ['prev_warnings_page', 'next_warnings_page'].includes(i.customId);

      const collector = reply.createMessageComponentCollector({ filter, time: 60 * 1000 });

      collector.on('collect', async (i) => {
        if (i.customId === 'prev_warnings_page' && currentPage > 1) {
          currentPage--;
        } else if (i.customId === 'next_warnings_page' && currentPage < totalPage) {
          currentPage++;
        }

        const embed = await getPageEmbed(currentPage);

        // Update nút
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('prev_warnings_page')
            .setLabel('⬅️ Trang trước')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === 1),
          new ButtonBuilder()
            .setCustomId('next_warnings_page')
            .setLabel('Trang sau ➡️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === totalPage)
        );

        await i.update({ embeds: [embed], components: [row] });
      });

      collector.on('end', async () => {
        // Sau 60s, disable nút để tránh spam
        const embed = await getPageEmbed(currentPage);
        const rowDisabled = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('prev_warnings_page')
            .setLabel('⬅️ Trang trước')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('next_warnings_page')
            .setLabel('Trang sau ➡️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );
        await reply.edit({ embeds: [embed], components: [rowDisabled] }).catch(() => {});
      });
      return;
    }

    // ========= Warnings cho 1 user =========
    const userArg = args[0];
    if (!userArg)
      return message.reply({ embeds: [createErrorEmbed('Thiếu thông tin', `Cách dùng: \`${this.data.usage}\``)] });

    let target = message.mentions.members.first();
    let userId = userArg;
    if (target) userId = target.id;
    let displayName = target?.user?.tag || userId;
    if (!target) {
      target = await message.guild.members.fetch(userId).catch(() => null);
      if (target) displayName = target.user.tag;
    }

    const warns = moderationDB.getActiveWarns(userId, message.guild.id);
    if (!warns.length) {
      return message.reply({ embeds: [createInfoEmbed('Không có cảnh báo', `Thành viên **${displayName}** hiện không có cảnh báo nào.`)] });
    }

    const lines = warns
      .slice(-10)
      .map((w, i) =>
        `\`${i + 1}.\` **Lý do:** ${w.reason}\n┗ **Mod:** <@${w.mod}> | **Ngày:** <t:${Math.floor(w.timestamp / 1000)}:d> | **ID Warn:** \`${w.id}\``
      );
    const embed = createInfoEmbed(
      `Cảnh báo của ${displayName}`,
      lines.join('\n\n')
    ).setFooter({
      text: warns.length > 10 ? `Chỉ hiển thị 10 cảnh báo gần nhất / Tổng: ${warns.length}` : `Tổng: ${warns.length}`
    });

    await message.reply({ embeds: [embed] });
  }
};
