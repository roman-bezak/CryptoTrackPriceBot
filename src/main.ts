import { Telegraf } from 'telegraf';

import { test } from './test.js';

// Mock config with fake token
const config = {
  BOT_TOKEN: 'mock_bot_token_1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef',
  NODE_ENV: 'development',
};

console.log(test.name, process.env.NODE_ENV);

const bot = new Telegraf(config.BOT_TOKEN);

bot.start(ctx => {
  ctx.reply('🤖 Bot started with mock token');
});

// Launch bot
bot
  .launch()
  .then(() => console.log('🚀 Bot launched with mock token'))
  .catch(() => {
    process.exit(1);
  });

// Graceful shutdown
const gracefulShutdown = (signal: any) => {
  bot.stop(signal);
  process.exit(0);
};

process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
