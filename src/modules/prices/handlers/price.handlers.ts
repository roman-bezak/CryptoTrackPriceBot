import { AlertMessages, ErrorMessages } from '../../../shared/messages/index.js';
import { cryptoPriceService } from '../services/crypto-price.service.js';

import type { NotificationService } from '../../common/services/notification.service.js';
import type { Context } from 'telegraf';

export class PriceHandlers {
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  /**
   * Handler for /price command
   * Format: /price <symbol>
   */
  public async handleGetPrice(ctx: Context): Promise<void> {
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
          AlertMessages.INVALID_PRICE_FORMAT,
        );
        return;
      }

      const [, symbol] = parts;
      const price = await cryptoPriceService.getPrice(symbol);

      if (!price) {
        await this.notificationService.sendErrorMessage(
          ctx.chat?.id?.toString() || '',
          AlertMessages.PRICE_FETCH_FAILED(symbol),
        );
        return;
      }

      const coinName = cryptoPriceService.getCoinName(symbol);
      const messageText = AlertMessages.PRICE_INFO(
        coinName,
        price.symbol,
        price.price,
        price.change24h,
        price.lastUpdated,
      );

      await ctx.reply(messageText, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error(ErrorMessages.GET_PRICE_FAILED, error);
      await this.notificationService.sendErrorMessage(ctx.chat?.id?.toString() || '', AlertMessages.FETCH_PRICE_ERROR);
    }
  }

  /**
   * Handler for /symbols command
   */
  public async handleGetSymbols(ctx: Context): Promise<void> {
    try {
      await this.notificationService.sendSupportedSymbols(ctx.chat?.id?.toString() || '');
    } catch (error) {
      console.error(ErrorMessages.GET_SYMBOLS_FAILED, error);
      await this.notificationService.sendErrorMessage(
        ctx.chat?.id?.toString() || '',
        AlertMessages.FETCH_SYMBOLS_ERROR,
      );
    }
  }
}
