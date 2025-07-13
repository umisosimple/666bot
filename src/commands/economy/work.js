const { EmbedBuilder } = require('discord.js');
const { EconomyDatabase } = require('../../database/economy');

module.exports = {
  data: {
    name: 'work',
    description: 'Đi làm việc để kiếm tiền',
    usage: 'work',
    cooldown: 5,
    category: 'economy'
  },
  execute: async (message, args) => {
    const user = EconomyDatabase.getUser(message.author.id);
    const now = Date.now();
    const cooldown = 60 * 1000; // 1 phút
    
    if (now - (user.lastWork || 0) < cooldown) {
      const timeLeft = Math.ceil((cooldown - (now - (user.lastWork || 0))) / 1000);
      const embed = new EmbedBuilder()
        .setTitle('💼 Đi làm')
        .setDescription(`Bạn đang mệt! Hãy nghỉ ngơi thêm **${timeLeft}** giây nữa.`)
        .setColor(message.client.config.embedColors.error);
      
      return message.reply({ embeds: [embed] });
    }
    
    // Danh sách công việc
    const jobs = [
      { name: '🧹 Quét dọn', reward: 80, description: 'Bạn đã quét dọn cửa hàng' },
      { name: '🚗 Lái xe', reward: 120, description: 'Bạn đã lái xe taxi' },
      { name: '🍕 Giao hàng', reward: 100, description: 'Bạn đã giao pizza' },
      { name: '💻 Lập trình', reward: 200, description: 'Bạn đã viết code' },
      { name: '🎨 Thiết kế', reward: 150, description: 'Bạn đã thiết kế poster' },
      { name: '📚 Dạy học', reward: 180, description: 'Bạn đã dạy học sinh' },
      { name: '🏥 Y tá', reward: 220, description: 'Bạn đã chăm sóc bệnh nhân' },
      { name: '🎵 Biểu diễn', reward: 160, description: 'Bạn đã biểu diễn âm nhạc' },
      { name: '🔧 Sửa chữa', reward: 140, description: 'Bạn đã sửa máy móc' },
      { name: '🎭 Diễn xuất', reward: 300, description: 'Bạn đã diễn trong phim' }
    ];
    
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const baseReward = job.reward;
    const levelBonus = Math.floor(baseReward * (user.level * 0.15));
    const totalReward = baseReward + levelBonus;
    
    // Cập nhật dữ liệu
    user.lastWork = now;
    user.money += totalReward;
    user.exp += 10;
    
    // Level up
    const expNeeded = user.level * 100;
    if (user.exp >= expNeeded) {
      user.level++;
      user.exp -= expNeeded;
    }
    
    EconomyDatabase.updateUser(message.author.id, user);
    
    const workEmbed = new EmbedBuilder()
      .setTitle('💼 Đi làm thành công!')
      .setDescription(`${job.description} và kiếm được tiền!`)
      .addFields(
        { name: '💰 Lương cơ bản', value: `${baseReward.toLocaleString()} 🪙`, inline: true },
        { name: '📊 Level bonus', value: `${levelBonus.toLocaleString()} 🪙`, inline: true },
        { name: '💵 Tổng thu nhập', value: `${totalReward.toLocaleString()} 🪙`, inline: true },
        { name: '📈 EXP nhận được', value: `+10 EXP`, inline: true },
        { name: '💰 Số dư mới', value: `${user.money.toLocaleString()} 🪙`, inline: true },
        { name: '📊 Level', value: `${user.level}`, inline: true }
      )
      .setColor(message.client.config.embedColors.success)
      .setTimestamp()
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
    
    await message.reply({ embeds: [workEmbed] });
  }
};
