import { Telegraf } from 'telegraf';

import { config } from './config/ConfigService.js';

// === Initial logs ===
console.log(`🌍 NODE_ENV: ${config.get('NODE_ENV')}`);
console.log('🚀 Starting CryptoTrackPriceBot...');

// === Init bot ===
const bot = new Telegraf(config.get('BOT_TOKEN'));

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
  });
} catch (error) {
  console.error('❌ Failed to launch bot:', error);
  process.exit(1);
}

// === Graceful shutdown ===
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}, stopping bot...`);
  bot.stop(signal);
  console.log('✅ Bot stopped gracefully');
  process.exit(0);
};

process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));

// === Global error handlers (last resort) ===
process.on('uncaughtException', error => {
  console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});
