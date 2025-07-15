const { EmbedBuilder } = require('discord.js');
const EconomyDatabase = require('../../database/economy'); // Đã sửa cách require

module.exports = {
  data: {
    name: 'give',
    description: 'Chuyển tiền cho người chơi khác',
    usage: 'give @user <số tiền>',
    aliases: ['transfer', 'send'],
    cooldown: 5,
    category: 'economy'
  },
  execute: async (message, args) => {
    const colors = {
      success: message.client.config?.embedColors?.success || '#43EA97',
      error: message.client.config?.embedColors?.error || '#FF89A0',
      warning: message.client.config?.embedColors?.warning || '#FFD580',
      info: message.client.config?.embedColors?.info || '#0099ff'
    };
    
    const prefix = message.client.config?.prefix || '!';
    
    if (args.length < 2) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Thiếu thông tin')
        .setDescription('Vui lòng cung cấp đầy đủ thông tin!')
        .addFields(
          { name: 'Cách sử dụng:', value: `\`${prefix}give @user <số tiền>\`` },
          { name: 'Ví dụ:', value: `\`${prefix}give @John 1000\`` }
        )
        .setColor(colors.error);
      
      return message.reply({ embeds: [embed] });
    }

    const target = message.mentions.users.first();
    if (!target) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Không tìm thấy người nhận')
        .setDescription('Vui lòng mention người nhận (@user)!')
        .addFields({
          name: 'Ví dụ:',
          value: `\`${prefix}give @John 1000\``
        })
        .setColor(colors.error);
      
      return message.reply({ embeds: [embed] });
    }

    if (target.id === message.author.id) {
      const embed = new EmbedBuilder()
        .setTitle('🤔 Không thể tự chuyển')
        .setDescription('Bạn không thể chuyển tiền cho chính mình!')
        .addFields({
          name: '💡 Gợi ý:',
          value: 'Hãy chuyển tiền cho người khác để giúp đỡ họ!'
        })
        .setColor(colors.warning);
      
      return message.reply({ embeds: [embed] });
    }

    if (target.bot) {
      const embed = new EmbedBuilder()
        .setTitle('🤖 Không thể chuyển cho bot')
        .setDescription('Bạn không thể chuyển tiền cho bot!')
        .setColor(colors.error);
      
      return message.reply({ embeds: [embed] });
    }

    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount <= 0) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Số tiền không hợp lệ')
        .setDescription('Số tiền phải là số nguyên dương!')
        .addFields({
          name: 'Ví dụ hợp lệ:',
          value: `\`${prefix}give @John 100\`\n\`${prefix}give @John 1000\``
        })
        .setColor(colors.error);
      
      return message.reply({ embeds: [embed] });
    }

    const minTransfer = 10;
    const maxTransfer = 50000;
    
    if (amount < minTransfer) {
      const embed = new EmbedBuilder()
        .setTitle('📉 Số tiền quá nhỏ')
        .setDescription(`Số tiền chuyển tối thiểu là **${minTransfer.toLocaleString()} 🪙**`)
        .setColor(colors.error);
      
      return message.reply({ embeds: [embed] });
    }
    
    if (amount > maxTransfer) {
      const embed = new EmbedBuilder()
        .setTitle('📈 Số tiền quá lớn')
        .setDescription(`Số tiền chuyển tối đa là **${maxTransfer.toLocaleString()} 🪙**`)
        .addFields({
          name: '🛡️ Lý do:',
          value: 'Để tránh gian lận và bảo vệ hệ thống kinh tế'
        })
        .setColor(colors.error);
      
      return message.reply({ embeds: [embed] });
    }

    const sender = EconomyDatabase.getUser(message.author.id);
    const receiver = EconomyDatabase.getUser(target.id);

    if (sender.money < amount) {
      const embed = new EmbedBuilder()
        .setTitle('💸 Không đủ tiền')
        .setDescription(`Bạn chỉ có **${sender.money.toLocaleString()} 🪙** trong ví!`)
        .addFields(
          { name: 'Số tiền muốn chuyển:', value: `${amount.toLocaleString()} 🪙`, inline: true },
          { name: 'Số tiền thiếu:', value: `${(amount - sender.money).toLocaleString()} 🪙`, inline: true },
          { name: '💡 Kiếm tiền:', value: `\`${prefix}work\` • \`${prefix}daily\` • \`${prefix}hunt\``, inline: false }
        )
        .setColor(colors.error);
      
      return message.reply({ embeds: [embed] });
    }

    const fee = Math.floor(amount * 0.02);
    const actualAmount = amount - fee;

    try {
      // Sử dụng phương thức transferMoney của EconomyDatabase
      const transferSuccess = EconomyDatabase.transferMoney(message.author.id, target.id, amount);

      if (!transferSuccess) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Lỗi giao dịch')
          .setDescription('Có lỗi xảy ra khi thực hiện giao dịch. Vui lòng thử lại!')
          .setColor(colors.error);
        return await message.reply({ embeds: [errorEmbed] });
      }
      
      // Cập nhật EXP cho người gửi
      const levelUpResult = EconomyDatabase.addExp(message.author.id, 2);
      
      const updatedSender = EconomyDatabase.getUser(message.author.id); // Lấy lại thông tin người gửi sau khi cập nhật

      const successEmbed = new EmbedBuilder()
        .setTitle('💸 Chuyển tiền thành công!')
        .setDescription(`Bạn đã chuyển tiền cho **${target.displayName || target.username}**!`)
        .addFields(
          { name: '💰 Số tiền gửi', value: `${amount.toLocaleString()} 🪙`, inline: true },
          { name: '💳 Phí giao dịch (2%)', value: `${fee.toLocaleString()} 🪙`, inline: true },
          { name: '💵 Người nhận được', value: `${actualAmount.toLocaleString()} 🪙`, inline: true },
          { name: '👤 Người gửi', value: `${message.author.displayName || message.author.username}`, inline: true },
          { name: '👤 Người nhận', value: `${target.displayName || target.username}`, inline: true },
          { name: '💰 Số dư còn lại', value: `${updatedSender.money.toLocaleString()} 🪙`, inline: true },
          { name: '⭐ EXP nhận được', value: '+2 EXP', inline: true }
        )
        .setColor(colors.success)
        .setTimestamp()
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .setFooter({ 
          text: `Giao dịch ID: ${Date.now()}`,
          iconURL: message.author.displayAvatarURL({ dynamic: true })
        });

      await message.reply({ embeds: [successEmbed] });

      // Gửi thông báo level up nếu có
      if (levelUpResult) {
        setTimeout(() => {
          message.channel.send({ content: levelUpResult.message });
        }, 1000);
      }

      try {
        const notificationEmbed = new EmbedBuilder()
          .setTitle('💰 Bạn nhận được tiền!')
          .setDescription(`**${message.author.displayName || message.author.username}** đã chuyển cho bạn **${actualAmount.toLocaleString()} 🪙**!`)
          .addFields(
            { name: '💵 Số tiền nhận được', value: `${actualAmount.toLocaleString()} 🪙`, inline: true },
            { name: '📍 Từ server', value: message.guild.name, inline: true }
          )
          .setColor(colors.success)
          .setTimestamp()
          .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

        await target.send({ embeds: [notificationEmbed] });
      } catch (error) {
        console.log(`Could not send DM to ${target.tag}`);
      }

    } catch (error) {
      console.error('Error in give command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Lỗi giao dịch')
        .setDescription('Có lỗi xảy ra khi thực hiện giao dịch. Vui lòng thử lại!')
        .setColor(colors.error);
      
      await message.reply({ embeds: [errorEmbed] });
    }
  }
};
