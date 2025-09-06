import { databaseService } from '../../../core/database/database.service.js';
import { CRYPTO_CONSTANTS } from '../../../shared/constants/index.js';
import { cryptoPriceService } from '../../prices/services/crypto-price.service.js';

import type { ICreateAlertData, IAlertWithUser, IAlertStats, ITriggeredAlert } from '../../../shared/types/index.js';
import type { PriceAlert } from '@prisma/client';

export class AlertService {
  private static instance: AlertService;
  private prisma = databaseService.getClient();

  private constructor() {}

  public static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  /**
   * Create new alert
   */
  public async createAlert(data: ICreateAlertData): Promise<PriceAlert> {
    // Find or create user
    const user = await this.prisma.user.upsert({
      where: { chatId: data.chatId },
      update: {},
      create: { chatId: data.chatId },
    });

    // Check if such alert already exists
    const existingAlert = await this.prisma.priceAlert.findFirst({
      where: {
        userId: user.id,
        symbol: data.symbol.toUpperCase(),
        targetPrice: data.targetPrice,
        condition: data.condition,
        isActive: true,
      },
    });

    if (existingAlert) {
      throw new Error('Such alert already exists');
    }

    // Create new alert
    try {
      return await this.prisma.priceAlert.create({
        data: {
          userId: user.id,
          symbol: data.symbol.toUpperCase(),
          targetPrice: data.targetPrice,
          condition: data.condition,
          isActive: true,
        },
      });
    } catch (error) {
      // Handle Prisma unique constraint errors
      if (error instanceof Error) {
        const prismaError = error as Error & { code?: string };
        if (
          error.message.includes('Unique constraint failed') ||
          error.message.includes('UNIQUE constraint failed') ||
          prismaError.code === 'P2002'
        ) {
          throw new Error('Such alert already exists');
        }
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Get all active user alerts
   */
  public async getUserAlerts(chatId: string): Promise<PriceAlert[]> {
    const user = await this.prisma.user.findUnique({
      where: { chatId },
    });

    if (!user) {
      return [];
    }

    return await this.prisma.priceAlert.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get all active alerts
   */
  public async getAllActiveAlerts(): Promise<IAlertWithUser[]> {
    return await this.prisma.priceAlert.findMany({
      where: {
        isActive: true,
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Delete alert
   */
  public async deleteAlert(chatId: string, alertId: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { chatId },
    });

    if (!user) {
      return false;
    }

    const result = await this.prisma.priceAlert.deleteMany({
      where: {
        id: alertId,
        userId: user.id,
      },
    });

    return result.count > 0;
  }

  /**
   * Deactivate alert
   */
  public async deactivateAlert(alertId: number): Promise<void> {
    await this.prisma.priceAlert.update({
      where: { id: alertId },
      data: {
        isActive: false,
        triggeredAt: new Date(),
      },
    });
  }

  /**
   * Check all active alerts
   */
  public async checkAllAlerts(): Promise<ITriggeredAlert[]> {
    const alerts = await this.getAllActiveAlerts();
    const triggeredAlerts: ITriggeredAlert[] = [];

    // Group alerts by symbols for request optimization
    const symbolGroups = new Map<string, IAlertWithUser[]>();
    for (const alert of alerts) {
      const symbol = alert.symbol;
      if (!symbolGroups.has(symbol)) {
        symbolGroups.set(symbol, []);
      }
      symbolGroups.get(symbol)!.push(alert);
    }

    // Check each group
    for (const [symbol, symbolAlerts] of symbolGroups) {
      const currentPrice = await cryptoPriceService.getPrice(symbol);

      if (!currentPrice) {
        continue;
      }

      for (const alert of symbolAlerts) {
        const isTriggered = cryptoPriceService.checkPriceAlert(
          currentPrice.price,
          alert.targetPrice,
          alert.condition as 'above' | 'below',
        );

        if (isTriggered) {
          triggeredAlerts.push({ alert, currentPrice });
        }
      }
    }

    return triggeredAlerts;
  }

  /**
   * Get user alert statistics
   */
  public async getUserAlertStats(chatId: string): Promise<IAlertStats> {
    const user = await this.prisma.user.findUnique({
      where: { chatId },
    });

    if (!user) {
      return { total: 0, active: 0, triggered: 0 };
    }

    const [total, active, triggered] = await Promise.all([
      this.prisma.priceAlert.count({
        where: { userId: user.id },
      }),
      this.prisma.priceAlert.count({
        where: { userId: user.id, isActive: true },
      }),
      this.prisma.priceAlert.count({
        where: { userId: user.id, triggeredAt: { not: null } },
      }),
    ]);

    return { total, active, triggered };
  }

  /**
   * Clean up old triggered alerts
   */
  public async cleanupOldAlerts(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CRYPTO_CONSTANTS.OLD_ALERTS_RETENTION_DAYS);

    await this.prisma.priceAlert.deleteMany({
      where: {
        triggeredAt: {
          not: null,
          lt: cutoffDate,
        },
      },
    });
  }
}

export const alertService = AlertService.getInstance();
