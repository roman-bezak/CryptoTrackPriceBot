import axios from 'axios';

import { CRYPTO_CONSTANTS, type TSupportedSymbol } from '../../../shared/constants/index.js';
import { ErrorMessages } from '../../../shared/messages/index.js';

import type { ICryptoPrice } from '../../../shared/types/index.js';

export class CryptoPriceService {
  private static instance: CryptoPriceService;

  private constructor() {}

  public static getInstance(): CryptoPriceService {
    if (!CryptoPriceService.instance) {
      CryptoPriceService.instance = new CryptoPriceService();
    }
    return CryptoPriceService.instance;
  }

  /**
   * Get current cryptocurrency price
   */
  public async getPrice(symbol: string): Promise<ICryptoPrice | null> {
    try {
      const response = await axios.get(`${CRYPTO_CONSTANTS.COINGECKO_BASE_URL}/simple/price`, {
        params: {
          ids: this.getCoinId(symbol),
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_last_updated_at: true,
        },
        timeout: CRYPTO_CONSTANTS.REQUEST_TIMEOUT,
      });

      const coinId = this.getCoinId(symbol);
      const data = response.data[coinId];

      if (!data) {
        return null;
      }

      return {
        symbol: symbol.toUpperCase(),
        price: data.usd,
        change24h: data.usd_24h_change || 0,
        lastUpdated: new Date(data.last_updated_at * 1000),
      };
    } catch (error) {
      console.error(ErrorMessages.PRICE_FETCH_FAILED(symbol), error);
      return null;
    }
  }

  /**
   * Get prices for multiple cryptocurrencies
   */
  public async getPrices(symbols: string[]): Promise<ICryptoPrice[]> {
    const prices: ICryptoPrice[] = [];

    for (const symbol of symbols) {
      const price = await this.getPrice(symbol);
      if (price) {
        prices.push(price);
      }
    }

    return prices;
  }

  /**
   * Check if price has reached target level
   */
  public checkPriceAlert(currentPrice: number, targetPrice: number, condition: 'above' | 'below'): boolean {
    if (condition === 'above') {
      return currentPrice >= targetPrice;
    } else {
      return currentPrice <= targetPrice;
    }
  }

  /**
   * Get list of supported cryptocurrencies
   */
  public getSupportedSymbols(): string[] {
    return Object.values(CRYPTO_CONSTANTS.SYMBOL_TO_COIN_ID);
  }

  /**
   * Convert symbol to ID for CoinGecko API
   */
  public getCoinId(symbol: string): string {
    const upperSymbol = symbol.toUpperCase() as TSupportedSymbol;
    return CRYPTO_CONSTANTS.SYMBOL_TO_COIN_ID[upperSymbol] || symbol.toLowerCase();
  }

  /**
   * Get readable cryptocurrency name
   */
  public getCoinName(symbol: string): string {
    const upperSymbol = symbol.toUpperCase() as TSupportedSymbol;
    return CRYPTO_CONSTANTS.SYMBOL_TO_NAME[upperSymbol] || symbol.toUpperCase();
  }
}

export const cryptoPriceService = CryptoPriceService.getInstance();
