// src/commands/moderation/clear.js

const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embedBuilder');
const moderationDB = require('../../database/moderation');
const config = require('../../config/config');

module.exports = {
  data: {
    name: 'clear',
    description: 'Xoá nhiều tin nhắn cùng lúc (1-100)',
    usage: 'bng clear <số lượng>',
    example: 'bng clear 15',
    permissions: ['MANAGE_MESSAGES'],
    cooldown: 5,
    category: 'moderation'
  },
  execute: async (message, args) => {
    if (!message.guild) return;
    if (!message.member.permissions.has('MANAGE_MESSAGES')) {
      return message.reply({ embeds: [createErrorEmbed('Thiếu quyền', 'Bạn cần quyền Quản lý tin nhắn để dùng lệnh này!')] });
    }
    const count = parseInt(args[0]);
    if (isNaN(count) || count < 1 || count > 100) {
      return message.reply({ embeds: [createErrorEmbed('Sai cú pháp', 'Vui lòng nhập số lượng từ 1 đến 100!')] });
    }
    await message.channel.bulkDelete(count, true).catch(() => null);
    moderationDB.addClear({ mod: message.author.id, count, channel: message.channel.id, guild: message.guild.id });
    const embed = createSuccessEmbed('Đã xoá tin nhắn',
      [
        `👮 **Mod:** <@${message.author.id}>`,
        `#️⃣ **Kênh:** <#${message.channel.id}>`,
        `💬 **Số lượng:** ${count}`,
      ].join('\n')
    );
    await message.channel.send({ embeds: [embed] }).then(msg => setTimeout(() => msg.delete().catch(() => null), 3000));
    moderationDB.sendModLog(message.client, embed);
  }
};
