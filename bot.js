require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { OpenAI } = require("openai");

/**
 * Create a TelegramBot that uses 'polling' to fetch new updates
 */
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/echo (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const resp = match[1];
    bot.sendMessage(chatId, resp);
});

/**
 * Create an OpenAI client
 */
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Store chat history for each user
 */
const userHistory = {};

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;
    console.log('userMessage ==> ', userMessage);

    if (!userHistory[chatId]) {
        userHistory[chatId] = [];
    }
    userHistory[chatId].push({ role: 'user', content: userMessage });

    try {
        const response = await client.chat.completions.create({
            messages: userHistory[chatId],
            model: 'gpt-4o',
        });
        const botReply = response.choices[0].message.content;
        console.log('<=== gptResponse', botReply);
        userHistory[chatId].push({ role: 'assistant', content: botReply });
        bot.sendMessage(chatId, botReply);
    } catch (error) {
        console.error("Error accessing OpenAI:", error.message);
        bot.sendMessage(chatId, "An error occurred. Please try again later.");
    }
});