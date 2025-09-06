import { CRYPTO_CONSTANTS } from '../../../shared/constants/index.js';
import { AlertMessages, ErrorMessages } from '../../../shared/messages/index.js';
import { cryptoPriceService } from '../../prices/services/crypto-price.service.js';

import type { IAlertWithUser, ICryptoPrice, IAlertStats } from '../../../shared/types/index.js';
import type { PriceAlert } from '@prisma/client';
import type { Telegraf } from 'telegraf';

export class NotificationService {
  private static instance: NotificationService;
  private bot: Telegraf;

  private constructor(bot: Telegraf) {
    this.bot = bot;
  }

  public static getInstance(bot?: Telegraf): NotificationService {
    if (!NotificationService.instance && bot) {
      NotificationService.instance = new NotificationService(bot);
    }
    if (!NotificationService.instance) {
      throw new Error(ErrorMessages.NOTIFICATION_SERVICE_NOT_INITIALIZED);
    }
    return NotificationService.instance;
  }

  /**
   * Send triggered alert notification
   */
  public async sendPriceAlertNotification(alert: IAlertWithUser, currentPrice: ICryptoPrice): Promise<void> {
    try {
      const coinName = cryptoPriceService.getCoinName(alert.symbol);
      const message = AlertMessages.PRICE_ALERT_TRIGGERED(
        coinName,
        alert.symbol,
        currentPrice.price,
        alert.targetPrice,
        alert.condition as 'above' | 'below',
        currentPrice.change24h,
        currentPrice.lastUpdated,
      );

      await this.bot.telegram.sendMessage(alert.user.chatId, message, {
        parse_mode: 'Markdown',
      });

      console.log(`✅ Notification sent to user ${alert.user.chatId} for ${alert.symbol}`);
    } catch (error) {
      console.error(ErrorMessages.NOTIFICATION_SEND_FAILED(alert.user.chatId, error));
    }
  }

  /**
   * Send alert creation confirmation
   */
  public async sendAlertCreatedNotification(
    chatId: string,
    coinName: string,
    symbol: string,
    targetPrice: number,
    condition: 'above' | 'below',
  ): Promise<void> {
    try {
      const message = AlertMessages.ALERT_CREATED(coinName, symbol, targetPrice, condition);

      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      console.error(ErrorMessages.CONFIRMATION_SEND_FAILED(chatId, error));
    }
  }

  /**
   * Send user's alerts list
   */
  public async sendAlertsList(chatId: string, alerts: PriceAlert[]): Promise<void> {
    try {
      if (alerts.length === 0) {
        await this.bot.telegram.sendMessage(chatId, AlertMessages.NO_ACTIVE_ALERTS);
        return;
      }

      let message = AlertMessages.ALERTS_LIST_HEADER;

      for (const alert of alerts) {
        const coinName = cryptoPriceService.getCoinName(alert.symbol);
        message += AlertMessages.ALERT_ITEM(
          coinName,
          alert.symbol,
          alert.condition as 'above' | 'below',
          alert.targetPrice,
          alert.createdAt,
          alert.id,
        );
      }

      message += AlertMessages.ALERTS_LIST_FOOTER;

      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      console.error(ErrorMessages.ALERTS_LIST_SEND_FAILED(chatId, error));
    }
  }

  /**
   * Send alert deletion confirmation
   */
  public async sendAlertDeletedNotification(chatId: string, alertId: number): Promise<void> {
    try {
      const message = AlertMessages.ALERT_DELETED(alertId);

      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      console.error(ErrorMessages.DELETION_CONFIRMATION_SEND_FAILED(chatId, error));
    }
  }

  /**
   * Send error message
   */
  public async sendErrorMessage(chatId: string, errorMessage: string): Promise<void> {
    try {
      const message = ErrorMessages.GENERIC_ERROR(errorMessage);

      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      console.error(ErrorMessages.ERROR_MESSAGE_SEND_FAILED(chatId, error));
    }
  }

  /**
   * Send alert statistics
   */
  public async sendAlertStats(chatId: string, stats: IAlertStats): Promise<void> {
    try {
      const message = AlertMessages.STATS_MESSAGE(stats);

      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      console.error(ErrorMessages.STATS_SEND_FAILED(chatId, error));
    }
  }

  /**
   * Send list of supported cryptocurrencies
   */
  public async sendSupportedSymbols(chatId: string): Promise<void> {
    try {
      let message = AlertMessages.SUPPORTED_SYMBOLS_HEADER;

      // Get supported symbols from constants
      const symbolEntries = Object.entries(CRYPTO_CONSTANTS.SYMBOL_TO_NAME);

      for (const [symbol, coinName] of symbolEntries) {
        message += AlertMessages.SYMBOL_ITEM(coinName, symbol);
      }

      message += AlertMessages.SUPPORTED_SYMBOLS_FOOTER;

      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      console.error(ErrorMessages.SYMBOLS_LIST_SEND_FAILED(chatId, error));
    }
  }
}
