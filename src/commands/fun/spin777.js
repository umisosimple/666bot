const { EmbedBuilder } = require('discord.js');
const EconomyDatabase = require('../../database/economy'); // Đã sửa

const symbols = ['🍒', '🍋', '🍊', '🍉', '🍇', '⭐'];
const rewards = {
  win: 3,
  twoOfAKind: 1.5,
};

module.exports = {
  data: {
    name: 'spin777',
    description: 'Quay bánh xe Spin 777',
    usage: 'spin777 <cược> hoặc s <cược>',
    aliases: ['spin','s'],
    cooldown: 5,
    category: 'fun'
  },
  execute: async (message, args) => {
    const bet = parseInt(args[0]);
    const user = await EconomyDatabase.getUser(message.author.id);

    if (!user) {
      return message.reply('Không tìm thấy thông tin người dùng!');
    }

    if (isNaN(bet) || bet <= 0) {
      return message.reply('Vui lòng nhập số tiền cược hợp lệ!');
    }

    if (user.money < bet) {
      return message.reply('Bạn không đủ tiền để đặt cược số tiền này!');
    }

    const spinAnimation = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)]
    ];

    const spinEmbed = new EmbedBuilder()
      .setTitle('🎰 Spin 777')
      .setDescription(`Quay bánh xe... ${spinAnimation.join(' ')}`)
      .setColor('#FFFF00');

    const replyMessage = await message.reply({ embeds: [spinEmbed] });

    setTimeout(async () => {
      const spinResult = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ];

      const resultEmbed = new EmbedBuilder()
        .setTitle('🎰 Spin 777')
        .setDescription(`Kết quả: ${spinResult.join(' ')}`)
        .setColor(spinResult[0] === spinResult[1] && spinResult[1] === spinResult[2] ? '#00ff00' : '#ff0000');

      let winnings = 0;

      if (spinResult[0] === spinResult[1] && spinResult[1] === spinResult[2]) {
        resultEmbed.addFields({ name: '🎉 Chúc mừng!', value: `Bạn đã thắng ${bet * rewards.win} tiền!` });
        winnings = bet * rewards.win;
      } else if (spinResult[0] === spinResult[1] || spinResult[1] === spinResult[2] || spinResult[0] === spinResult[2]) {
        resultEmbed.addFields({ name: '🎊 Bạn có hai biểu tượng giống nhau!', value: `Bạn đã thắng ${bet * rewards.twoOfAKind} tiền!` });
        winnings = bet * rewards.twoOfAKind;
      } else {
        resultEmbed.addFields({ name: '😢 Thất bại!', value: 'Hãy thử lại!' });
        winnings = -bet;
      }

      user.money += winnings;
      await EconomyDatabase.updateUser(message.author.id, user);

      // Đảm bảo gửi tin nhắn không bị trống
      if (winnings !== 0) {
        await replyMessage.edit({ embeds: [resultEmbed] });
      } else {
        resultEmbed.addFields({ name: '❌ Không có kết quả', value: 'Có lỗi xảy ra khi tính toán kết quả. Vui lòng thử lại!' });
        await replyMessage.edit({ embeds: [resultEmbed] });
      }
    }, 3000);
  }
};
