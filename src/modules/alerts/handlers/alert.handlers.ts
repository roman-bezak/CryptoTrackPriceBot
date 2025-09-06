import { AlertMessages, ErrorMessages } from '../../../shared/messages/index.js';
import { cryptoPriceService } from '../../prices/services/crypto-price.service.js';
import { alertService } from '../services/alert.service.js';

import type { NotificationService } from '../../common/services/notification.service.js';
import type { Context } from 'telegraf';

export class AlertHandlers {
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  /**
   * Handler for /setalert command
   * Format: /setalert <symbol> <price> <condition>
   * Example: /setalert BTC 50000 above
   */
  public async handleSetAlert(ctx: Context): Promise<void> {
    try {
      if (!ctx.message || !('text' in ctx.message)) {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          AlertMessages.INVALID_MESSAGE_TYPE,
        );
        return;
      }

      const message = ctx.message.text;
      const parts = message.split(' ');

      if (parts.length !== 4) {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          AlertMessages.INVALID_COMMAND_FORMAT,
        );
        return;
      }

      const [, symbol, priceStr, condition] = parts;
      const targetPrice = parseFloat(priceStr);

      // Validation
      if (isNaN(targetPrice) || targetPrice <= 0) {
        await this.notificationService.sendErrorMessage(ctx.chat?.id?.toString() || '', AlertMessages.INVALID_PRICE);
        return;
      }

      if (condition !== 'above' && condition !== 'below') {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          AlertMessages.INVALID_CONDITION,
        );
        return;
      }

      // Check if symbol is supported
      const supportedSymbols = cryptoPriceService.getSupportedSymbols();
      const coinId = cryptoPriceService.getCoinId(symbol);

      if (!supportedSymbols.includes(coinId)) {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          AlertMessages.UNSUPPORTED_SYMBOL(symbol),
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
      const coinName = cryptoPriceService.getCoinName(symbol);
      await this.notificationService.sendAlertCreatedNotification(
        ctx.chat?.id?.toString() || '',
        coinName,
        symbol.toUpperCase(),
        targetPrice,
        condition as 'above' | 'below',
      );
    } catch (error) {
      console.error(ErrorMessages.CREATE_ALERT_FAILED, error);

      const chatId = ctx.chat?.id?.toString() || '';

      // Check for different types of duplicate alert errors
      if (error instanceof Error) {
        // Custom error from our service
        if (error.message === 'Such alert already exists') {
          await this.notificationService.sendErrorMessage(chatId, AlertMessages.ALERT_ALREADY_EXISTS);
          return;
        }

        // Prisma unique constraint error
        if (error.message.includes('Unique constraint failed') || error.name === 'PrismaClientKnownRequestError') {
          console.log('Prisma unique constraint violation detected');
          await this.notificationService.sendErrorMessage(chatId, AlertMessages.ALERT_ALREADY_EXISTS);
          return;
        }

        // Database constraint errors (SQLite specific)
        if (error.message.includes('UNIQUE constraint failed') || error.message.includes('SQLITE_CONSTRAINT')) {
          console.log('SQLite unique constraint violation detected');
          await this.notificationService.sendErrorMessage(chatId, AlertMessages.ALERT_ALREADY_EXISTS);
          return;
        }
      }

      // Log detailed error information for debugging
      const errorWithDetails = error as Error & { code?: string; meta?: unknown };
      console.error('Unhandled error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        code: errorWithDetails.code,
        meta: errorWithDetails.meta,
      });

      // Generic error message for other cases
      await this.notificationService.sendErrorMessage(chatId, AlertMessages.CREATE_ALERT_ERROR);
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
      console.error(ErrorMessages.GET_ALERTS_FAILED, error);
      await this.notificationService.sendErrorMessage(ctx.chat?.id?.toString() || '', AlertMessages.FETCH_ALERTS_ERROR);
    }
  }

  /**
   * Handler for /deletealert command
   * Format: /deletealert <id>
   */
  public async handleDeleteAlert(ctx: Context): Promise<void> {
    try {
      if (!ctx.message || !('text' in ctx.message)) {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          AlertMessages.INVALID_MESSAGE_TYPE,
        );
        return;
      }

      const message = ctx.message.text;
      const parts = message.split(' ');

      if (parts.length !== 2) {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          AlertMessages.INVALID_DELETE_FORMAT,
        );
        return;
      }

      const [, alertIdStr] = parts;
      const alertId = parseInt(alertIdStr, 10);

      if (isNaN(alertId) || alertId <= 0) {
        await this.notificationService.sendErrorMessage(ctx.chat?.id?.toString() || '', AlertMessages.INVALID_ALERT_ID);
        return;
      }

      const deleted = await alertService.deleteAlert(ctx.chat?.id?.toString() || '', alertId);

      if (deleted) {
        await this.notificationService.sendAlertDeletedNotification(ctx.chat?.id?.toString() || '', alertId);
      } else {
        await this.notificationService.sendErrorMessage(ctx.chat?.id?.toString() || '', AlertMessages.ALERT_NOT_FOUND);
      }
    } catch (error) {
      console.error(ErrorMessages.DELETE_ALERT_FAILED, error);
      await this.notificationService.sendErrorMessage(ctx.chat?.id?.toString() || '', AlertMessages.DELETE_ALERT_ERROR);
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
      console.error(ErrorMessages.GET_STATS_FAILED, error);
      await this.notificationService.sendErrorMessage(ctx.chat?.id?.toString() || '', AlertMessages.FETCH_STATS_ERROR);
    }
  }
}
