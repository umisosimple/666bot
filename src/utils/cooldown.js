// src/utils/cooldown.js

const cooldowns = new Map(); // Map để lưu trữ cooldown: <commandName, <userId, expirationTime>>

/**
 * Kiểm tra và áp dụng cooldown cho một người dùng và lệnh cụ thể.
 * @param {string} userId - ID của người dùng.
 * @param {string} commandName - Tên của lệnh.
 * @param {number} cooldownTime - Thời gian cooldown tính bằng giây.
 * @returns {object} - { isOnCooldown: boolean, timeLeft: number (giây) }
 */
function checkAndApplyCooldown(userId, commandName, cooldownTime) {
  if (!cooldowns.has(commandName)) {
    cooldowns.set(commandName, new Map());
  }

  const userCooldowns = cooldowns.get(commandName);
  const now = Date.now();
  const expirationTime = userCooldowns.get(userId);

  if (expirationTime && now < expirationTime) {
    // Đang trong thời gian cooldown
    const timeLeft = Math.ceil((expirationTime - now) / 1000); // Chuyển về giây
    return { isOnCooldown: true, timeLeft: timeLeft };
  } else {
    // Không trong thời gian cooldown, áp dụng cooldown mới
    userCooldowns.set(userId, now + (cooldownTime * 1000));
    return { isOnCooldown: false, timeLeft: 0 };
  }
}

/**
 * Xóa cooldown cho một người dùng và lệnh cụ thể (ví dụ: khi admin reset).
 * @param {string} userId - ID của người dùng.
 * @param {string} commandName - Tên của lệnh.
 */
function clearCooldown(userId, commandName) {
  if (cooldowns.has(commandName)) {
    cooldowns.get(commandName).delete(userId);
  }
}

/**
 * Định dạng thời gian còn lại thành chuỗi dễ đọc.
 * @param {number} seconds - Số giây còn lại.
 * @returns {string} - Chuỗi thời gian (ví dụ: "1 giờ 30 phút", "5 giây").
 */
function formatTime(seconds) {
  if (seconds < 60) {
    return `${seconds} giây`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return `${minutes} phút${remainingSeconds > 0 ? ` ${remainingSeconds} giây` : ''}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} giờ${remainingMinutes > 0 ? ` ${remainingMinutes} phút` : ''}`;
}

module.exports = {
  checkAndApplyCooldown, // Đổi tên từ checkCooldown thành checkAndApplyCooldown
  clearCooldown,
  formatTime
};
