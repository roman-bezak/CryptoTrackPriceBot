import { databaseService } from '../../../core/database/database.service.js';

import type { User } from '@prisma/client';

export class UserService {
  private static instance: UserService;
  private prisma = databaseService.getClient();

  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Get all users
   */
  public async getAllUsers(): Promise<User[]> {
    return await this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find user by chat ID
   */
  public async findUserByChatId(chatId: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { chatId },
    });
  }

  /**
   * Create or update user
   */
  public async upsertUser(chatId: string): Promise<User> {
    return await this.prisma.user.upsert({
      where: { chatId },
      update: {},
      create: { chatId },
    });
  }
}

export const userService = UserService.getInstance();
