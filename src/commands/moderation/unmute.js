const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embedBuilder');
const config = require('../../config/config');

module.exports = {
  data: {
    name: 'unmute',
    description: 'Bỏ mute một thành viên',
    usage: 'unmute <@user|ID>',
    permissions: ['MODERATE_MEMBERS', 'MANAGE_ROLES'],
    cooldown: 5,
    category: 'moderation'
  },
  execute: async (message, args) => {
    if (
      !message.member.permissions.has('MODERATE_MEMBERS') &&
      !message.member.permissions.has('MANAGE_ROLES')
    ) {
      return message.reply({ embeds: [createErrorEmbed('Thiếu quyền', 'Bạn cần quyền Moderate Members hoặc Manage Roles để dùng lệnh này!')] });
    }
    const userArg = args[0];
    if (!userArg) {
      return message.reply({ embeds: [createErrorEmbed('Thiếu thông tin', 'Bạn cần mention hoặc nhập ID user muốn unmute!')] });
    }
    let target = message.mentions.members.first();
    let userId = userArg;
    if (!target) {
      target = await message.guild.members.fetch(userId).catch(() => null);
    }
    if (!target) {
      return message.reply({ embeds: [createErrorEmbed('Không tìm thấy thành viên', `Không tìm thấy user với ID \`${userId}\` trong server.`)] });
    }
    const mutedRoleId = config.moderation.roles.muted;
    if (!mutedRoleId) return message.reply({ embeds: [createErrorEmbed('Thiếu cấu hình', 'Chưa cài đặt role Muted trong config!')] });

    if (!target.roles.cache.has(mutedRoleId)) {
      return message.reply({ embeds: [createErrorEmbed('Không bị mute', 'Thành viên này hiện không bị mute!')] });
    }
    await target.roles.remove(mutedRoleId);

    // ===> THÊM EMBED XÁC NHẬN THÀNH CÔNG:
    await message.reply({
      embeds: [
        createSuccessEmbed('Unmute thành công', `<@${target.id}> đã được bỏ mute.`)
      ]
    });
  }
};
