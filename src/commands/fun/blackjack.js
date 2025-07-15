const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const EconomyDatabase = require('../../database/economy');

const suits = ['♠️', '♥️', '♦️', '♣️'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Tạo bộ bài đầy đủ với format chuẩn
function createDeck() {
  return suits.flatMap(suit => ranks.map(rank => `${suit}${rank}`));
}

// Rút bài ngẫu nhiên từ bộ bài và loại bỏ khỏi bộ bài
function drawCard(deck) {
  const randomIndex = Math.floor(Math.random() * deck.length);
  return deck.splice(randomIndex, 1)[0];
}

function getCardValue(card) {
  const rank = card.slice(2); // Lấy phần hạng của lá bài (bỏ qua emoji suit)
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  if (rank === 'A') return 11; // A ban đầu = 11
  return parseInt(rank);
}

function calculateScore(hand) {
  let score = hand.reduce((total, card) => total + getCardValue(card), 0);
  let aces = hand.filter(card => card.endsWith('A')).length;

  // Chuyển A từ 11 thành 1 nếu tổng > 21
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }

  return score;
}

// Kiểm tra blackjack (21 điểm với 2 lá bài đầu)
function isBlackjack(hand) {
  return hand.length === 2 && calculateScore(hand) === 21;
}

module.exports = {
  data: {
    name: 'blackjack',
    description: 'Chơi trò chơi Black Jack',
    usage: 'blackjack <cược>',
    cooldown: 5,
    category: 'fun',
    aliases: ['bj']
  },
  execute: async (message, args) => {
    const bet = parseInt(args[0]);
    const user = await EconomyDatabase.getUser(message.author.id);

    if (isNaN(bet) || bet <= 0) {
      return message.reply('Vui lòng nhập số tiền cược hợp lệ!');
    }

    if (user.money < bet) {
      return message.reply('Bạn không đủ tiền để đặt cược số tiền này!');
    }

    // Khởi tạo bộ bài mới cho mỗi game
    const gameDeck = createDeck();
    
    // Chia bài ban đầu
    const playerHand = [drawCard(gameDeck), drawCard(gameDeck)];
    const dealerHand = [drawCard(gameDeck), drawCard(gameDeck)];

    let playerScore = calculateScore(playerHand);
    let dealerScore = calculateScore(dealerHand);

    // Kiểm tra blackjack ngay từ đầu
    const playerBlackjack = isBlackjack(playerHand);
    const dealerBlackjack = isBlackjack(dealerHand);

    let gameState = {
      deck: gameDeck,
      playerHand,
      dealerHand,
      playerScore,
      dealerScore,
      bet,
      cardsDrawn: 0, // Đếm số lá đã rút thêm
      maxDraws: 3    // Tối đa 3 lá
    };

    // Nếu có blackjack ngay từ đầu
    if (playerBlackjack || dealerBlackjack) {
      return handleGameEnd(message, gameState, user, true);
    }

    // Tạo embed ban đầu
    const embed = createGameEmbed(gameState, false);

    // Tạo buttons
    const hitButton = new ButtonBuilder()
      .setCustomId('hit')
      .setLabel('Rút')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(playerScore >= 21);

    const standButton = new ButtonBuilder()
      .setCustomId('stand')
      .setLabel('Giữ')
      .setStyle(ButtonStyle.Secondary);

    const buttonRow = new ActionRowBuilder().addComponents(hitButton, standButton);

    const messageReply = await message.reply({ embeds: [embed], components: [buttonRow] });

    const filter = i => {
      return (i.customId === 'hit' || i.customId === 'stand') && i.user.id === message.author.id;
    };

    const collector = messageReply.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (interaction) => {
      if (interaction.customId === 'hit') {
        // Kiểm tra giới hạn rút bài
        if (gameState.cardsDrawn >= gameState.maxDraws) {
          await interaction.reply({ content: '❌ Bạn đã rút tối đa 3 lá bài!', ephemeral: true });
          return;
        }

        // Rút bài
        gameState.playerHand.push(drawCard(gameState.deck));
        gameState.playerScore = calculateScore(gameState.playerHand);
        gameState.cardsDrawn++;

        const newEmbed = createGameEmbed(gameState, false);

        // Kiểm tra bust
        if (gameState.playerScore > 21) {
          await handlePlayerBust(interaction, gameState, user, newEmbed);
          collector.stop();
          return;
        }

        // Cập nhật buttons
        const newHitButton = new ButtonBuilder()
          .setCustomId('hit')
          .setLabel('Rút')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(gameState.cardsDrawn >= gameState.maxDraws || gameState.playerScore >= 21);

        const newStandButton = new ButtonBuilder()
          .setCustomId('stand')
          .setLabel('Giữ')
          .setStyle(ButtonStyle.Secondary);

        const newButtonRow = new ActionRowBuilder().addComponents(newHitButton, newStandButton);

        await interaction.update({ embeds: [newEmbed], components: [newButtonRow] });

      } else if (interaction.customId === 'stand') {
        await handleStand(interaction, gameState, user);
        collector.stop();
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        message.reply('⏰ Thời gian đã hết! Trò chơi kết thúc.');
      }
    });
  }
};

