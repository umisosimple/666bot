// src/commands/moderation/mute.js

const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embedBuilder');
const moderationDB = require('../../database/moderation');
const config = require('../../config/config');
const ms = require('ms'); // Nhớ cài: npm install ms

module.exports = {
  data: {
    name: 'mute',
    description: 'Mute thành viên với thời gian tùy chọn',
    usage: 'bng mute <@user|userId> [thời gian] [lý do]',
    // Để hiển thị hướng dẫn khi gõ sai lệnh
    example: 'bng mute @username 30m spam',
    permissions: ['MODERATE_MEMBERS', 'MANAGE_ROLES'], // Quyền yêu cầu
    cooldown: 5,
    category: 'moderation'
  },
  /**
   * Cách dùng:
   * - bng mute @user [thời gian] [lý do]
   *   + @user hoặc id user: có thể dùng cả 2 dạng
   *   + thời gian: vd 10m, 2h, 1d... hoặc bỏ trống (mặc định 1 ngày)
   *   + lý do: tùy chọn, có thể bỏ trống
   */
  execute: async (message, args) => {
    // 1. Kiểm tra quyền
    if (!message.guild) return;
    if (!message.member.permissions.has('MODERATE_MEMBERS') && !message.member.permissions.has('MANAGE_ROLES')) {
      return message.reply({ embeds: [createErrorEmbed('Thiếu quyền', 'Bạn cần quyền Quản lý thành viên hoặc Quản lý vai trò để mute!')] });
    }

    // 2. Kiểm tra role muted đã cấu hình
    const mutedRoleId = config.moderation.roles.muted;
    if (!mutedRoleId) {
      return message.reply({ embeds: [createErrorEmbed('Chưa cấu hình', 'Chưa cấu hình ID role muted trong config!')] });
    }
    const mutedRole = await message.guild.roles.fetch(mutedRoleId).catch(() => null);
    if (!mutedRole) {
      return message.reply({ embeds: [createErrorEmbed('Lỗi', 'Không tìm thấy role muted!')] });
    }

    // 3. Lấy target từ @mention hoặc ID
    const userArg = args[0];
    if (!userArg) {
      return message.reply({ embeds: [createErrorEmbed('Thiếu thông tin', `Cách dùng: \`${this.data.usage}\``)] });
    }
    let target = message.mentions.members.first();
    if (!target) {
      // Nếu không phải @mention thì thử lấy theo ID
      target = await message.guild.members.fetch(userArg).catch(() => null);
    }
    if (!target) {
      return message.reply({ embeds: [createErrorEmbed('Không tìm thấy thành viên', 'Vui lòng nhập đúng @user hoặc ID user trong server!')] });
    }

    if (target.id === message.author.id) {
      return message.reply({ embeds: [createErrorEmbed('Không hợp lệ', 'Bạn không thể mute chính mình!')] });
    }
    if (target.user.bot) {
      return message.reply({ embeds: [createErrorEmbed('Không hợp lệ', 'Không thể mute bot!')] });
    }
    if (target.roles.cache.has(mutedRoleId)) {
      return message.reply({ embeds: [createErrorEmbed('Đã bị mute', 'Thành viên này đã bị mute!')] });
    }

    // 4. Lấy thời gian mute (hỗ trợ 1d/24h/60m...), mặc định 24 tiếng
    let duration = config.moderation.defaultMuteDuration;
    let reason = 'Không có lý do';
    if (args[1]) {
      const parsed = ms(args[1]);
      if (parsed && parsed >= 60 * 1000) { // Tối thiểu 1 phút
        duration = parsed;
        reason = args.slice(2).join(' ') || reason;
      } else {
        // Nếu args[1] không phải thời gian thì ghép vào lý do
        reason = args.slice(1).join(' ') || reason;
      }
    }

    // 5. Gán role muted
    try {
      await target.roles.add(mutedRoleId, `Muted by ${message.author.tag}: ${reason}`);
    } catch (e) {
      return message.reply({ embeds: [createErrorEmbed('Không thể mute', 'Bot không thể gán role muted (thiếu quyền hoặc role quá cao)!')] });
    }

    // 6. Ghi log & schedule unmute
    moderationDB.addMute({
      user: target.id,
      mod: message.author.id,
      reason,
      duration,
      guild: message.guild.id
    });

    // 7. Thông báo (embed rõ ràng thời gian mute)
    const expiresAt = new Date(Date.now() + duration);
    const embed = createSuccessEmbed(
      'Mute thành công',
      [
        `👤 **Thành viên:** <@${target.id}>`,
        `👮 **Mod:** <@${message.author.id}>`,
        `⏰ **Thời gian:** ${ms(duration, { long: true })}`,
        `📝 **Lý do:** ${reason}`,
        `🕒 **Bắt đầu:** <t:${Math.floor(Date.now() / 1000)}:f>`,
        `🕗 **Kết thúc:** <t:${Math.floor(expiresAt.getTime() / 1000)}:f>`
      ].join('\n')
    );
    await message.reply({ embeds: [embed] });

    // 8. Gửi log ra kênh log (nếu có)
    moderationDB.sendModLog(message.client, embed);
  }
};
