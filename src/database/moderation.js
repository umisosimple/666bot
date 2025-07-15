// src/database/moderation.js

const fs = require('fs');
const path = require('path');
const { createInfoEmbed, createSuccessEmbed, createErrorEmbed } = require('../utils/embedBuilder');
const config = require('../config/config');

const DATA_FILE = path.join(__dirname, '../../data/moderation.json');

// Đọc dữ liệu moderation từ file
function load() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    console.error('Không đọc được file moderation.json:', e);
    return [];
  }
}

// Ghi dữ liệu moderation ra file
function save(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Thêm một log mới vào moderation.json
function addLog(action) {
  const data = load();
  data.push(action);
  save(data);
}

// Lấy toàn bộ log (hoặc filter theo user/guild/type)
function getLogs({ userId, guildId, type } = {}) {
  let data = load();
  if (userId) data = data.filter(l => l.user === userId);
  if (guildId) data = data.filter(l => l.guild === guildId);
  if (type) data = data.filter(l => l.type === type);
  return data;
}

// ---- Quản lý Warn ----
// Thêm warn mới
function addWarning({ user, mod, reason, guild }) {
  const timestamp = Date.now();
  const id = `${user}-${timestamp}`;
  addLog({ type: 'warn', user, mod, reason, timestamp, id, guild });
  return id;
}

// Lấy số warn hiện tại của 1 user trong 1 guild
function getActiveWarns(user, guild) {
  return load().filter(l => l.type === 'warn' && l.user === user && l.guild === guild);
}

// Xoá một cảnh báo (bởi ID warn)
function removeWarning(warnId) {
  let data = load();
  const idx = data.findIndex(l => l.type === 'warn' && l.id === warnId);
  if (idx !== -1) {
    data.splice(idx, 1);
    save(data);
    return true;
  }
  return false;
}

// Xoá toàn bộ warn của 1 user sau khi bị ban
function clearWarns(user, guild) {
  let data = load();
  data = data.filter(l => !(l.type === 'warn' && l.user === user && l.guild === guild));
  save(data);
}

// ---- Quản lý Mute ----
// Thêm mute mới
function addMute({ user, mod, reason, duration, guild }) {
  const timestamp = Date.now();
  const expires = timestamp + duration;
  const id = `${user}-${timestamp}`;
  addLog({ type: 'mute', user, mod, reason, timestamp, duration, expires, id, guild, active: true });
  return id;
}

// Xoá trạng thái mute (khi unmute hoặc hết hạn)
function unmuteUser(user, guild) {
  let data = load();
  let changed = false;
  for (let l of data) {
    if (l.type === 'mute' && l.user === user && l.guild === guild && l.active) {
      l.active = false;
      changed = true;
    }
  }
  if (changed) save(data);
  return changed;
}

// Lấy các mute đang active (để check auto-unmute)
function getActiveMutes() {
  return load().filter(l => l.type === 'mute' && l.active);
}

// ---- Quản lý Ban/Kick/Unban/Unmute/Unwarn/Clear (chỉ log lại, không cần xóa) ----

function addBan({ user, mod, reason, guild }) {
  addLog({ type: 'ban', user, mod, reason, timestamp: Date.now(), guild });
}
function addUnban({ user, mod, reason, guild }) {
  addLog({ type: 'unban', user, mod, reason, timestamp: Date.now(), guild });
}
function addKick({ user, mod, reason, guild }) {
  addLog({ type: 'kick', user, mod, reason, timestamp: Date.now(), guild });
}
function addUnmute({ user, mod, reason, guild }) {
  addLog({ type: 'unmute', user, mod, reason, timestamp: Date.now(), guild });
}
function addUnwarn({ user, mod, warnId, guild }) {
  addLog({ type: 'unwarn', user, mod, warnId, timestamp: Date.now(), guild });
}
function addClear({ mod, count, channel, guild }) {
  addLog({ type: 'clear', mod, count, channel, timestamp: Date.now(), guild });
}

// ---- Hỗ trợ gửi log lên kênh modlog ----
async function sendModLog(client, embed) {
  const channelId = config.moderation?.logChannelId;
  if (!channelId) return;
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;
  channel.send({ embeds: [embed] });
}

// ---- TỰ ĐỘNG UNMUTE (gọi ở file ready.js hoặc messageCreate.js) ----
function scheduleAutoUnmute(client, mutedRoleId) {
  setInterval(async () => {
    const mutes = getActiveMutes();
    const now = Date.now();
    for (const mute of mutes) {
      if (mute.expires && mute.active && now >= mute.expires) {
        // Tìm guild, member
        try {
          const guild = await client.guilds.fetch(mute.guild);
          const member = await guild.members.fetch(mute.user);
          if (member && member.roles.cache.has(mutedRoleId)) {
            await member.roles.remove(mutedRoleId, 'Unmute tự động (hết hạn)');
            unmuteUser(mute.user, mute.guild);
            // Log unmute
            const embed = createSuccessEmbed(
              'Unmute tự động',
              `<@${mute.user}> đã được unmute tự động (hết hạn mute)`
            );
            sendModLog(client, embed);
          }
        } catch (e) {
          // Có thể user đã rời guild, role mất v.v.
        }
      }
    }
  }, 60 * 1000); // Check mỗi phút
}

module.exports = {
  addWarning,
  getActiveWarns,
  removeWarning,
  clearWarns,
  addMute,
  unmuteUser,
  getActiveMutes,
  addBan,
  addUnban,
  addKick,
  addUnmute,
  addUnwarn,
  addClear,
  getLogs,
  sendModLog,
  scheduleAutoUnmute
};
