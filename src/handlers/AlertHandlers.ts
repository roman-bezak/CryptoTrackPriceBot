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
   * Handler for /setalert command
   * Format: /setalert <symbol> <price> <condition>
   * Example: /setalert BTC 50000 above
   */
  public async handleSetAlert(ctx: Context): Promise<void> {
    try {
      if (!ctx.message || !('text' in ctx.message)) {
        await this.notificationService.sendErrorMessage(ctx.chat?.id?.toString() || '', 'Invalid message type');
        return;
      }

      const message = ctx.message.text;

      const parts = message.split(' ');
      if (parts.length !== 4) {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          'Invalid command format. Use: /setalert <symbol> <price> <condition>\n\nExample: /setalert BTC 50000 above\n\nConditions: above or below',
        );
        return;
      }

      const [, symbol, priceStr, condition] = parts;
      const targetPrice = parseFloat(priceStr);

      // Validation
      if (isNaN(targetPrice) || targetPrice <= 0) {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          'Invalid price. Price must be a positive number.',
        );
        return;
      }

      if (condition !== 'above' && condition !== 'below') {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          'Invalid condition. Use "above" or "below".',
        );
        return;
      }

      // Check if symbol is supported
      const supportedSymbols = cryptoPriceService.getSupportedSymbols();
      const coinId = cryptoPriceService.getCoinId(symbol);

      if (!supportedSymbols.includes(coinId)) {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          `Unsupported symbol "${symbol}". Use /symbols to view available cryptocurrencies.`,
        );
        return;
      }

      // Create alert
      await alertService.createAlert({
        chatId: ctx.chat?.id?.toString() || '',
        symbol: symbol.toUpperCase(),
        targetPrice,
        condition: condition as 'above' | 'below',
      });

      // Send confirmation
      await this.notificationService.sendAlertCreatedNotification(
        ctx.chat?.id?.toString() || '',
        symbol.toUpperCase(),
        targetPrice,
        condition as 'above' | 'below',
      );
    } catch (error) {
      console.error('Error creating alert:', error);

      if (error instanceof Error && error.message === 'Such alert already exists') {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          'Such alert already exists. Use /alerts to view your alerts.',
        );
      } else {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          'An error occurred while creating alert. Try again later.',
        );
      }
    }
  }

  /**
   * Handler for /alerts command
   */
  public async handleGetAlerts(ctx: Context): Promise<void> {
    try {
      const chatId = ctx.chat?.id?.toString() || '';
      const alerts = await alertService.getUserAlerts(chatId);

      await this.notificationService.sendAlertsList(chatId, alerts);
    } catch (error) {
      console.error('Error getting alerts:', error);
      await this.notificationService.sendErrorMessage(
        ctx.chat?.id?.toString() || '',
        'An error occurred while fetching alerts. Try again later.',
      );
    }
  }

  /**
   * Handler for /deletealert command
   * Format: /deletealert <id>
   */
  public async handleDeleteAlert(ctx: Context): Promise<void> {
    try {
      if (!ctx.message || !('text' in ctx.message)) {
        await this.notificationService.sendErrorMessage(ctx.chat?.id?.toString() || '', 'Invalid message type');
        return;
      }

      const message = ctx.message.text;

      const parts = message.split(' ');
      if (parts.length !== 2) {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          'Invalid command format. Use: /deletealert <ID>\n\nID can be found in alerts list (/alerts)',
        );
        return;
      }

      const [, alertIdStr] = parts;
      const alertId = parseInt(alertIdStr, 10);

      if (isNaN(alertId) || alertId <= 0) {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          'Invalid alert ID. ID must be a positive number.',
        );
        return;
      }

      const deleted = await alertService.deleteAlert(ctx.chat?.id?.toString() || '', alertId);

      if (deleted) {
        await this.notificationService.sendAlertDeletedNotification(ctx.chat?.id?.toString() || '', alertId);
      } else {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          'Alert with this ID not found or does not belong to you.',
        );
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      await this.notificationService.sendErrorMessage(
        ctx.chat?.id?.toString() || '',
        'An error occurred while deleting alert. Try again later.',
      );
    }
  }

  /**
   * Handler for /stats command
   */
  public async handleGetStats(ctx: Context): Promise<void> {
    try {
      const chatId = ctx.chat?.id?.toString() || '';
      const stats = await alertService.getUserAlertStats(chatId);

      await this.notificationService.sendAlertStats(chatId, stats);
    } catch (error) {
      console.error('Error getting statistics:', error);
      await this.notificationService.sendErrorMessage(
        ctx.chat?.id?.toString() || '',
        'An error occurred while fetching statistics. Try again later.',
      );
    }
  }

  /**
   * Handler for /symbols command
   */
  public async handleGetSymbols(ctx: Context): Promise<void> {
    try {
      await this.notificationService.sendSupportedSymbols(ctx.chat?.id?.toString() || '');
    } catch (error) {
      console.error('Error getting symbols list:', error);
      await this.notificationService.sendErrorMessage(
        ctx.chat?.id?.toString() || '',
        'An error occurred while fetching symbols list. Try again later.',
      );
    }
  }

  /**
   * Handler for /price command
   * Format: /price <symbol>
   */
  public async handleGetPrice(ctx: Context): Promise<void> {
    try {
      if (!ctx.message || !('text' in ctx.message)) {
        await this.notificationService.sendErrorMessage(ctx.chat?.id?.toString() || '', 'Invalid message type');
        return;
      }

      const message = ctx.message.text;

      const parts = message.split(' ');
      if (parts.length !== 2) {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          'Invalid command format. Use: /price <symbol>\n\nExample: /price BTC',
        );
        return;
      }

      const [, symbol] = parts;
      const price = await cryptoPriceService.getPrice(symbol);

      if (!price) {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          `Failed to get price for "${symbol}". Check symbol correctness or try again later.`,
        );
        return;
      }

      const coinName = cryptoPriceService.getCoinName(symbol);
      const changeEmoji = price.change24h >= 0 ? '📈' : '📉';
      const changeText = price.change24h >= 0 ? '+' : '';

      const messageText = `💰 *${coinName} (${price.symbol})*

💵 Price: $${price.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
${changeEmoji} 24h Change: ${changeText}${price.change24h.toFixed(2)}%
🕐 Updated: ${price.lastUpdated.toLocaleString('ru-RU')}`;

      await ctx.reply(messageText, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error getting price:', error);
      await this.notificationService.sendErrorMessage(
        ctx.chat?.id?.toString() || '',
        'An error occurred while fetching price. Try again later.',
      );
    }
  }
}