// Tạo embed hiển thị game
function createGameEmbed(gameState, showDealerCards = false) {
  const embed = new EmbedBuilder()
    .setTitle('🃏 Trò Chơi Black Jack')
    .addFields(
      { name: '🎯 Bài của bạn:', value: `${gameState.playerHand.join(' ')} (${gameState.playerScore} điểm)` },
      { name: '🏠 Bài của nhà cái:', value: showDealerCards ? 
        `${gameState.dealerHand.join(' ')} (${gameState.dealerScore} điểm)` : 
        `${gameState.dealerHand[0]} ?` },
      { name: '💰 Tiền cược:', value: `${gameState.bet.toLocaleString()} coins` },
      { name: '📊 Lá đã rút:', value: `${gameState.cardsDrawn}/${gameState.maxDraws}` }
    )
    .setColor('#00ff00');

  return embed;
}

// Xử lý khi người chơi bust
async function handlePlayerBust(interaction, gameState, user, embed) {
  embed.addFields({ name: '❌ Thua!', value: 'Bạn đã vượt quá 21 điểm!' });
  embed.setColor('#ff0000');
  
  user.money -= gameState.bet;
  EconomyDatabase.updateUser(interaction.user.id, user);
  
  await interaction.update({ embeds: [embed], components: [] });
}

// Xử lý khi người chơi chọn "Giữ"
async function handleStand(interaction, gameState, user) {
  // Nhà cái rút bài theo luật (< 17 phải rút)
  while (gameState.dealerScore < 17) {
    gameState.dealerHand.push(drawCard(gameState.deck));
    gameState.dealerScore = calculateScore(gameState.dealerHand);
  }

  const embed = createGameEmbed(gameState, true);
  
  // Xác định kết quả
  let resultField;
  if (gameState.dealerScore > 21) {
    resultField = { name: '🎉 Chúc mừng!', value: 'Nhà cái bị bust! Bạn thắng!' };
    user.money += gameState.bet;
    embed.setColor('#00ff00');
  } else if (gameState.playerScore > gameState.dealerScore) {
    resultField = { name: '🎉 Chúc mừng!', value: 'Bạn thắng!' };
    user.money += gameState.bet;
    embed.setColor('#00ff00');
  } else if (gameState.playerScore < gameState.dealerScore) {
    resultField = { name: '😢 Thất bại!', value: 'Nhà cái thắng!' };
    user.money -= gameState.bet;
    embed.setColor('#ff0000');
  } else {
    resultField = { name: '🤝 Hòa!', value: 'Cả hai đều có điểm số giống nhau!' };
    embed.setColor('#ffff00');
  }

  embed.addFields(resultField);
  EconomyDatabase.updateUser(interaction.user.id, user);
  
  await interaction.update({ embeds: [embed], components: [] });
}

// Xử lý kết thúc game (cho trường hợp blackjack)
async function handleGameEnd(message, gameState, user, isBlackjack = false) {
  const embed = createGameEmbed(gameState, true);
  
  const playerBlackjack = isBlackjack(gameState.playerHand);
  const dealerBlackjack = isBlackjack(gameState.dealerHand);
  
  let resultField;
  if (playerBlackjack && dealerBlackjack) {
    resultField = { name: '🤝 Hòa!', value: 'Cả hai đều có Blackjack!' };
    embed.setColor('#ffff00');
  } else if (playerBlackjack) {
    resultField = { name: '🎉 BLACKJACK!', value: 'Bạn thắng với Blackjack!' };
    user.money += Math.floor(gameState.bet * 1.5); // Blackjack thưởng 1.5x
    embed.setColor('#00ff00');
  } else if (dealerBlackjack) {
    resultField = { name: '😢 Thất bại!', value: 'Nhà cái có Blackjack!' };
    user.money -= gameState.bet;
    embed.setColor('#ff0000');
  }
  
  embed.addFields(resultField);
  EconomyDatabase.updateUser(message.author.id, user);
  
  return message.reply({ embeds: [embed] });
}
