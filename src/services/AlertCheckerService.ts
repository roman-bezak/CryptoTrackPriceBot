import { alertService } from './AlertService.js';
import { NotificationService } from './NotificationService.js';

import type { Telegraf } from 'telegraf';

export class AlertCheckerService {
  private static instance: AlertCheckerService;
  private intervalId: NodeJS.Timeout | null = null;
  private notificationService: NotificationService;
  private isRunning = false;

  private constructor(bot: Telegraf) {
    this.notificationService = NotificationService.getInstance(bot);
  }

  public static getInstance(bot?: Telegraf): AlertCheckerService {
    if (!AlertCheckerService.instance && bot) {
      AlertCheckerService.instance = new AlertCheckerService(bot);
    }
    if (!AlertCheckerService.instance) {
      throw new Error('AlertCheckerService not initialized. Call getInstance(bot) first.');
    }
    return AlertCheckerService.instance;
  }

  /**
   * Запустить периодическую проверку оповещений
   */
  public startChecking(intervalMinutes: number = 5): void {
    if (this.isRunning) {
      console.log('⚠️ Проверка оповещений уже запущена');
      return;
    }

    console.log(`🔄 Запуск проверки оповещений каждые ${intervalMinutes} минут`);

    this.isRunning = true;
    this.intervalId = setInterval(
      async () => {
        await this.checkAlerts();
      },
      intervalMinutes * 60 * 1000,
    );

    // Запустить первую проверку сразу
    this.checkAlerts();
  }

  /**
   * Остановить периодическую проверку оповещений
   */
  public stopChecking(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('🛑 Проверка оповещений остановлена');
    }
  }

  /**
   * Проверить все активные оповещения
   */
  private async checkAlerts(): Promise<void> {
    try {
      console.log('🔍 Проверка активных оповещений...');

      const triggeredAlerts = await alertService.checkAllAlerts();

      if (triggeredAlerts.length === 0) {
        console.log('✅ Сработавших оповещений не найдено');
        return;
      }

      console.log(`🚨 Найдено ${triggeredAlerts.length} сработавших оповещений`);

      // Отправить уведомления и деактивировать оповещения
      for (const { alert, currentPrice } of triggeredAlerts) {
        try {
          // Отправить уведомление
          await this.notificationService.sendPriceAlertNotification(alert, currentPrice);

          // Деактивировать оповещение
          await alertService.deactivateAlert(alert.id);

          console.log(`✅ Оповещение ${alert.id} обработано для пользователя ${alert.user.chatId}`);
        } catch (error) {
          console.error(`❌ Ошибка при обработке оповещения ${alert.id}:`, error);
        }
      }

      console.log(`✅ Обработано ${triggeredAlerts.length} оповещений`);
    } catch (error) {
      console.error('❌ Ошибка при проверке оповещений:', error);
    }
  }

  /**
   * Запустить очистку старых оповещений
   */
  public startCleanup(intervalHours: number = 24): void {
    console.log(`🧹 Запуск очистки старых оповещений каждые ${intervalHours} часов`);

    setInterval(
      async () => {
        try {
          await alertService.cleanupOldAlerts();
          console.log('✅ Очистка старых оповещений завершена');
        } catch (error) {
          console.error('❌ Ошибка при очистке старых оповещений:', error);
        }
      },
      intervalHours * 60 * 60 * 1000,
    );

    // Запустить первую очистку через час
    setTimeout(
      async () => {
        try {
          await alertService.cleanupOldAlerts();
          console.log('✅ Первая очистка старых оповещений завершена');
        } catch (error) {
          console.error('❌ Ошибка при первой очистке старых оповещений:', error);
        }
      },
      60 * 60 * 1000,
    );
  }

  /**
   * Получить статус сервиса
   */
  public getStatus(): { isRunning: boolean; intervalMinutes?: number } {
    return {
      isRunning: this.isRunning,
      intervalMinutes: this.isRunning ? 5 : undefined,
    };
  }
}
