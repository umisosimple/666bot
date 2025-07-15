const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { createInfoEmbed } = require('../../utils/embedBuilder');

module.exports = {
  data: {
    name: 'help',
    description: 'Hiển thị danh sách các lệnh có sẵn',
    usage: 'help [command]',
    cooldown: 5,
    category: 'general'
  },
  execute: async (message, args) => {
    const client = message.client;
    const AUTO_DELETE_TIME = 30000;
    const COLLECTOR_TIME = 30000;

    // Định nghĩa emoji cho từng danh mục
    const categoryEmojis = {
      'general': '🔧',
      'moderation': '🛡️',
      'fun': '🎉',
      'utility': '🔨',
      'music': '🎵',
      'admin': '👑',
      'economy': '💰',
      'chung': '📁'
    };

    // Bổ sung đầy đủ các lệnh moderation mới
    const customCommands = {
      give: {
        data: {
          name: 'give',
          description: 'Chuyển tiền cho người chơi khác',
          usage: 'give @user <số tiền>',
          cooldown: 5,
          category: 'economy',
          aliases: ['bnggive', 'transfer', 'send']
        }
      },
      blackjack: {
        data: {
          name: 'blackjack',
          description: 'Chơi trò chơi Black Jack',
          usage: 'blackjack <cược>',
          cooldown: 5,
          category: 'fun',
          aliases: ['bj']
        }
      },
      spin777: {
        data: {
          name: 'spin777',
          description: 'Quay bánh xe Spin 777',
          usage: 'spin777 <cược>',
          cooldown: 5,
          category: 'fun',
          aliases: ['spin', 's']
        }
      },
      baicao: {
        data: {
          name: 'baicao',
          description: 'Chơi trò chơi Bài Cào',
          usage: 'baicao <cược>',
          cooldown: 5,
          category: 'fun',
          aliases: ['bc']
        }
      },
      clear: {
        data: {
          name: 'clear',
          description: 'Xoá nhiều tin nhắn trong kênh.\n__Yêu cầu quyền:__ Quản lý tin nhắn (Manage Messages)',
          usage: 'clear <số lượng>',
          cooldown: 5,
          category: 'moderation',
          aliases: []
        }
      },
      dailytasks: {
        data: {
          name: 'dailytasks',
          description: 'Xem và kiểm tra trạng thái nhiệm vụ hàng ngày của bạn',
          usage: 'dailytasks',
          cooldown: 5,
          category: 'economy',
          aliases: ['dt', 'task']
        }
      },
      warn: {
        data: {
          name: 'warn',
          description: 'Cảnh báo thành viên. Đủ 3 cảnh báo sẽ tự động bị ban.\n- Có thể dùng @user hoặc ID\n__Yêu cầu quyền:__ Kick Members hoặc Ban Members',
          usage: 'warn <@user|ID> [lý do]',
          cooldown: 5,
          category: 'moderation',
          aliases: []
        }
      },
      unwarn: {
        data: {
          name: 'unwarn',
          description: 'Gỡ một cảnh báo bằng ID cảnh báo (xem ID bằng lệnh warnings).\n__Yêu cầu quyền:__ Kick Members hoặc Ban Members',
          usage: 'unwarn <@user|ID> <ID cảnh báo>',
          cooldown: 5,
          category: 'moderation',
          aliases: []
        }
      },
      warnings: {
        data: {
          name: 'warnings',
          description: 'Xem cảnh báo của một thành viên (warnings <@user|ID>) hoặc toàn server (warnings all, có nút chuyển trang).\n__Yêu cầu quyền:__ Kick Members hoặc Ban Members',
          usage: 'warnings <@user|ID> hoặc warnings all',
          cooldown: 3,
          category: 'moderation',
          aliases: []
        }
      },
      mute: {
        data: {
          name: 'mute',
          description: 'Bỏ mute thành viên bằng @user hoặc ID.\n__Yêu cầu quyền:__ Quản lý thành viên (Moderate Members) hoặc Quản lý vai trò (Manage Roles)',
           usage: 'unmute <@user|ID>',
          cooldown: 5,
          category: 'moderation',
          aliases: []
        }
      },
      unmute: {
        data: {
          name: 'unmute',
          description: 'Bỏ mute một thành viên',
          usage: 'unmute <@user>',
          cooldown: 5,
          category: 'moderation',
          aliases: []
        }
      },
      ban: {
        data: {
          name: 'ban',
          description: 'Ban thành viên khỏi server. Có thể dùng @user hoặc ID, thêm lý do nếu muốn.\n__Yêu cầu quyền:__ Ban Members',
          usage: 'ban <@user|ID> [lý do]',
          cooldown: 5,
          category: 'moderation',
          aliases: []
        }
      },
      unban: {
        data: {
          name: 'unban',
          description: 'Bỏ ban thành viên bằng ID user (không dùng @user).\n__Yêu cầu quyền:__ Ban Members',
          usage: 'unban <userId>',
          cooldown: 5,
          category: 'moderation',
          aliases: []
        }
      },
      kick: {
        data: {
          name: 'kick',
          description: 'Kick thành viên khỏi server, thêm lý do nếu muốn. Dùng @user hoặc ID.\n__Yêu cầu quyền:__ Kick Members',
          usage: 'kick <@user|ID> [lý do]',
          cooldown: 5,
          category: 'moderation',
          aliases: []
        }
      }
    };

    // Utility functions
    const safeDbOperation = async (operation, fallback = null) => {
      try {
        return await operation();
      } catch (error) {
        console.error('Database operation error:', error);
        return fallback;
      }
    };

    // Hàm helper để lấy thành tựu của user
    const getUserAchievements = async (userId) => {
      return safeDbOperation(
        () => client.economyDB?.getUser?.(userId)?.achievements || [],
        []
      );
    };

    // Hàm helper để lấy nhiệm vụ của user
    const getUserTasks = async (userId) => {
      return safeDbOperation(
        () => client.economyDB?.getUser?.(userId)?.tasks || null,
        null
      );
    };

    // Hàm helper để lấy thông tin level của user
    const getUserLevel = async (userId) => {
      return safeDbOperation(
        () => client.economyDB?.getUserLevel?.(userId) || null,
        null
      );
    };

    // Hàm helper để tạo command embed
    const createCommandEmbed = (command) => {
      const embed = new EmbedBuilder()
        .setTitle(`📋 Chi tiết lệnh: ${command.data.name}`)
        .setDescription(command.data.description || 'Không có mô tả')
        .addFields(
          { name: '🔧 Cách sử dụng:', value: `\`bng ${command.data.usage || command.data.name}\``, inline: false },
          { name: '⏱️ Cooldown:', value: `${command.data.cooldown || 3} giây`, inline: true },
          { name: '📂 Danh mục:', value: command.data.category || 'Chung', inline: true }
        )
        .setColor('#0099ff')
        .setTimestamp()
        .setFooter({ 
          text: `Được yêu cầu bởi ${message.author.tag}`, 
          iconURL: message.author.displayAvatarURL({ dynamic: true })
        });
      
      // Thêm aliases nếu có
      if (command.data.aliases && command.data.aliases.length > 0) {
        embed.addFields({
          name: '🔗 Aliases:',
          value: command.data.aliases.map(alias => `\`${alias}\``).join(', '),
          inline: false
        });
      }
      
      return embed;
    };

    // Xử lý tham số lệnh cụ thể
    if (args.length > 0) {
      const commandName = args[0].toLowerCase();
      let command = client.commands?.get(commandName) || 
                    client.commands?.find(cmd => cmd.data.aliases && cmd.data.aliases.includes(commandName)) ||
                    customCommands[commandName];
      if (!command) {
        const embed = createInfoEmbed(
          'Lệnh không tồn tại',
          `Không tìm thấy lệnh \`${commandName}\`.\nSử dụng \`bng help\` để xem tất cả lệnh.`
        );
        try {
          const errorMessage = await message.reply({ embeds: [embed] });
          setTimeout(() => errorMessage.delete().catch(() => {}), 10000);
        } catch (error) {
          console.error('Error sending error message:', error);
        }
        return;
      }
      try {
        const commandDetailMessage = await message.reply({ embeds: [createCommandEmbed(command)] });
        setTimeout(() => commandDetailMessage.delete().catch(() => {}), 30000);
      } catch (error) {
        console.error('Error sending command detail message:', error);
      }
      return;
    }
    
    // Tổ chức lệnh theo danh mục
    const categories = {};
    const addedCommands = new Set();
    const excludeCommands = ['dailytasks'];
    if (client.commands) {
      client.commands.forEach(command => {
        const commandName = command.data.name.toLowerCase();
        if (!excludeCommands.includes(command.data.name) && !addedCommands.has(commandName)) {
          const category = command.data.category || 'chung';
          if (!categories[category]) {
            categories[category] = [];
          }
          categories[category].push(command);
          addedCommands.add(commandName);
        }
      });
    }
    Object.values(customCommands).forEach(cmd => {
      const commandName = cmd.data.name.toLowerCase();
      if (!addedCommands.has(commandName)) {
        const category = cmd.data.category || 'chung';
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(cmd);
        addedCommands.add(commandName);
      }
    });

    const totalCommands = Array.from(addedCommands).length;
    const mainEmbed = new EmbedBuilder()
      .setTitle('📚 Danh sách lệnh')
      .setDescription(`Sử dụng \`bng help <tên lệnh>\` để xem chi tiết.\n⚠️ Tự động xóa sau 30 giây`)
      .setColor('#0099ff')
      .setTimestamp()
      .setFooter({ 
        text: `${totalCommands} lệnh • Prefix: bng`, 
        iconURL: client.user?.displayAvatarURL({ dynamic: true }) || undefined
      });

    const categoryList = Object.keys(categories).sort().map(category => {
      const emoji = categoryEmojis[category.toLowerCase()] || '📁';
      const commands = categories[category];
      return `${emoji} **${category.charAt(0).toUpperCase() + category.slice(1)}** (${commands.length})`;
    }).join('\n');
    mainEmbed.addFields({
      name: '📋 Danh mục có sẵn:',
      value: categoryList || 'Không có danh mục nào',
      inline: false
    });
    mainEmbed.addFields({
      name: '💡 Hướng dẫn:',
      value: 'Sử dụng menu bên dưới để xem lệnh trong từng danh mục',
      inline: false
    });

    const selectOptions = [
      {
        label: 'Tổng quan',
        description: 'Xem tất cả lệnh',
        value: 'overview',
        emoji: '📚'
      },
      ...Object.keys(categories).sort().map(category => ({
        label: category.charAt(0).toUpperCase() + category.slice(1),
        description: `Xem lệnh trong danh mục ${category}`,
        value: category.toLowerCase(),
        emoji: categoryEmojis[category.toLowerCase()] || '📁'
      }))
    ];

    if (client.economyDB && typeof client.economyDB.getUser === 'function') {
      selectOptions.push(
        {
          label: 'Thành tựu',
          description: 'Xem các thành tựu của bạn',
          value: 'achievements',
          emoji: '🏆'
        },
        {
          label: 'Nhiệm vụ hàng ngày',
          description: 'Xem các nhiệm vụ hàng ngày của bạn',
          value: 'dailytasks',
          emoji: '📅'
        },
        {
          label: 'Cấp độ',
          description: 'Xem cấp độ và kinh nghiệm của bạn',
          value: 'level',
          emoji: '🎖️'
        }
      );
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('help_category_select')
      .setPlaceholder('Chọn danh mục để xem chi tiết...')
      .addOptions(selectOptions);
    const selectRow = new ActionRowBuilder().addComponents(selectMenu);

    let helpMessage;
    try {
      helpMessage = await message.reply({ 
        embeds: [mainEmbed], 
        components: [selectRow] 
      });
    } catch (error) {
      console.error('Error sending help message:', error);
      try {
        return await message.reply({ embeds: [mainEmbed] });
      } catch (fallbackError) {
        console.error('Error sending fallback message:', fallbackError);
        return;
      }
    }
    let messageDeleted = false;
    let autoDeleteTimeout;
    const collector = helpMessage.createMessageComponentCollector({ 
      filter: i => i.user.id === message.author.id,
      time: COLLECTOR_TIME
    });
    collector.on('collect', async interaction => {
      try {
        if (autoDeleteTimeout) clearTimeout(autoDeleteTimeout);
        await handleInteraction(interaction, {
          mainEmbed,
          categories,
          categoryEmojis,
          client,
          totalCommands,
          getUserAchievements,
          getUserTasks,
          getUserLevel,
          helpMessage
        });
        if (!messageDeleted) {
          autoDeleteTimeout = setTimeout(() => {
            if (!messageDeleted) {
              messageDeleted = true;
              helpMessage.delete().catch(() => {});
            }
          }, AUTO_DELETE_TIME);
        }
      } catch (error) {
        console.error('Error handling interaction:', error);
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ 
              content: '❌ Đã xảy ra lỗi khi xử lý yêu cầu!', 
              ephemeral: true 
            });
          }
        } catch (replyError) {
          console.error('Error sending error reply:', replyError);
        }
      }
    });
    collector.on('end', () => {
      if (autoDeleteTimeout) clearTimeout(autoDeleteTimeout);
      if (!messageDeleted) {
        try {
          const disabledSelectRow = new ActionRowBuilder().addComponents(
            selectMenu.setDisabled(true)
          );
          helpMessage.edit({ 
            components: [disabledSelectRow] 
          }).catch(() => {});
          setTimeout(() => {
            if (!messageDeleted) {
              messageDeleted = true;
              helpMessage.delete().catch(() => {});
            }
          }, 5000);
        } catch (error) {
          console.error('Error disabling components:', error);
        }
      }
    });
    autoDeleteTimeout = setTimeout(() => {
      if (!messageDeleted) {
        messageDeleted = true;
        collector.stop('auto_delete');
        helpMessage.delete().catch(() => {});
      }
    }, AUTO_DELETE_TIME);
  }
};

