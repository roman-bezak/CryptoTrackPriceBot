import { PrismaClient } from '@prisma/client';
import { Telegraf } from 'telegraf';

import { config } from './config/ConfigService.js';
import { AlertHandlers } from './handlers/AlertHandlers.js';
import { AlertCheckerService } from './services/AlertCheckerService.js';

// === Initial logs ===
console.log(`🌍 NODE_ENV: ${config.get('NODE_ENV')}`);
console.log('🚀 Starting CryptoTrackPriceBot...');

// === Init bot ===
const bot = new Telegraf(config.get('BOT_TOKEN'));

const prisma = new PrismaClient();

// === Initialize services ===
const alertCheckerService = AlertCheckerService.getInstance(bot);
const alertHandlers = new AlertHandlers(bot);

// === Admin commands ===
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

// === Alert commands ===
bot.command('setalert', async ctx => {
  await alertHandlers.handleSetAlert(ctx);
});

bot.command('alerts', async ctx => {
  await alertHandlers.handleGetAlerts(ctx);
});

bot.command('deletealert', async ctx => {
  await alertHandlers.handleDeleteAlert(ctx);
});

bot.command('stats', async ctx => {
  await alertHandlers.handleGetStats(ctx);
});

bot.command('symbols', async ctx => {
  await alertHandlers.handleGetSymbols(ctx);
});

bot.command('price', async ctx => {
  await alertHandlers.handleGetPrice(ctx);
});

// === Basic commands ===
bot.start(ctx => {
  const welcomeMessage = `🤖 *Добро пожаловать в CryptoTrackPriceBot!* v1.0.0

💰 Этот бот поможет вам отслеживать цены криптовалют и получать уведомления при достижении целевых уровней.

📋 *Доступные команды:*

🔔 *Управление оповещениями:*
• /setalert <символ> <цена> <условие> - Создать оповещение
• /alerts - Показать ваши оповещения
• /deletealert <ID> - Удалить оповещение
• /stats - Статистика оповещений

📊 *Информация:*
• /price <символ> - Текущая цена криптовалюты
• /symbols - Список поддерживаемых криптовалют
• /help - Показать эту справку

💡 *Примеры:*
• /setalert BTC 50000 above - Уведомить когда Bitcoin будет выше $50,000
• /setalert ETH 3000 below - Уведомить когда Ethereum будет ниже $3,000
• /price BTC - Показать текущую цену Bitcoin

Используйте /help для получения дополнительной информации.`;

  ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
});

bot.help(ctx => {
  const helpMessage = `📚 *Справка по командам CryptoTrackPriceBot*

🔔 *Создание оповещений:*
/setalert <символ> <цена> <условие>
Создает оповещение для отслеживания цены криптовалюты.

*Параметры:*
• символ - код криптовалюты (BTC, ETH, BNB и т.д.)
• цена - целевая цена в долларах
• условие - above (выше) или below (ниже)

*Примеры:*
• /setalert BTC 50000 above
• /setalert ETH 3000 below
• /setalert BNB 400 above

📝 *Управление оповещениями:*
• /alerts - Показать все ваши активные оповещения
• /deletealert <ID> - Удалить оповещение по ID
• /stats - Показать статистику ваших оповещений

📊 *Информация о ценах:*
• /price <символ> - Показать текущую цену криптовалюты
• /symbols - Список всех поддерживаемых криптовалют

💡 *Как это работает:*
1. Создайте оповещение с помощью /setalert
2. Бот будет проверять цены каждые 5 минут
3. Когда цена достигнет целевого уровня, вы получите уведомление
4. Оповещение автоматически отключится после срабатывания

🔧 *Поддерживаемые криптовалюты:*
Bitcoin (BTC), Ethereum (ETH), Binance Coin (BNB), Cardano (ADA), Solana (SOL), Ripple (XRP), Polkadot (DOT), Dogecoin (DOGE), Avalanche (AVAX), Polygon (MATIC)`;

  ctx.reply(helpMessage, { parse_mode: 'Markdown' });
});

// === Runtime error handler ===
bot.catch((err, ctx) => {
  console.error(`❌ Error in update type ${ctx.updateType}`, err);
});

// === Launch bot ===
try {
  bot.launch({ dropPendingUpdates: true }, () => {
    console.log('✅ Bot successfully launched!');

    // Start alert checking service
    alertCheckerService.startChecking(5); // Check every 5 minutes
    alertCheckerService.startCleanup(24); // Cleanup every 24 hours

    console.log('🔄 Alert checking service started');
  });
} catch (error) {
  console.error('❌ Failed to launch bot:', error);
  process.exit(1);
}

// === Graceful shutdown ===
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}, stopping bot...`);

  // Stop alert checking service
  alertCheckerService.stopChecking();
  console.log('🛑 Alert checking service stopped');

  // Stop bot
  bot.stop(signal);
  console.log('✅ Bot stopped gracefully');

  // Close database connection
  prisma.$disconnect();
  console.log('✅ Database connection closed');

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
