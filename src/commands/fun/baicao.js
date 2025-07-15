const { EmbedBuilder } = require('discord.js');
const EconomyDatabase = require('../../database/economy'); // Đã sửa

const deck = [
  '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'
];

function getCardValue(card) {
  if (card === 'A') return 1;
  if (['J', 'Q', 'K'].includes(card)) return 10;
  return parseInt(card);
}

function calculateScore(hand) {
  const totalScore = hand.reduce((total, card) => total + getCardValue(card), 0);
  return totalScore % 10;
}

module.exports = {
  data: {
    name: 'baicao',
    description: 'Chơi trò chơi Bài Cào',
    usage: 'baicao <cược> hoặc bc <cược>',
    aliases: ['bc'],
    cooldown: 5,
    category: 'fun'
  },
  execute: async (message, args) => {
    const bet = parseInt(args[0]);
    const user = EconomyDatabase.getUser (message.author.id);

    if (isNaN(bet) || bet <= 0) {
      return message.reply('Vui lòng nhập số tiền cược hợp lệ!');
    }

    if (user.money < bet) {
      return message.reply('Bạn không đủ tiền để đặt cược số tiền này!');
    }

    const playerHand = [
      deck[Math.floor(Math.random() * deck.length)],
      deck[Math.floor(Math.random() * deck.length)],
      deck[Math.floor(Math.random() * deck.length)]
    ];
    
    const dealerHand = [
      deck[Math.floor(Math.random() * deck.length)],
      deck[Math.floor(Math.random() * deck.length)],
      deck[Math.floor(Math.random() * deck.length)]
    ];

    const playerScore = calculateScore(playerHand);
    const dealerScore = calculateScore(dealerHand);

    const embed = new EmbedBuilder()
      .setTitle('🃏 Trò Chơi Bài Cào')
      .addFields(
        { name: 'Bài của bạn:', value: playerHand.join(', ') },
        { name: 'Điểm của bạn:', value: playerScore.toString() },
        { name: 'Bài của nhà cái:', value: dealerHand.join(', ') },
        { name: 'Điểm của nhà cái:', value: dealerScore.toString() }
      )
      .setColor(playerScore > dealerScore ? '#00ff00' : '#ff0000');

    if (playerHand.includes('J') && playerHand.includes('Q') && playerHand.includes('K')) {
      embed.addFields({ name: '🎉 Chúc mừng!', value: 'Bạn đã thắng với ba cào!' });
      user.money += bet * 2;
    } else if (dealerHand.includes('J') && dealerHand.includes('Q') && dealerHand.includes('K')) {
      embed.addFields({ name: '😢 Thất bại!', value: 'Nhà cái đã thắng với ba cào!' });
      user.money -= bet;
    } else if (playerScore > dealerScore) {
      embed.addFields({ name: '🎉 Chúc mừng!', value: 'Bạn đã thắng!' });
      user.money += bet;
    } else if (playerScore < dealerScore) {
      embed.addFields({ name: '😢 Thất bại!', value: 'Bạn đã thua!' });
      user.money -= bet;
    } else {
      embed.addFields({ name: '🤝 Hòa!', value: 'Cả hai đều có điểm số giống nhau!' });
    }

    EconomyDatabase.updateUser (message.author.id, user);
    await message.reply({ embeds: [embed] });
  }
};