async function handleInteraction(interaction, context) {
  const { 
    mainEmbed, 
    categories, 
    categoryEmojis, 
    client, 
    totalCommands,
    getUserAchievements,
    getUserTasks,
    getUserLevel,
    helpMessage 
  } = context;

  if (interaction.customId === 'help_category_select') {
    const selectedCategory = interaction.values[0];
    if (selectedCategory === 'overview') {
      await interaction.update({ embeds: [mainEmbed] });
      return;
    }
    if (selectedCategory === 'achievements') {
      const embed = await createAchievementsEmbed(interaction.user, getUserAchievements);
      await interaction.update({ embeds: [embed] });
      return;
    }
    if (selectedCategory === 'dailytasks') {
      const embed = await createDailyTasksEmbed(interaction.user, getUserTasks);
      await interaction.update({ embeds: [embed] });
      return;
    }
    if (selectedCategory === 'level') {
      const embed = await createLevelEmbed(interaction.user, getUserLevel);
      await interaction.update({ embeds: [embed] });
      return;
    }
    const categoryCommands = categories[selectedCategory];
    if (!categoryCommands || categoryCommands.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('📂 Danh mục trống')
        .setDescription('Không có lệnh nào trong danh mục này.')
        .setColor('#ff9900');
      await interaction.update({ embeds: [embed] });
      return;
    }
    const emoji = categoryEmojis[selectedCategory] || '📁';
    const embed = new EmbedBuilder()
      .setTitle(`${emoji} Danh mục: ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`)
      .setDescription(`Danh sách lệnh trong danh mục **${selectedCategory}**`)
      .setColor('#0099ff')
      .setTimestamp()
      .setFooter({ 
        text: `${categoryCommands.length} lệnh • Prefix: bng`, 
        iconURL: client.user?.displayAvatarURL({ dynamic: true }) || undefined
      });
    const commandList = categoryCommands.map(cmd => {
      const aliases = cmd.data.aliases && cmd.data.aliases.length > 0 
        ? ` (${cmd.data.aliases.join(', ')})` 
        : '';
      return `**${cmd.data.name}**${aliases}\n\`${cmd.data.description || 'Không có mô tả'}\``;
    }).join('\n\n');
    const maxFieldLength = 1024;
    if (commandList.length <= maxFieldLength) {
      embed.addFields({
        name: '📋 Danh sách lệnh:',
        value: commandList,
        inline: false
      });
    } else {
      const commands = categoryCommands;
      const fieldsNeeded = Math.ceil(commands.length / 5);
      for (let i = 0; i < fieldsNeeded; i++) {
        const start = i * 5;
        const end = Math.min(start + 5, commands.length);
        const fieldCommands = commands.slice(start, end);
        const fieldValue = fieldCommands.map(cmd => {
          const aliases = cmd.data.aliases && cmd.data.aliases.length > 0 
            ? ` (${cmd.data.aliases.join(', ')})` 
            : '';
          return `**${cmd.data.name}**${aliases}\n\`${cmd.data.description || 'Không có mô tả'}\``;
        }).join('\n\n');
                embed.addFields({
          name: i === 0 ? '📋 Danh sách lệnh:' : '\u200B',
          value: fieldValue,
          inline: false
        });
      }
    }
    await interaction.update({ embeds: [embed] });
  }
}

