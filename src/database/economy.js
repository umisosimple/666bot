const fs = require('fs');
const path = require('path');

class EconomyDatabase {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/economy.json');
    this.data = this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(this.dbPath)) {
        return JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
      }
    } catch (error) {
      console.error('Error loading economy data:', error);
    }
    return {};
  }

  saveData() {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error saving economy data:', error);
    }
  }

  getUser(userId) {
    if (!this.data[userId]) {
      this.data[userId] = {
        money: 100,
        bank: 0,
        level: 1,
        exp: 0,
        daily: 0,
        weekly: 0,
        monthly: 0,
        inventory: {},
        pets: [],
        achievements: [],
        lastHunt: 0,
        lastFish: 0,
        lastMine: 0,
        lastRob: 0,
        streak: {
          daily: 0,
          hunt: 0,
          fish: 0
        }
      };
      this.saveData();
    }
    return this.data[userId];
  }

  updateUser(userId, userData) {
    this.data[userId] = { ...this.getUser(userId), ...userData };
    this.saveData();
  }

  addMoney(userId, amount) {
    const user = this.getUser(userId);
    user.money += amount;
    this.updateUser(userId, user);
    return user.money;
  }

  removeMoney(userId, amount) {
    const user = this.getUser(userId);
    if (user.money >= amount) {
      user.money -= amount;
      this.updateUser(userId, user);
      return true;
    }
    return false;
  }

  addToBank(userId, amount) {
    const user = this.getUser(userId);
    if (user.money >= amount) {
      user.money -= amount;
      user.bank += amount;
      this.updateUser(userId, user);
      return true;
    }
    return false;
  }

  withdrawFromBank(userId, amount) {
    const user = this.getUser(userId);
    if (user.bank >= amount) {
      user.bank -= amount;
      user.money += amount;
      this.updateUser(userId, user);
      return true;
    }
    return false;
  }

  getLeaderboard(type = 'money', limit = 10) {
    const users = Object.entries(this.data)
      .map(([userId, userData]) => ({ userId, ...userData }))
      .sort((a, b) => {
        if (type === 'total') {
          return (b.money + b.bank) - (a.money + a.bank);
        }
        return b[type] - a[type];
      })
      .slice(0, limit);
    
    return users;
  }
}

module.exports = { EconomyDatabase: new EconomyDatabase() };