// src/commands/moderation/ban.js

const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embedBuilder');
const moderationDB = require('../../database/moderation');
const config = require('../../config/config');

module.exports = {
  data: {
    name: 'ban',
    description: 'Ban thành viên khỏi server.',
    usage: 'bng ban <@user|userId> [lý do]',
    example: 'bng ban @user lăng mạ',
    permissions: ['BAN_MEMBERS'],
    cooldown: 5,
    category: 'moderation'
  },
  execute: async (message, args) => {
    if (!message.guild) return;
    if (!message.member.permissions.has('BAN_MEMBERS')) {
      return message.reply({ embeds: [createErrorEmbed('Thiếu quyền', 'Bạn cần quyền Ban để sử dụng lệnh này!')] });
    }
    const userArg = args[0];
    if (!userArg) return message.reply({ embeds: [createErrorEmbed('Thiếu thông tin', `Cách dùng: \`${this.data.usage}\``)] });
    let target = message.mentions.members.first();
    if (!target) target = await message.guild.members.fetch(userArg).catch(() => null);
    if (!target) return message.reply({ embeds: [createErrorEmbed('Không tìm thấy thành viên', 'Hãy nhập đúng @user hoặc ID user!')] });
    if (!target.bannable) return message.reply({ embeds: [createErrorEmbed('Không thể ban', 'Bot không thể ban thành viên này (role quá cao hoặc thiếu quyền)!')] });
    if (target.id === message.author.id) return message.reply({ embeds: [createErrorEmbed('Không hợp lệ', 'Bạn không thể ban chính mình!')] });
    if (target.user.bot) return message.reply({ embeds: [createErrorEmbed('Không hợp lệ', 'Không thể ban bot!')] });
    const reason = args.slice(1).join(' ') || 'Không có lý do';
    await target.ban({ reason: `Ban bởi ${message.author.tag}: ${reason}` });
    moderationDB.addBan({ user: target.id, mod: message.author.id, reason, guild: message.guild.id });
    const embed = createSuccessEmbed('Ban thành công',
      [
        `👤 **Thành viên:** <@${target.id}>`,
        `👮 **Mod:** <@${message.author.id}>`,
        `📝 **Lý do:** ${reason}`,
      ].join('\n')
    );
    await message.reply({ embeds: [embed] });
    moderationDB.sendModLog(message.client, embed);
  }
};