// Các hàm tạo embed cho achievements, dailytasks, level (nếu bạn đã có, giữ nguyên)
async function createAchievementsEmbed(user, getUserAchievements) {
  const achievements = await getUserAchievements(user.id);
  const embed = new EmbedBuilder()
    .setTitle('🏆 Thành tựu của bạn')
    .setColor('#ffd700')
    .setTimestamp()
    .setFooter({ 
      text: `Được yêu cầu bởi ${user.tag}`, 
      iconURL: user.displayAvatarURL({ dynamic: true })
    });
  if (!achievements || achievements.length === 0) {
    embed.setDescription('Bạn chưa có thành tựu nào. Hãy tham gia các hoạt động để mở khóa thành tựu!');
  } else {
    const achievementList = achievements.map(achievement => 
      `🏅 **${achievement.name}**\n\`${achievement.description || ''}\`${achievement.dateEarned ? `\n*Đạt được: ${achievement.dateEarned}*` : ''}`
    ).join('\n\n');
    embed.setDescription(achievementList);
  }
  return embed;
}

async function createDailyTasksEmbed(user, getUserTasks) {
  const tasks = await getUserTasks(user.id);
  const embed = new EmbedBuilder()
    .setTitle('📅 Nhiệm vụ hàng ngày')
    .setColor('#00aa00')
    .setTimestamp()
    .setFooter({ 
      text: `Được yêu cầu bởi ${user.tag}`, 
      iconURL: user.displayAvatarURL({ dynamic: true })
    });
  if (!tasks) {
    embed.setDescription('Không thể tải thông tin nhiệm vụ. Vui lòng thử lại sau!');
  } else {
    const taskList = Object.entries(tasks).map(([taskName, taskData]) => {
      const status = taskData.completed ? '✅' : '❌';
      const progress = taskData.progress || 0;
      const target = taskData.target || 1;
      return `${status} **${taskName}**\n\`Tiến độ: ${progress}/${target}\``;
    }).join('\n\n');
    embed.setDescription(taskList || 'Không có nhiệm vụ nào hôm nay.');
  }
  return embed;
}

