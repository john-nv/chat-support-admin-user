const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const bot = new TelegramBot(process.env.TOKEN_BOT_TELE, { polling: true });
const groupId = process.env.ROOM_BOT_TELE;

module.exports = {
    sendMessage: (message) => {
        console.log(message)
        console.log(bot)
        console.log(groupId)
        bot.sendMessage(groupId, message, { parse_mode: 'Markdown' })
            .then(msg => {
                console.log(`send message telegram`);
            })
            .catch(error => {
                console.error(`Error sending message: ${error.message}`);
            });
    }
}