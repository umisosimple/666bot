const fs = require('fs');
const path = require('path');
const { validateContent } = require('../utils/validator');

class EconomyDatabase {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/economy.json');
    this.data = this.loadData();
    this.saving = false; // Prevent concurrent saves
  }

  loadData() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const data = JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
        return data;
      }
    } catch (error) {
      console.error('Error loading economy data:', error);
    }
    return {};
  }

  async saveData() {
    if (this.saving) return;
    this.saving = true;
    
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Backup trước khi save
      const backupPath = this.dbPath + '.backup';
      if (fs.existsSync(this.dbPath)) {
        fs.copyFileSync(this.dbPath, backupPath);
      }
      
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error saving economy data:', error);
    } finally {
      this.saving = false;
    }
  }

  // Validation helpers
  isValidUserId(userId) {
    return typeof userId === 'string' && 
           userId.length > 0 && 
           /^\d+$/.test(userId) && // Discord user ID chỉ chứa số
           userId.length >= 17 && userId.length <= 20; // Discord ID length
  }

  isValidAmount(amount) {
    return typeof amount === 'number' && 
           amount > 0 && 
           isFinite(amount) && 
           amount <= 999999999; // Giới hạn số tiền tối đa
  }

  // Economy-specific validation methods
  validateTransaction(fromUserId, toUserId, amount, reason = '') {
    const errors = [];
    
    if (!this.isValidUserId(fromUserId)) {
      errors.push('ID người gửi không hợp lệ');
    }
    
    if (!this.isValidUserId(toUserId)) {
      errors.push('ID người nhận không hợp lệ');
    }
    
    if (fromUserId === toUserId) {
      errors.push('Không thể gửi tiền cho chính mình');
    }
    
    if (!this.isValidAmount(amount)) {
      errors.push('Số tiền không hợp lệ');
    }
    
    if (reason && !this.validateUserInput(reason).valid) {
      errors.push('Lý do giao dịch không hợp lệ');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  validateInventoryItem(itemId, quantity = 1) {
    // Cập nhật list items khớp với shop.js
    const validItems = [
      'exp_booster', 'fishing_rod', 'hunting_bow', 'lucky_charm',
      'bank_upgrade', 'vip_pass', 'fishing_rod_pro', 'hunting_bow_pro', 'golden_charm'
    ];
    
    return {
      valid: validItems.includes(itemId) && 
             typeof quantity === 'number' && 
             quantity > 0 && 
             quantity <= 100,
      message: !validItems.includes(itemId) ? 'Item không tồn tại' : 
               quantity <= 0 ? 'Số lượng phải lớn hơn 0' :
               quantity > 100 ? 'Số lượng tối đa là 100' : ''
    };
  }

  // Cooldown validation
 validateCooldown(lastTime, cooldownMs, actionName) {
    const now = Date.now();
    const timeLeft = lastTime + cooldownMs - now;
    
    if (timeLeft > 0) {
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.ceil((timeLeft % 60000) / 1000); // Lấy giây còn lại
      const hours = Math.floor(timeLeft / 3600000);
      
      let timeMsg = '';
      if (hours > 0) {
        timeMsg = `${hours} giờ ${minutes} phút`;
      } else if (minutes > 0) {
        timeMsg = `${minutes} phút ${seconds} giây`;
      } else {
        timeMsg = `${seconds} giây`;
      }
      
      return {
        valid: false,
        message: `Bạn cần đợi **${timeMsg}** để thực hiện **${actionName}** tiếp theo!`,
        timeLeft: timeLeft // Thời gian còn lại tính bằng ms
      };
    }
    
    return { valid: true };
  }

  getUser(userId) {
    if (!this.isValidUserId(userId)) {
      throw new Error('Invalid user ID');
    }

    if (!this.data[userId]) {
      this.data[userId] = {
        money: 1000,
        bank: 0,
        level: 1,
        exp: 0,
        daily: 0,
        weekly: 0,
        monthly: 0,
        lastMessageExp: 0,
        lastVoiceExp: 0,
        lastFish: 0,
        lastHunt: 0,
        lastWork: 0,
        lastRob: 0,
        lastMine: 0,
        streak: {
          daily: 0,
          hunt: 0,
          fish: 0
        },
        inventory: {},
        pets: [],
        fishingStats: { 
          totalCaught: 0,
          bestFish: null 
        },
        huntingStats: { 
          totalHunted: 0,
          bestHunt: null 
        },
        workStats: { 
          totalWorked: 0 
        },
        achievements: this.getDefaultAchievements(),
        tasks: {
          daily: false,
          fish: 0,
          hunt: 0,
          work: 0,
          lastReset: null
        }
      };
      this.saveData();
    }
    return this.data[userId];
  }

  getDefaultAchievements() {
    return [
      { name: "Lần đầu câu cá", completed: false, reward: 200 },
      { name: "Lần đầu săn bắt", completed: false, reward: 200 },
      { name: "Lần đầu làm việc", completed: false, reward: 200 },
      { name: "Lần đầu nhận phần thưởng hàng ngày", completed: false, reward: 300 },
      { name: "Câu cá 50 lần", completed: false, reward: 800 },
      { name: "Câu cá 100 lần", completed: false, reward: 1200 },
      { name: "Câu cá 300 lần", completed: false, reward: 1800 },
      { name: "Câu cá 500 lần", completed: false, reward: 2500 },
      { name: "Câu cá 700 lần", completed: false, reward: 3500 },
      { name: "Câu cá 1000 lần", completed: false, reward: 5000 },
      { name: "Săn bắn 50 lần", completed: false, reward: 800 },
      { name: "Săn bắn 100 lần", completed: false, reward: 1200 },
      { name: "Săn bắn 300 lần", completed: false, reward: 1800 },
      { name: "Săn bắn 500 lần", completed: false, reward: 2500 },
      { name: "Săn bắn 700 lần", completed: false, reward: 3500 },
      { name: "Săn bắn 1000 lần", completed: false, reward: 5000 },
      { name: "Làm việc 50 lần", completed: false, reward: 800 },
      { name: "Làm việc 100 lần", completed: false, reward: 1200 },
      { name: "Làm việc 300 lần", completed: false, reward: 1800 },
      { name: "Làm việc 500 lần", completed: false, reward: 2500 },
      { name: "Làm việc 700 lần", completed: false, reward: 3500 },
      { name: "Làm việc 1000 lần", completed: false, reward: 5000 },
      { name: "Hoàn thành tất cả nhiệm vụ hàng ngày trong 7 ngày liên tiếp", completed: false, reward: 1500 },
      { name: "Hoàn thành tất cả nhiệm vụ hàng ngày trong 14 ngày liên tiếp", completed: false, reward: 2000 },
      { name: "Hoàn thành tất cả nhiệm vụ hàng ngày trong 30 ngày liên tiếp", completed: false, reward: 3000 },
      { name: "Hoàn thành tất cả nhiệm vụ hàng ngày trong 60 ngày liên tiếp", completed: false, reward: 5000 }
    ];
  }

  updateUser(userId, userData) {
    if (!this.isValidUserId(userId)) {
      throw new Error('Invalid user ID');
    }
    
    this.data[userId] = { ...this.getUser(userId), ...userData };
    this.saveData();
  }

  addMoney(userId, amount) {
    if (!this.isValidAmount(amount)) {
      throw new Error('Invalid amount');
    }
    
    const user = this.getUser(userId);
    user.money = Math.max(0, user.money + Math.floor(amount));
    this.updateUser(userId, user);
    return user.money;
  }

  removeMoney(userId, amount) {
    if (!this.isValidAmount(amount)) {
      throw new Error('Invalid amount');
    }
    
    const user = this.getUser(userId);
    if (user.money >= amount) {
      user.money -= Math.floor(amount);
      this.updateUser(userId, user);
      return true;
    }
    return false;
  }

  transferMoney(fromUserId, toUserId, amount, reason = '') {
    const validation = this.validateTransaction(fromUserId, toUserId, amount, reason);
    
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }
    
    const fromUser = this.getUser(fromUserId);
    const toUser = this.getUser(toUserId);
    
    if (fromUser.money >= amount) {
      fromUser.money -= Math.floor(amount);
      toUser.money += Math.floor(amount);
      
      this.updateUser(fromUserId, fromUser);
      this.updateUser(toUserId, toUser);
      
      // Log transaction (có thể mở rộng sau)
      this.logTransaction(fromUserId, toUserId, amount, reason);
      
      return { success: true };
    }
    
    return { 
      success: false, 
      message: 'Số dư không đủ để thực hiện giao dịch' 
    };
  }

  hasEnoughMoney(userId, amount) {
    if (!this.isValidAmount(amount)) {
      return false;
    }
    
    const user = this.getUser(userId);
    return user.money >= amount;
  }

  // EXP & Level
  addExp(userId, amount) {
    const user = this.getUser(userId);
    let oldLevel = user.level;
    user.exp += amount;
    let leveledUp = false;
    let message = null;
    // Giả sử mỗi level cần 100 * level exp, bạn có thể sửa công thức này
    while (user.exp >= user.level * 100) {
      user.exp -= user.level * 100;
      user.level += 1;
      leveledUp = true;
    }
    this.updateUser(userId, user);
    if (leveledUp) {
      message = `🎉 <@${userId}> đã lên cấp **${user.level}**!`;
      return { level: user.level, message };
    }
    return null;
  }

  // ==== BỔ SUNG HÀM DÀNH RIÊNG CHO VOICE ====
  setVoiceJoinedAt(userId, timestamp) {
    const user = this.getUser(userId);
    user.voiceJoinedAt = timestamp;
    this.updateUser(userId, user);
  }

  getVoiceJoinedAt(userId) {
    const user = this.getUser(userId);
    return user.voiceJoinedAt || null;
  }

  resetVoiceJoinedAt(userId) {
    const user = this.getUser(userId);
    user.voiceJoinedAt = null;
    this.updateUser(userId, user);
  }

  // Thông báo lên cấp
  levelUp(userId) {
    const user = this.getUser(userId);
    const oldLevel = user.level;
    user.level += 1;
    user.exp = 0;

    const baseReward = 100;
    const levelMultiplier = 50;
    const reward = baseReward + (user.level * levelMultiplier);
    
    this.addMoney(userId, reward);
    this.updateUser(userId, user);

    return {
      userId,
      oldLevel,
      newLevel: user.level,
      reward,
      message: `🎉 Chúc mừng <@${userId}>! Bạn đã lên cấp **${user.level}** và nhận được **${reward.toLocaleString()} coins**! 💰`
    };
  }

addMessageExp(userId) {
    const user = this.getUser(userId);
    
    // Kiểm tra cooldown nhưng không trả về thông báo
    const cooldownCheck = this.validateCooldown(user.lastMessageExp, 60000, 'nhắn tin để nhận EXP');
    if (!cooldownCheck.valid) {
      return { success: false }; // Không có message
    }

    const expGain = Math.floor(Math.random() * 15) + 5; // 5-20 EXP
    user.exp += expGain;
    user.lastMessageExp = Date.now();

    const requiredExp = this.getRequiredExp(user.level);
    if (user.exp >= requiredExp) {
      return this.levelUp(userId);
    }

    this.updateUser(userId, user);
    return { success: true, expGain };
  }

  addVoiceExp(userId) {
    const user = this.getUser(userId);
    const cooldownCheck = this.validateCooldown(user.lastVoiceExp, 3600000, 'tham gia voice để nhận EXP');
    
    if (!cooldownCheck.valid) {
      return { success: false, message: cooldownCheck.message };
    }

    const expGain = Math.floor(Math.random() * 20) + 10; // 10-30 EXP
    user.exp += expGain;
    user.lastVoiceExp = Date.now();

    const requiredExp = this.getRequiredExp(user.level);
    if (user.exp >= requiredExp) {
      return this.levelUp(userId);
    }

    this.updateUser(userId, user);
    return { success: true, expGain };
  }

  addExp(userId, amount) {
    if (!this.isValidAmount(amount)) {
      throw new Error('Invalid exp amount');
    }
    
    const user = this.getUser(userId);
    user.exp += Math.floor(amount);

    const requiredExp = this.getRequiredExp(user.level);
    if (user.exp >= requiredExp) {
      return this.levelUp(userId);
    }

    this.updateUser(userId, user);
    return null;
  }

  getRequiredExp(level) {
    return level * 100;
  }

  getUserLevel(userId) {
    const user = this.getUser(userId);
    const requiredExp = this.getRequiredExp(user.level);
    const progress = Math.min(100, (user.exp / requiredExp) * 100);

    return {
      level: user.level,
      exp: user.exp,
      requiredExp,
      progress: Math.round(progress),
      nextLevelReward: 100 + ((user.level + 1) * 50)
    };
  }

  // Optimized leaderboard với pagination
  getLeaderboard(type = 'money', limit = 10, offset = 0) {
    const users = Object.entries(this.data);
    let sortedUsers = [];

    switch (type) {
      case 'money':
        sortedUsers = users.sort(([,a], [,b]) => b.money - a.money);
        break;
      case 'level':
        sortedUsers = users.sort(([,a], [,b]) => b.level - a.level || b.exp - a.exp);
        break;
      case 'total':
        sortedUsers = users.sort(([,a], [,b]) => (b.money + b.bank) - (a.money + a.bank));
        break;
      case 'fishing':
        sortedUsers = users.sort(([,a], [,b]) => (b.fishingStats?.totalCaught || 0) - (a.fishingStats?.totalCaught || 0));
        break;
      case 'hunting':
        sortedUsers = users.sort(([,a], [,b]) => (b.huntingStats?.totalHunted || 0) - (a.huntingStats?.totalHunted || 0));
        break;
      case 'work':
        sortedUsers = users.sort(([,a], [,b]) => (b.workStats?.totalWorked || 0) - (a.workStats?.totalWorked || 0));
        break;
      default:
        sortedUsers = users.sort(([,a], [,b]) => b.money - a.money);
    }

    return sortedUsers
      .slice(offset, offset + limit)
      .map(([userId, user], index) => ({
        rank: offset + index + 1,
        userId,
        money: user.money,
        bank: user.bank,
        level: user.level,
        exp: user.exp,
        totalCaught: user.fishingStats?.totalCaught || 0,
        totalHunted: user.huntingStats?.totalHunted || 0,
        totalWorked: user.workStats?.totalWorked || 0
      }));
  }

  // Thêm method để check achievements
  checkAchievements(userId) {
    const user = this.getUser(userId);
    const completedAchievements = [];

    user.achievements.forEach(achievement => {
      if (!achievement.completed) {
        let shouldComplete = false;

        // Check fishing achievements
        if (achievement.name.includes('câu cá')) {
          const fishCount = user.fishingStats?.totalCaught || 0;
          if (achievement.name === 'Lần đầu câu cá' && fishCount >= 1) shouldComplete = true;
          else if (achievement.name === 'Câu cá 50 lần' && fishCount >= 50) shouldComplete = true;
          else if (achievement.name === 'Câu cá 100 lần' && fishCount >= 100) shouldComplete = true;
          // ... other fishing achievements
        }

        // Check hunting achievements
        if (achievement.name.includes('săn bắn')) {
          const huntCount = user.huntingStats?.totalHunted || 0;
          if (achievement.name === 'Lần đầu săn bắt' && huntCount >= 1) shouldComplete = true;
          else if (achievement.name === 'Săn bắn 50 lần' && huntCount >= 50) shouldComplete = true;
          // ... other hunting achievements
        }

        // Check work achievements
        if (achievement.name.includes('làm việc')) {
          const workCount = user.workStats?.totalWorked || 0;
          if (achievement.name === 'Lần đầu làm việc' && workCount >= 1) shouldComplete = true;
          else if (achievement.name === 'Làm việc 50 lần' && workCount >= 50) shouldComplete = true;
          // ... other work achievements
        }

        if (shouldComplete) {
          achievement.completed = true;
          this.addMoney(userId, achievement.reward);
          completedAchievements.push(achievement);
        }
      }
    });

    if (completedAchievements.length > 0) {
      this.updateUser(userId, user);
    }

    return completedAchievements;
  }

  // Utility methods
  getUserCount() {
    return Object.keys(this.data).length;
  }

  getTotalMoney() {
    return Object.values(this.data).reduce((total, user) => total + user.money + user.bank, 0);
  }

  // Transaction logging
  logTransaction(fromUserId, toUserId, amount, reason) {
    const logEntry = {
      timestamp: Date.now(),
      from: fromUserId,
      to: toUserId,
      amount: amount,
      reason: reason || 'No reason provided'
    };
    
    // Có thể mở rộng để lưu vào file log riêng
    console.log('Transaction:', logEntry);
  }

  // Inventory management - CẬP NHẬT
  addItemToInventory(userId, itemId, quantity = 1) {
    const validation = this.validateInventoryItem(itemId, quantity);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }
    
    const user = this.getUser(userId);
    
    if (!user.inventory[itemId]) {
      user.inventory[itemId] = {
        name: this.getItemName(itemId),
        type: this.getItemType(itemId),
        description: this.getItemDescription(itemId),
        quantity: 0,
        purchaseDate: Date.now()
      };
    }
    
    user.inventory[itemId].quantity += quantity;
    this.updateUser(userId, user);
    
    return { success: true };
  }

  // Thêm method mới để handle inventory từ shop
  addShopItemToInventory(userId, itemData) {
    const user = this.getUser(userId);
    
    // Tạo inventory structure tương thích với shop.js
    user.inventory[itemData.id] = {
      name: itemData.name,
      type: itemData.type,
      description: itemData.description,
      purchaseDate: Date.now()
    };
    
    this.updateUser(userId, user);
    return { success: true };
  }

  useInventoryItem(userId, itemId, quantity = 1) {
    const user = this.getUser(userId);
    const item = user.inventory[itemId];
    
    if (!item || (item.quantity && item.quantity < quantity)) {
      return { success: false, message: 'Không có đủ item để sử dụng' };
    }
    
    if (item.quantity) {
      item.quantity -= quantity;
      if (item.quantity <= 0) {
        delete user.inventory[itemId];
      }
    } else {
      // Nếu item không có quantity (từ shop), xóa luôn
      delete user.inventory[itemId];
    }
    
    this.updateUser(userId, user);
    return { success: true };
  }

  // Cập nhật getItemName method
  getItemName(itemId) {
    const itemNames = {
      'fishing_rod': '🎣 Cần câu cao cấp',
      'hunting_bow': '🏹 Cung săn chuyên nghiệp',
      'lucky_charm': '🍀 Bùa may mắn',
      'exp_booster': '⚡ Thuốc tăng EXP',
      'bank_upgrade': '🏦 Nâng cấp ngân hàng',
      'vip_pass': '👑 VIP Pass',
      'fishing_rod_pro': '🎣 Cần câu chuyên nghiệp',
      'hunting_bow_pro': '🏹 Cung săn cao cấp',
      'golden_charm': '🏆 Bùa may mắn vàng'
    };
    return itemNames[itemId] || 'Unknown Item';
  }

  // Cập nhật getItemDescription method
  getItemDescription(itemId) {
    const descriptions = {
      'fishing_rod': 'Tăng 20% tỷ lệ câu cá thành công',
      'hunting_bow': 'Tăng 25% tỷ lệ săn thành công',
      'lucky_charm': 'Tăng 10% thu nhập từ mọi hoạt động',
      'exp_booster': 'Tăng gấp đôi EXP nhận được trong 1 giờ',
      'bank_upgrade': 'Tăng giới hạn ngân hàng lên 50%',
      'vip_pass': 'Giảm 50% thời gian cooldown của tất cả lệnh',
      'fishing_rod_pro': 'Tăng 30% tỷ lệ câu cá thành công',
      'hunting_bow_pro': 'Tăng 35% tỷ lệ săn thành công',
      'golden_charm': 'Tăng 20% thu nhập từ mọi hoạt động'
    };
    return descriptions[itemId] || 'No description available';
  }

  // Thêm method getItemType
  getItemType(itemId) {
    const itemTypes = {
      'fishing_rod': 'tool',
      'hunting_bow': 'tool',
      'lucky_charm': 'accessory',
      'exp_booster': 'consumable',
      'bank_upgrade': 'upgrade',
      'vip_pass': 'premium',
      'fishing_rod_pro': 'tool',
      'hunting_bow_pro': 'tool',
      'golden_charm': 'accessory'
    };
    return itemTypes[itemId] || 'misc';
  }

  // Thêm method validateUserInput để tránh lỗi
  validateUserInput(input) {
    return validateContent(input);
  }

  resetDailyTasks() {
    const now = Date.now();
    Object.keys(this.data).forEach(userId => {
      const user = this.data[userId];
      if (!user.tasks.lastReset || now - user.tasks.lastReset >= 24 * 60 * 60 * 1000) {
        user.tasks.daily = false;
        user.tasks.fish = 0;
        user.tasks.hunt = 0;
        user.tasks.work = 0;
        user.tasks.lastReset = now;
      }
    });
    this.saveData();
  }
}

module.exports = new EconomyDatabase();