/**
 * Kiểm tra tính hợp lệ của nội dung.
 * @param {string} content - Nội dung cần kiểm tra.
 * @returns {Object} - Kết quả kiểm tra, bao gồm trạng thái hợp lệ và thông điệp.
 */
function validateContent(content) {
  if (!content || content.trim().length === 0) {
    return { valid: false, message: 'Nội dung không được để trống!' };
  }
  
  if (content.length > 2000) {
    return { valid: false, message: 'Nội dung quá dài! (Tối đa 2000 ký tự)' };
  }
  
  const forbiddenWords = ['@everyone', '@here'];
  if (forbiddenWords.some(word => content.toLowerCase().includes(word))) {
    return { valid: false, message: 'Không thể sử dụng mentions @everyone hoặc @here!' };
  }
  
  return { valid: true };
}

/**
 * Phân tích một mention kênh từ chuỗi.
 * @param {string} mention - Chuỗi mention kênh.
 * @returns {string|null} - ID của kênh nếu hợp lệ, ngược lại trả về null.
 */
function parseChannelMention(mention) {
  const match = mention.match(/^<#(\d+)>$/);
  return match ? match[1] : null;
}

module.exports = { validateContent, parseChannelMention };
