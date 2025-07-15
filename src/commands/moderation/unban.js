const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embedBuilder');

module.exports = {
  data: {
    name: 'unban',
    description: 'Bỏ ban một thành viên bằng user ID',
    usage: 'unban <userId> [lý do]',
    permissions: ['BAN_MEMBERS'],
    cooldown: 5,
    category: 'moderation'
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('BAN_MEMBERS')) {
      return message.reply({ embeds: [createErrorEmbed('Thiếu quyền', 'Bạn cần quyền Ban Members để dùng lệnh này!')] });
    }

    const userId = args[0];
    if (!userId) {
      return message.reply({ embeds: [createErrorEmbed('Thiếu thông tin', 'Bạn cần nhập ID người dùng để unban!')] });
    }
    try {
      await message.guild.members.unban(userId);
      await message.reply({
        embeds: [
          createSuccessEmbed('Unban thành công', `Đã bỏ ban cho user có ID \`${userId}\`.`)
        ]
      });
    } catch (error) {
      return message.reply({ embeds: [createErrorEmbed('Lỗi', `Không thể unban user ID \`${userId}\`. Có thể user không bị ban hoặc ID sai.`)] });
    }
  }
};
