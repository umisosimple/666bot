const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embedBuilder');
const moderationDB = require('../../database/moderation');

module.exports = {
  data: {
    name: 'unwarn',
    description: 'Gỡ một cảnh báo cho thành viên bằng ID cảnh báo',
    usage: 'unwarn <@user|ID> <ID cảnh báo>',
    permissions: ['KICK_MEMBERS', 'BAN_MEMBERS'],
    cooldown: 5,
    category: 'moderation'
  },
  execute: async (message, args) => {
    if (
      !message.member.permissions.has('KICK_MEMBERS') &&
      !message.member.permissions.has('BAN_MEMBERS')
    ) {
      return message.reply({ embeds: [createErrorEmbed('Thiếu quyền', 'Bạn cần quyền Kick Members hoặc Ban Members để dùng lệnh này!')] });
    }
    const userArg = args[0];
    const warnId = args[1];
    if (!userArg || !warnId) {
      return message.reply({ embeds: [createErrorEmbed('Thiếu thông tin', 'Cách dùng: unwarn <@user|ID> <ID cảnh báo>')] });
    }
    let target = message.mentions.members.first();
    let userId = userArg;
    if (!target) {
      target = await message.guild.members.fetch(userId).catch(() => null);
    }
    if (!target) {
      return message.reply({ embeds: [createErrorEmbed('Không tìm thấy thành viên', `Không tìm thấy user với ID \`${userId}\` trong server.`)] });
    }

    const result = moderationDB.removeWarning(target.id, warnId, message.guild.id);
    if (result) {
      // ===> THÊM EMBED XÁC NHẬN THÀNH CÔNG:
      await message.reply({
        embeds: [
          createSuccessEmbed('Gỡ cảnh báo thành công', `Đã gỡ cảnh báo \`${warnId}\` cho <@${target.id}>.`)
        ]
      });
    } else {
      return message.reply({ embeds: [createErrorEmbed('Không tìm thấy cảnh báo', `Không tìm thấy cảnh báo với ID \`${warnId}\` của <@${target.id}>.`)] });
    }
  }
};
