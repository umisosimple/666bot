module.exports = {
  prefix: process.env.PREFIX || 'bng',
  ownerId: process.env.OWNER_ID || '532160348300771338',
  cooldownTime: 3000,
  embedColors: {
    success: process.env.EMBED_COLOR_SUCCESS || '#00ff00',
    error: process.env.EMBED_COLOR_ERROR || '#ff0000',
    warning: process.env.EMBED_COLOR_WARNING || '#ffaa00',
    info: process.env.EMBED_COLOR_INFO || '#0099ff',
    default: process.env.EMBED_COLOR_DEFAULT || '#9932cc'
  },
  presence: {
    name: process.env.PRESENCE_NAME || 'Bùi Hà Bảo Ngọc',
    type: process.env.PRESENCE_TYPE || 'LISTENING',
    url: process.env.PRESENCE_URL || 'https://youtu.be/t5tBVKXMh5k?si=JH-qlzonLAj61cRm',
    status: process.env.PRESENCE_STATUS || 'idle'
  },
  moderation: {
    roles: {
      // Thay ID bên dưới bằng ID role thực tế trên server của bạn
      admin: process.env.ADMIN_ROLE_ID || 'ADMIN_ROLE_ID',
      moderator: process.env.MOD_ROLE_ID || 'MOD_ROLE_ID',
      muted: process.env.MUTED_ROLE_ID || 'MUTED_ROLE_ID'
    },
    channels: {
      // Thay ID bên dưới bằng ID channel thực tế nếu muốn log
      modLog: process.env.MOD_LOG_CHANNEL || 'MOD_LOG_CHANNEL_ID'
    },
    settings: {
      maxWarnings: parseInt(process.env.MAX_WARNINGS) || 3,
      defaultMuteDuration: parseInt(process.env.DEFAULT_MUTE_DURATION) || 3600000, // 1 giờ
      logActions: true
    }
  }
};
