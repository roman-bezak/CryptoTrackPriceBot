import { alertService } from '../services/AlertService.js';
import { cryptoPriceService } from '../services/CryptoPriceService.js';
import { NotificationService } from '../services/NotificationService.js';

import type { Context, Telegraf } from 'telegraf';

export class AlertHandlers {
  private notificationService: NotificationService;

  constructor(bot: Telegraf) {
    this.notificationService = NotificationService.getInstance(bot);
  }

  /**
   * Обработчик команды /setalert
   * Формат: /setalert <symbol> <price> <condition>
   * Пример: /setalert BTC 50000 above
   */
  public async handleSetAlert(ctx: Context): Promise<void> {
    try {
      if (!ctx.message || !('text' in ctx.message)) {
        await this.notificationService.sendErrorMessage(ctx.chat?.id?.toString() || '', 'Неверный тип сообщения');
        return;
      }

      const message = ctx.message.text;

      const parts = message.split(' ');
      if (parts.length !== 4) {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          'Неверный формат команды. Используйте: /setalert <символ> <цена> <условие>\n\nПример: /setalert BTC 50000 above\n\nУсловия: above (выше) или below (ниже)',
        );
        return;
      }

      const [, symbol, priceStr, condition] = parts;
      const targetPrice = parseFloat(priceStr);

      // Валидация
      if (isNaN(targetPrice) || targetPrice <= 0) {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          'Неверная цена. Цена должна быть положительным числом.',
        );
        return;
      }

      if (condition !== 'above' && condition !== 'below') {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          'Неверное условие. Используйте "above" (выше) или "below" (ниже).',
        );
        return;
      }

      // Проверить, поддерживается ли символ
      const supportedSymbols = cryptoPriceService.getSupportedSymbols();
      const coinId = cryptoPriceService.getCoinId(symbol);

      if (!supportedSymbols.includes(coinId)) {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          `Неподдерживаемый символ "${symbol}". Используйте /symbols для просмотра доступных криптовалют.`,
        );
        return;
      }

      //Создать оповещение
      await alertService.createAlert({
        chatId: ctx.chat?.id?.toString() || '',
        symbol: symbol.toUpperCase(),
        targetPrice,
        condition: condition as 'above' | 'below',
      });

      // Отправить подтверждение
      await this.notificationService.sendAlertCreatedNotification(
        ctx.chat?.id?.toString() || '',
        symbol.toUpperCase(),
        targetPrice,
        condition as 'above' | 'below',
      );
    } catch (error) {
      console.error('Ошибка при создании оповещения:', error);

      if (error instanceof Error && error.message === 'Такое оповещение уже существует') {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          'Такое оповещение уже существует. Используйте /alerts для просмотра ваших оповещений.',
        );
      } else {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          'Произошла ошибка при создании оповещения. Попробуйте позже.',
        );
      }
    }
  }

  /**
   * Обработчик команды /alerts
   */
  public async handleGetAlerts(ctx: Context): Promise<void> {
    try {
      const chatId = ctx.chat?.id?.toString() || '';
      const alerts = await alertService.getUserAlerts(chatId);

      await this.notificationService.sendAlertsList(chatId, alerts);
    } catch (error) {
      console.error('Ошибка при получении оповещений:', error);
      await this.notificationService.sendErrorMessage(
        ctx.chat?.id?.toString() || '',
        'Произошла ошибка при получении оповещений. Попробуйте позже.',
      );
    }
  }

  /**
   * Обработчик команды /deletealert
   * Формат: /deletealert <id>
   */
  public async handleDeleteAlert(ctx: Context): Promise<void> {
    try {
      if (!ctx.message || !('text' in ctx.message)) {
        await this.notificationService.sendErrorMessage(ctx.chat?.id?.toString() || '', 'Неверный тип сообщения');
        return;
      }

      const message = ctx.message.text;

      const parts = message.split(' ');
      if (parts.length !== 2) {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          'Неверный формат команды. Используйте: /deletealert <ID>\n\nID можно посмотреть в списке оповещений (/alerts)',
        );
        return;
      }

      const [, alertIdStr] = parts;
      const alertId = parseInt(alertIdStr, 10);

      if (isNaN(alertId) || alertId <= 0) {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          'Неверный ID оповещения. ID должен быть положительным числом.',
        );
        return;
      }

      const deleted = await alertService.deleteAlert(ctx.chat?.id?.toString() || '', alertId);

      if (deleted) {
        await this.notificationService.sendAlertDeletedNotification(ctx.chat?.id?.toString() || '', alertId);
      } else {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          'Оповещение с таким ID не найдено или не принадлежит вам.',
        );
      }
    } catch (error) {
      console.error('Ошибка при удалении оповещения:', error);
      await this.notificationService.sendErrorMessage(
        ctx.chat?.id?.toString() || '',
        'Произошла ошибка при удалении оповещения. Попробуйте позже.',
      );
    }
  }

  /**
   * Обработчик команды /stats
   */
  public async handleGetStats(ctx: Context): Promise<void> {
    try {
      const chatId = ctx.chat?.id?.toString() || '';
      const stats = await alertService.getUserAlertStats(chatId);

      await this.notificationService.sendAlertStats(chatId, stats);
    } catch (error) {
      console.error('Ошибка при получении статистики:', error);
      await this.notificationService.sendErrorMessage(
        ctx.chat?.id?.toString() || '',
        'Произошла ошибка при получении статистики. Попробуйте позже.',
      );
    }
  }

  /**
   * Обработчик команды /symbols
   */
  public async handleGetSymbols(ctx: Context): Promise<void> {
    try {
      await this.notificationService.sendSupportedSymbols(ctx.chat?.id?.toString() || '');
    } catch (error) {
      console.error('Ошибка при получении списка символов:', error);
      await this.notificationService.sendErrorMessage(
        ctx.chat?.id?.toString() || '',
        'Произошла ошибка при получении списка символов. Попробуйте позже.',
      );
    }
  }

  /**
   * Обработчик команды /price
   * Формат: /price <symbol>
   */
  public async handleGetPrice(ctx: Context): Promise<void> {
    try {
      if (!ctx.message || !('text' in ctx.message)) {
        await this.notificationService.sendErrorMessage(ctx.chat?.id?.toString() || '', 'Неверный тип сообщения');
        return;
      }

      const message = ctx.message.text;

      const parts = message.split(' ');
      if (parts.length !== 2) {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          'Неверный формат команды. Используйте: /price <символ>\n\nПример: /price BTC',
        );
        return;
      }

      const [, symbol] = parts;
      const price = await cryptoPriceService.getPrice(symbol);

      if (!price) {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          `Не удалось получить цену для "${symbol}". Проверьте правильность символа или попробуйте позже.`,
        );
        return;
      }

      const coinName = cryptoPriceService.getCoinName(symbol);
      const changeEmoji = price.change24h >= 0 ? '📈' : '📉';
      const changeText = price.change24h >= 0 ? '+' : '';

      const messageText = `💰 *${coinName} (${price.symbol})*

💵 Цена: $${price.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
${changeEmoji} Изменение за 24ч: ${changeText}${price.change24h.toFixed(2)}%
🕐 Обновлено: ${price.lastUpdated.toLocaleString('ru-RU')}`;

      await ctx.reply(messageText, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Ошибка при получении цены:', error);
      await this.notificationService.sendErrorMessage(
        ctx.chat?.id?.toString() || '',
        'Произошла ошибка при получении цены. Попробуйте позже.',
      );
    }
  }
}
