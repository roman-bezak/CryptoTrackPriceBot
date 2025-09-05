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
   * Start periodic alert checking
   */
  public startChecking(intervalMinutes: number = 5): void {
    if (this.isRunning) {
      console.log('⚠️ Alert checking is already running');
      return;
    }

    console.log(`🔄 Starting alert checking every ${intervalMinutes} minutes`);

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
      console.log('🛑 Alert checking stopped');
    }
  }

  /**
   * Check all active alerts
   */
  private async checkAlerts(): Promise<void> {
    try {
      console.log('🔍 Checking active alerts...');

      const triggeredAlerts = await alertService.checkAllAlerts();

      if (triggeredAlerts.length === 0) {
        console.log('✅ No triggered alerts found');
        return;
      }

      console.log(`🚨 Found ${triggeredAlerts.length} triggered alerts`);

      // Send notifications and deactivate alerts
      for (const { alert, currentPrice } of triggeredAlerts) {
        try {
          // Send notification
          await this.notificationService.sendPriceAlertNotification(alert, currentPrice);

          // Deactivate alert
          await alertService.deactivateAlert(alert.id);

          console.log(`✅ Alert ${alert.id} processed for user ${alert.user.chatId}`);
        } catch (error) {
          console.error(`❌ Error processing alert ${alert.id}:`, error);
        }
      }

      console.log(`✅ Processed ${triggeredAlerts.length} alerts`);
    } catch (error) {
      console.error('❌ Error checking alerts:', error);
    }
  }

  /**
   * Start cleanup of old alerts
   */
  public startCleanup(intervalHours: number = 24): void {
    console.log(`🧹 Starting cleanup of old alerts every ${intervalHours} hours`);

    setInterval(
      async () => {
        try {
          await alertService.cleanupOldAlerts();
          console.log('✅ Old alerts cleanup completed');
        } catch (error) {
          console.error('❌ Error during old alerts cleanup:', error);
        }
      },
      intervalHours * 60 * 60 * 1000,
    );

    // Run first cleanup in one hour
    setTimeout(
      async () => {
        try {
          await alertService.cleanupOldAlerts();
          console.log('✅ First old alerts cleanup completed');
        } catch (error) {
          console.error('❌ Error during first old alerts cleanup:', error);
        }
      },
      60 * 60 * 1000,
    );
  }

  /**
   * Get service status
   */
  public getStatus(): { isRunning: boolean; intervalMinutes?: number } {
    return {
      isRunning: this.isRunning,
      intervalMinutes: this.isRunning ? 5 : undefined,
    };
  }
}
