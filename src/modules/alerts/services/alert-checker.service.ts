import { CRYPTO_CONSTANTS } from '../../../shared/constants/index.js';
import { SystemMessages, ErrorMessages } from '../../../shared/messages/index.js';
import { NotificationService } from '../../common/services/notification.service.js';

import { alertService } from './alert.service.js';

import type { Telegraf } from 'telegraf';

export class AlertCheckerService {
  private static instance: AlertCheckerService;
  private intervalId: NodeJS.Timeout | null = null;
  private cleanupIntervalId: NodeJS.Timeout | null = null;
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
      throw new Error(ErrorMessages.ALERT_CHECKER_SERVICE_NOT_INITIALIZED);
    }
    return AlertCheckerService.instance;
  }

  /**
   * Start periodic alert checking
   */
  public startChecking(intervalMinutes: number = CRYPTO_CONSTANTS.DEFAULT_CHECK_INTERVAL_MINUTES): void {
    if (this.isRunning) {
      console.log(SystemMessages.ALERT_CHECKING_ALREADY_RUNNING);
      return;
    }

    console.log(SystemMessages.STARTING_ALERT_CHECKING(intervalMinutes));

    this.isRunning = true;
    this.intervalId = setInterval(
      async () => {
        await this.checkAlerts();
      },
      intervalMinutes * 60 * 1000,
    );

    // Run first check immediately
    this.checkAlerts();
  }

  /**
   * Stop periodic alert checking
   */
  public stopChecking(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log(SystemMessages.ALERT_CHECKING_STOPPED);
    }

    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }

  /**
   * Check all active alerts
   */
  private async checkAlerts(): Promise<void> {
    try {
      console.log(SystemMessages.CHECKING_ALERTS);

      const triggeredAlerts = await alertService.checkAllAlerts();

      if (triggeredAlerts.length === 0) {
        console.log(SystemMessages.NO_TRIGGERED_ALERTS);
        return;
      }

      console.log(SystemMessages.FOUND_TRIGGERED_ALERTS(triggeredAlerts.length));

      // Send notifications and deactivate alerts
      for (const { alert, currentPrice } of triggeredAlerts) {
        try {
          // Send notification
          await this.notificationService.sendPriceAlertNotification(alert, currentPrice);

          // Deactivate alert
          await alertService.deactivateAlert(alert.id);

          console.log(SystemMessages.ALERT_PROCESSED(alert.id, alert.user.chatId));
        } catch (error) {
          console.error(ErrorMessages.PROCESS_ALERT_FAILED(alert.id), error);
        }
      }

      console.log(SystemMessages.ALERTS_PROCESSED(triggeredAlerts.length));
    } catch (error) {
      console.error(ErrorMessages.CHECK_ALERTS_FAILED, error);
    }
  }

  /**
   * Start cleanup of old alerts
   */
  public startCleanup(intervalHours: number = CRYPTO_CONSTANTS.DEFAULT_CLEANUP_INTERVAL_HOURS): void {
    console.log(SystemMessages.STARTING_CLEANUP(intervalHours));

    this.cleanupIntervalId = setInterval(
      async () => {
        await this.performCleanup();
      },
      intervalHours * 60 * 60 * 1000,
    );

    // Run first cleanup after delay
    setTimeout(
      async () => {
        await this.performCleanup(true);
      },
      CRYPTO_CONSTANTS.FIRST_CLEANUP_DELAY_HOURS * 60 * 60 * 1000,
    );
  }

  /**
   * Perform cleanup of old alerts
   */
  private async performCleanup(isFirst = false): Promise<void> {
    try {
      await alertService.cleanupOldAlerts();
      console.log(isFirst ? SystemMessages.FIRST_CLEANUP_COMPLETED : SystemMessages.CLEANUP_COMPLETED);
    } catch (error) {
      console.error(isFirst ? ErrorMessages.FIRST_CLEANUP_FAILED : ErrorMessages.OLD_ALERTS_CLEANUP_FAILED, error);
    }
  }

  /**
   * Get service status
   */
  public getStatus(): { isRunning: boolean; intervalMinutes?: number } {
    return {
      isRunning: this.isRunning,
      intervalMinutes: this.isRunning ? CRYPTO_CONSTANTS.DEFAULT_CHECK_INTERVAL_MINUTES : undefined,
    };
  }
}
