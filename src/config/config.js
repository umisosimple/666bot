module.exports = {
    // Token và các thông tin bot cũ giữ nguyên
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    prefix: process.env.PREFIX || 'bng', // Đổi tiền tố mặc định thành 'bng'
    ownerId: process.env.OWNER_ID,
    ownerIds: process.env.OWNER_ID ? [process.env.OWNER_ID] : [],

    // Cấu hình moderation mới
    moderation: {
        // ID kênh gửi log moderation (có thể đổi bất kỳ lúc nào)
        logChannelId: '1394370853285662741', // Đổi tại đây khi cần

        // Các role dành cho hệ thống moderation (điền id role cần giới hạn)
        roles: {
            admin: '', // ID role admin (nếu muốn)
            moderator: '', // ID role moderator (nếu muốn)
            muted: '1394381161752563863', // ID role muted (nên điền nếu muốn dùng lệnh mute)
        },

        // Thời gian mute mặc định (miligiây) = 24 tiếng
        defaultMuteDuration: 24 * 60 * 60 * 1000,

        // Số lần warn sẽ auto-ban (reset warn về 0 sau khi ban)
        autoBanWarns: 3,
    },

    // Phần cũ về kinh tế, màu embed v.v. vẫn giữ nguyên
    economy: {
        defaultBalance: parseInt(process.env.DEFAULT_BALANCE) || 1000,
        dailyReward: parseInt(process.env.DAILY_REWARD) || 100
    },
    embedColors: {
        success: '#43EA97',
        error: '#FF89A0', 
        warning: '#FFD580',
        info: '#0099ff'
    }
};
