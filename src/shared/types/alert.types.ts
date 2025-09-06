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

export interface IAlertStats {
  total: number;
  active: number;
  triggered: number;
}

export type TAlertCondition = 'above' | 'below';
