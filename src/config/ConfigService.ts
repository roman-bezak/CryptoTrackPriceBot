import * as path from 'path';

import * as dotenv from 'dotenv';

interface IAppConfig {
  DATABASE_URL: string;
  NODE_ENV: string;
  BOT_TOKEN: string;
}

export class ConfigService {
  private static instance: ConfigService;
  private config: IAppConfig;

  private constructor() {
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
    this.config = this.loadConfig();
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private loadConfig(): IAppConfig {
    return {
      DATABASE_URL: process.env.DATABASE_URL || '',
      NODE_ENV: process.env.NODE_ENV || 'development',
      BOT_TOKEN: process.env.BOT_TOKEN || '',
    };
  }

  public get(key: keyof IAppConfig): IAppConfig[keyof IAppConfig] {
    const value = this.config[key];
    if (value === undefined) {
      throw new Error(`Config key '${key}' not found`);
    }
    return value;
  }

  public getWithDefault(
    key: keyof IAppConfig,
    defaultValue: IAppConfig[keyof IAppConfig],
  ): IAppConfig[keyof IAppConfig] {
    try {
      return this.get(key);
    } catch {
      return defaultValue;
    }
  }

  public isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }
}

export const config = ConfigService.getInstance();