async function createLevelEmbed(user, getUserLevel) {
  const levelData = await getUserLevel(user.id);
  const embed = new EmbedBuilder()
    .setTitle('🎖️ Cấp độ của bạn')
    .setColor('#9932cc')
    .setTimestamp()
    .setFooter({ 
      text: `Được yêu cầu bởi ${user.tag}`, 
      iconURL: user.displayAvatarURL({ dynamic: true })
    });
  if (!levelData) {
    embed.setDescription('Không thể tải thông tin cấp độ. Vui lòng thử lại sau!');
  } else {
    const currentXP = levelData.xp || 0;
    const currentLevel = levelData.level || 1;
    const xpToNext = levelData.xpToNext || 100;
    const totalXP = levelData.totalXP || currentXP;
    embed.addFields(
      { name: '🎯 Cấp độ hiện tại:', value: `${currentLevel}`, inline: true },
      { name: '⚡ Kinh nghiệm:', value: `${currentXP}/${xpToNext}`, inline: true },
      { name: '📊 Tổng kinh nghiệm:', value: `${totalXP}`, inline: true }
    );
    const progressBar = createProgressBar(currentXP, xpToNext);
    embed.addFields({
      name: '📈 Tiến độ đến level tiếp theo:',
      value: progressBar,
      inline: false
    });
  }
  return embed;
}

function createProgressBar(current, max, length = 20) {
  const percentage = Math.min(current / max, 1);
  const filled = Math.round(percentage * length);
  const empty = length - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const percent = Math.round(percentage * 100);
  return `\`${bar}\` ${percent}%`;
}
