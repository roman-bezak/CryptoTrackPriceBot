import { cryptoPriceService } from './CryptoPriceService.js';

import type { IAlertWithUser } from './AlertService.js';
import type { ICryptoPrice } from './CryptoPriceService.js';
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
      throw new Error('NotificationService not initialized. Call getInstance(bot) first.');
    }
    return NotificationService.instance;
  }

  /**
   * Send triggered alert notification
   */
  public async sendPriceAlertNotification(alert: IAlertWithUser, currentPrice: ICryptoPrice): Promise<void> {
    try {
      const coinName = cryptoPriceService.getCoinName(alert.symbol);
      const conditionText = alert.condition === 'above' ? 'above' : 'below';
      const changeEmoji = currentPrice.change24h >= 0 ? '📈' : '📉';
      const changeText = currentPrice.change24h >= 0 ? '+' : '';

      const message = `🚨 *Price alert triggered!*

💰 *${coinName} (${alert.symbol})*
💵 Current price: $${currentPrice.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
🎯 Target price: $${alert.targetPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${conditionText})
${changeEmoji} 24h Change: ${changeText}${currentPrice.change24h.toFixed(2)}%
🕐 Updated: ${currentPrice.lastUpdated.toLocaleString('ru-RU')}

✅ Alert automatically disabled.`;

      await this.bot.telegram.sendMessage(alert.user.chatId, message, {
        parse_mode: 'Markdown',
      });

      console.log(`✅ Notification sent to user ${alert.user.chatId} for ${alert.symbol}`);
    } catch (error) {
      console.error(`❌ Error sending notification to user ${alert.user.chatId}:`, error);
    }
  }

  /**
   * Send alert creation confirmation
   */
  public async sendAlertCreatedNotification(
    chatId: string,
    symbol: string,
    targetPrice: number,
    condition: 'above' | 'below',
  ): Promise<void> {
    try {
      const coinName = cryptoPriceService.getCoinName(symbol);
      const conditionText = condition === 'above' ? 'above' : 'below';

      const message = `✅ *Alert created!*

💰 *${coinName} (${symbol})*
🎯 Notification when price is ${conditionText} $${targetPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Use /alerts to view all your alerts.`;

      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      console.error(`❌ Error sending confirmation to user ${chatId}:`, error);
    }
  }

  /**
   * Send user's alerts list
   */
  public async sendAlertsList(chatId: string, alerts: PriceAlert[]): Promise<void> {
    try {
      if (alerts.length === 0) {
        await this.bot.telegram.sendMessage(
          chatId,
          '📝 You have no active alerts yet.\n\nUse /setalert to create a new alert.',
        );
        return;
      }

      let message = '📝 *Your active alerts:*\n\n';

      for (const alert of alerts) {
        const coinName = cryptoPriceService.getCoinName(alert.symbol);
        const conditionText = alert.condition === 'above' ? 'above' : 'below';
        const date = new Date(alert.createdAt).toLocaleDateString('ru-RU');

        message += `💰 *${coinName} (${alert.symbol})*\n`;
        message += `🎯 ${conditionText} $${alert.targetPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
        message += `📅 Created: ${date}\n`;
        message += `🆔 ID: \`${alert.id}\`\n\n`;
      }

      message += 'To delete an alert use /deletealert <ID>';

      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      console.error(`❌ Error sending alerts list to user ${chatId}:`, error);
    }
  }

  /**
   * Send alert deletion confirmation
   */
  public async sendAlertDeletedNotification(chatId: string, alertId: number): Promise<void> {
    try {
      const message = `✅ Alert with ID \`${alertId}\` successfully deleted.`;

      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      console.error(`❌ Error sending deletion confirmation to user ${chatId}:`, error);
    }
  }

  /**
   * Send error message
   */
  public async sendErrorMessage(chatId: string, errorMessage: string): Promise<void> {
    try {
      const message = `❌ *Error:* ${errorMessage}`;

      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      console.error(`❌ Error sending error message to user ${chatId}:`, error);
    }
  }

  /**
   * Send alert statistics
   */
  public async sendAlertStats(
    chatId: string,
    stats: { total: number; active: number; triggered: number },
  ): Promise<void> {
    try {
      const message = `📊 *Your alert statistics:*

📝 Total created: ${stats.total}
✅ Active: ${stats.active}
🚨 Triggered: ${stats.triggered}`;

      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      console.error(`❌ Error sending statistics to user ${chatId}:`, error);
    }
  }

  /**
   * Send list of supported cryptocurrencies
   */
  public async sendSupportedSymbols(chatId: string): Promise<void> {
    try {
      const symbols = cryptoPriceService.getSupportedSymbols();
      let message = '💰 *Supported cryptocurrencies:*\n\n';

      for (const symbol of symbols) {
        const coinName = cryptoPriceService.getCoinName(symbol);
        message += `• ${coinName} (${symbol})\n`;
      }

      message += '\nUse the currency symbol when creating alerts.';

      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      console.error(`❌ Error sending symbols list to user ${chatId}:`, error);
    }
  }
}
