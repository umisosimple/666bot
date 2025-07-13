            module.exports = {
              data: {
                name: 'restart',
                description: 'Khởi động lại bot (Chỉ chủ sở hữu)',
                usage: 'restart',
                cooldown: 5,
                category: 'admin' // Hoặc 'general' nếu bạn muốn
              },
              execute: async (message, args) => {
                // Kiểm tra quyền owner
                // Sử dụng client.config.ownerIds (nếu bạn đã đổi thành mảng)
                if (!message.client.config.ownerIds.includes(message.author.id)) {
                  return message.reply({ 
                    content: '❌ Bạn không có quyền sử dụng lệnh này!', 
                    ephemeral: true 
                  });
                }

                await message.reply('🔄 Đang khởi động lại bot...');
                
                setTimeout(() => {
                  process.exit(0);
                }, 1000);
              },
            };
            