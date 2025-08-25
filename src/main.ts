import { PrismaClient } from '@prisma/client';
import { Telegraf } from 'telegraf';

import { config } from './config/ConfigService.js';

// === Initial logs ===
console.log(`🌍 NODE_ENV: ${config.get('NODE_ENV')}`);
console.log('🚀 Starting CryptoTrackPriceBot...');

// === Init bot ===
const bot = new Telegraf(config.get('BOT_TOKEN'));

const prisma = new PrismaClient();

bot.command('users', async ctx => {
  try {
    const users = await prisma.user.findMany();
    if (users.length === 0) {
      await ctx.reply('🙁 В базе нет пользователей.');
      return;
    }
    let message = '👥 Пользователи:\n\n';
    for (const user of users) {
      message += `ID: ${user.id}\nChat ID: ${user.chatId}\nСоздан: ${user.createdAt.toISOString()}\n\n`;
    }
    await ctx.reply(message.trim());
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
    await ctx.reply('❌ Ошибка при получении пользователей из базы.');
  }
});

// === Commands ===
bot.start(ctx => ctx.reply('🤖 Welcome to CryptoTrackPriceBot! v1.0.0'));
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
