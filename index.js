require('dotenv').config();
const { Client } = require('./src/bot.js');

const client = new Client();
client.start();