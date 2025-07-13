function checkCooldown(client, userId, commandName) {
  if (!client.cooldowns.has(commandName)) {
    client.cooldowns.set(commandName, new Map());
  }
  
  const now = Date.now();
  const timestamps = client.cooldowns.get(commandName);
  const command = client.commands.get(commandName);
  const cooldownAmount = (command?.data?.cooldown || 3) * 1000;
  
  if (timestamps.has(userId)) {
    const expirationTime = timestamps.get(userId) + cooldownAmount;
    
    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return timeLeft;
    }
  }
  
  timestamps.set(userId, now);
  setTimeout(() => timestamps.delete(userId), cooldownAmount);
  return false;
}

module.exports = { checkCooldown };