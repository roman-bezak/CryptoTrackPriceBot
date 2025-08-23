import { Telegraf } from 'telegraf';

import { test } from './test.js';

<<<<<<< Updated upstream
// Mock config with fake token
const config = {
  BOT_TOKEN: 'mock_bot_token_1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef',
  NODE_ENV: 'development',
};

console.log(test, process.env.NODE_ENV);

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
=======
// === Initial logs ===
console.log(`🌍 NODE_ENV: ${configService.get('nodeEnv')}`);
console.log('🚀 Starting CryptoTrackPriceBot...');

// === Init bot ===
const bot = new Telegraf(configService.get('botToken'));

// === Commands ===
bot.start(ctx => ctx.reply('🤖 Welcome to CryptoTrackPriceBot!'));
bot.help(ctx => ctx.reply('📚 Available commands:\n/start - Start the bot\n/help - Show this help'));

// === Runtime error handler ===
bot.catch((err, ctx) => {
  console.error(`❌ Error in update type ${ctx.updateType}`, err);
});

// === Launch bot ===
try {
  bot.launch({ dropPendingUpdates: true }, () => {
    console.log('✅ Bot successfully launched!');
    console.log(`🔗 API Base URL: ${configService.get('api')?.baseUrl}`);
>>>>>>> Stashed changes
  });
} catch (error) {
  console.error('❌ Failed to launch bot:', error);
  process.exit(1);
}

<<<<<<< Updated upstream
// Graceful shutdown
const gracefulShutdown = (signal: any) => {
  bot.stop(signal);
=======
// === Graceful shutdown ===
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}, stopping bot...`);
  bot.stop(signal);
  console.log('✅ Bot stopped gracefully');
>>>>>>> Stashed changes
  process.exit(0);
};

process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
<<<<<<< Updated upstream
=======

// === Global error handlers (last resort) ===
process.on('uncaughtException', error => {
  console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});
>>>>>>> Stashed changes
