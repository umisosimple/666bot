// src/utils/embedBuilder.js

const { EmbedBuilder } = require("discord.js");

const EMBED_COLORS = {
  error: "#FF89A0",     // Đỏ hồng pastel dịu
  success: "#43EA97",   // Xanh ngọc bích Discord
  warning: "#FFD580",   // Vàng cam pastel nhẹ
  info: "#5865F2",      // Xanh Discord
  custom: "#00BFFF"     // Cyan hiện đại
};

// Success
function createSuccessEmbed(title, description, options = {}) {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.success)
    .setTitle(title || "Thành công!")
    .setDescription(description || "Thao tác thành công!");

  if (options.icon) embed.setAuthor({ name: options.icon });
  if (options.footer) embed.setFooter({ text: options.footer });

  return embed;
}

// Error
function createErrorEmbed(title, description, options = {}) {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.error)
    .setTitle(title || "Lỗi!")
    .setDescription(description || "Đã xảy ra lỗi!");

  if (options.icon) embed.setAuthor({ name: options.icon });
  if (options.footer) embed.setFooter({ text: options.footer });

  return embed;
}

// Warning
function createWarningEmbed(title, description, options = {}) {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.warning)
    .setTitle(title || "Cảnh báo!")
    .setDescription(description || "Đây là cảnh báo!");

  if (options.icon) embed.setAuthor({ name: options.icon });
  if (options.footer) embed.setFooter({ text: options.footer });

  return embed;
}

// Info
function createInfoEmbed(title, description, options = {}) {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.info)
    .setTitle(title || "Thông tin")
    .setDescription(description || "Đây là thông tin!");

  if (options.icon) embed.setAuthor({ name: options.icon });
  if (options.footer) embed.setFooter({ text: options.footer });

  return embed;
}

// Custom
function createCustomEmbed({ title, description, color, icon, footer }) {
  const embed = new EmbedBuilder()
    .setColor(color || EMBED_COLORS.custom)
    .setTitle(title || "")
    .setDescription(description || "");
  if (icon) embed.setAuthor({ name: icon });
  if (footer) embed.setFooter({ text: footer });
  return embed;
}

module.exports = {
  createSuccessEmbed,
  createErrorEmbed,
  createWarningEmbed,
  createInfoEmbed,
  createCustomEmbed,
  EMBED_COLORS
};
