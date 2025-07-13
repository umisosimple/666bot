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

function parseChannelMention(mention) {
  const match = mention.match(/^<#(\d+)>$/);
  return match ? match[1] : null;
}

module.exports = { validateContent, parseChannelMention };