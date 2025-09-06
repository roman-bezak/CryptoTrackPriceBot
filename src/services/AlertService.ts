import { PrismaClient } from '@prisma/client';

import { cryptoPriceService } from './CryptoPriceService.js';

import type { ICryptoPrice } from './CryptoPriceService.js';
import type { PriceAlert, User } from '@prisma/client';

export interface ICreateAlertData {
  chatId: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
}

export interface IAlertWithUser extends PriceAlert {
  user: User;
}

export class AlertService {
  private static instance: AlertService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

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
    return await this.prisma.priceAlert.create({
      data: {
        userId: user.id,
        symbol: data.symbol.toUpperCase(),
        targetPrice: data.targetPrice,
        condition: data.condition,
        isActive: true,
      },
    });
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
  public async checkAllAlerts(): Promise<Array<{ alert: IAlertWithUser; currentPrice: ICryptoPrice }>> {
    const alerts = await this.getAllActiveAlerts();
    const triggeredAlerts: Array<{ alert: IAlertWithUser; currentPrice: ICryptoPrice }> = [];

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
  public async getUserAlertStats(chatId: string): Promise<{
    total: number;
    active: number;
    triggered: number;
  }> {
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
   * Clean up old triggered alerts (older than 30 days)
   */
  public async cleanupOldAlerts(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await this.prisma.priceAlert.deleteMany({
      where: {
        triggeredAt: {
          not: null,
          lt: thirtyDaysAgo,
        },
      },
    });
  }
}

export const alertService = AlertService.getInstance();
