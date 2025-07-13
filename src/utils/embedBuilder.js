const { EmbedBuilder } = require('discord.js');

function createErrorEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setColor('#ff0000')
    .setTimestamp();
}

function createSuccessEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setColor('#00ff00')
    .setTimestamp();
}

function createWarningEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(`⚠️ ${title}`)
    .setDescription(description)
    .setColor('#ffaa00')
    .setTimestamp();
}

function createInfoEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(`ℹ️ ${title}`)
    .setDescription(description)
    .setColor('#0099ff')
    .setTimestamp();
}

module.exports = {
  createErrorEmbed,
  createSuccessEmbed,
  createWarningEmbed,
  createInfoEmbed
};