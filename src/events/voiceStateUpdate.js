// economy.js

function setVoiceJoin(userId, time) {
  const user = getUser(userId);
  user.voiceJoinedAt = time;
  save(); // Nếu bạn có hàm save()
}

function addVoiceExpFromJoin(userId, leaveTime) {
  const user = getUser(userId);
  if (!user.voiceJoinedAt) return;
  // Tính tổng thời gian online voice (tính bằng phút, mỗi 5 phút được 1 exp)
  const duration = leaveTime - user.voiceJoinedAt;
  const minutes = Math.floor(duration / 60000);
  const exp = Math.floor(minutes / 5); // 1 exp mỗi 5 phút
  if (exp > 0) addExp(userId, exp, 'voice');
  user.voiceJoinedAt = null;
  save(); // Nếu có hàm save()
}

// Đảm bảo export ra
module.exports = {
  // ... các hàm khác ...
  setVoiceJoin,
  addVoiceExpFromJoin,
  // ...
};
