require('dotenv').config();
const { REST, Routes } = require('discord.js');

// Thông tin bot từ file .env
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // Bạn cần thêm CLIENT_ID vào file .env
const GUILD_ID = process.env.GUILD_ID; // Thêm GUILD_ID vào .env nếu có guild commands

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function deleteAllSlashCommands() {
    try {
        console.log('🔄 Bắt đầu xóa tất cả slash commands...');
        
        // Xóa tất cả Global Commands
        console.log('📡 Đang xóa global commands...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
        console.log('✅ Đã xóa tất cả global commands!');
        
        // Xóa tất cả Guild Commands (nếu có GUILD_ID)
        if (GUILD_ID) {
            console.log('🏠 Đang xóa guild commands...');
            await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
            console.log('✅ Đã xóa tất cả guild commands!');
        }
        
        console.log('🎉 Hoàn thành! Tất cả slash commands đã được xóa.');
        console.log('⏳ Lưu ý: Global commands có thể mất đến 1 giờ để cập nhật trên Discord.');
        
    } catch (error) {
        console.error('❌ Lỗi khi xóa commands:', error);
        
        if (error.code === 50001) {
            console.log('💡 Lỗi: Bot không có quyền truy cập. Kiểm tra CLIENT_ID và TOKEN.');
        } else if (error.code === 0) {
            console.log('💡 Lỗi: Kiểm tra kết nối internet và thông tin bot.');
        }
    }
}

// Chạy hàm xóa
deleteAllSlashCommands();