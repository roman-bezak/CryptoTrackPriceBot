import { cryptoPriceService } from './CryptoPriceService.js';

import type { AlertWithUser } from './AlertService.js';
import type { CryptoPrice } from './CryptoPriceService.js';
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
   * Отправить уведомление о сработавшем оповещении
   */
  public async sendPriceAlertNotification(alert: AlertWithUser, currentPrice: CryptoPrice): Promise<void> {
    try {
      const coinName = cryptoPriceService.getCoinName(alert.symbol);
      const conditionText = alert.condition === 'above' ? 'выше' : 'ниже';
      const changeEmoji = currentPrice.change24h >= 0 ? '📈' : '📉';
      const changeText = currentPrice.change24h >= 0 ? '+' : '';

      const message = `🚨 *Оповещение о цене сработало!*

💰 *${coinName} (${alert.symbol})*
💵 Текущая цена: $${currentPrice.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
🎯 Целевая цена: $${alert.targetPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${conditionText})
${changeEmoji} Изменение за 24ч: ${changeText}${currentPrice.change24h.toFixed(2)}%
🕐 Обновлено: ${currentPrice.lastUpdated.toLocaleString('ru-RU')}

✅ Оповещение автоматически отключено.`;

      await this.bot.telegram.sendMessage(alert.user.chatId, message, {
        parse_mode: 'Markdown',
      });

      console.log(`✅ Уведомление отправлено пользователю ${alert.user.chatId} для ${alert.symbol}`);
    } catch (error) {
      console.error(`❌ Ошибка при отправке уведомления пользователю ${alert.user.chatId}:`, error);
    }
  }

  /**
   * Отправить подтверждение создания оповещения
   */
  public async sendAlertCreatedNotification(
    chatId: string,
    symbol: string,
    targetPrice: number,
    condition: 'above' | 'below',
  ): Promise<void> {
    try {
      const coinName = cryptoPriceService.getCoinName(symbol);
      const conditionText = condition === 'above' ? 'выше' : 'ниже';

      const message = `✅ *Оповещение создано!*

💰 *${coinName} (${symbol})*
🎯 Уведомление при цене ${conditionText} $${targetPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Используйте /alerts для просмотра всех ваших оповещений.`;

      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      console.error(`❌ Ошибка при отправке подтверждения пользователю ${chatId}:`, error);
    }
  }

  /**
   * Отправить список оповещений пользователя
   */
  public async sendAlertsList(chatId: string, alerts: any[]): Promise<void> {
    try {
      if (alerts.length === 0) {
        await this.bot.telegram.sendMessage(
          chatId,
          '📝 У вас пока нет активных оповещений.\n\nИспользуйте /setalert для создания нового оповещения.',
        );
        return;
      }

      let message = '📝 *Ваши активные оповещения:*\n\n';

      for (const alert of alerts) {
        const coinName = cryptoPriceService.getCoinName(alert.symbol);
        const conditionText = alert.condition === 'above' ? 'выше' : 'ниже';
        const date = new Date(alert.createdAt).toLocaleDateString('ru-RU');

        message += `💰 *${coinName} (${alert.symbol})*\n`;
        message += `🎯 ${conditionText} $${alert.targetPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
        message += `📅 Создано: ${date}\n`;
        message += `🆔 ID: \`${alert.id}\`\n\n`;
      }

      message += 'Для удаления оповещения используйте /deletealert <ID>';

      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      console.error(`❌ Ошибка при отправке списка оповещений пользователю ${chatId}:`, error);
    }
  }

  /**
   * Отправить подтверждение удаления оповещения
   */
  public async sendAlertDeletedNotification(chatId: string, alertId: number): Promise<void> {
    try {
      const message = `✅ Оповещение с ID \`${alertId}\` успешно удалено.`;

      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      console.error(`❌ Ошибка при отправке подтверждения удаления пользователю ${chatId}:`, error);
    }
  }

  /**
   * Отправить сообщение об ошибке
   */
  public async sendErrorMessage(chatId: string, errorMessage: string): Promise<void> {
    try {
      const message = `❌ *Ошибка:* ${errorMessage}`;

      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      console.error(`❌ Ошибка при отправке сообщения об ошибке пользователю ${chatId}:`, error);
    }
  }

  /**
   * Отправить статистику оповещений
   */
  public async sendAlertStats(
    chatId: string,
    stats: { total: number; active: number; triggered: number },
  ): Promise<void> {
    try {
      const message = `📊 *Статистика ваших оповещений:*

📝 Всего создано: ${stats.total}
✅ Активных: ${stats.active}
🚨 Сработало: ${stats.triggered}`;

      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      console.error(`❌ Ошибка при отправке статистики пользователю ${chatId}:`, error);
    }
  }

  /**
   * Отправить список поддерживаемых криптовалют
   */
  public async sendSupportedSymbols(chatId: string): Promise<void> {
    try {
      const symbols = cryptoPriceService.getSupportedSymbols();
      let message = '💰 *Поддерживаемые криптовалюты:*\n\n';

      for (const symbol of symbols) {
        const coinName = cryptoPriceService.getCoinName(symbol);
        message += `• ${coinName} (${symbol})\n`;
      }

      message += '\nИспользуйте символ валюты при создании оповещения.';

      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      console.error(`❌ Ошибка при отправке списка символов пользователю ${chatId}:`, error);
    }
  }
}
