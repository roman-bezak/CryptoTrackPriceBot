import axios, { isAxiosError } from 'axios';

import { CRYPTO_CONSTANTS, type TSupportedSymbol } from '../../../shared/constants/index.js';
import { ErrorMessages } from '../../../shared/messages/index.js';

import type { ICryptoPrice } from '../../../shared/types/index.js';

export class CryptoPriceService {
  private static instance: CryptoPriceService;
  private priceCache = new Map<string, { price: ICryptoPrice; timestamp: number }>();
  private readonly CACHE_DURATION_MS = 60 * 1000; // 1 minute cache
  private readonly REQUEST_DELAY_MS = 1000; // 1 second delay between requests

  private constructor() {}

  public static getInstance(): CryptoPriceService {
    if (!CryptoPriceService.instance) {
      CryptoPriceService.instance = new CryptoPriceService();
    }
    return CryptoPriceService.instance;
  }

  /**
   * Get current cryptocurrency price with caching and rate limiting
   */
  public async getPrice(symbol: string): Promise<ICryptoPrice | null> {
    const upperSymbol = symbol.toUpperCase();

    // Check cache first
    const cached = this.priceCache.get(upperSymbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION_MS) {
      console.log(`📦 Using cached price for ${upperSymbol}`);
      return cached.price;
    }

    try {
      // Add delay to avoid rate limiting
      await this.delay(this.REQUEST_DELAY_MS);

      console.log(`🌐 Fetching fresh price for ${upperSymbol}`);
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

      const priceData: ICryptoPrice = {
        symbol: upperSymbol,
        price: data.usd,
        change24h: data.usd_24h_change || 0,
        lastUpdated: new Date(data.last_updated_at * 1000),
      };

      // Cache the result
      this.priceCache.set(upperSymbol, {
        price: priceData,
        timestamp: Date.now(),
      });

      return priceData;
    } catch (error) {
      // Handle rate limiting specifically
      if (isAxiosError(error) && error.response?.status === 429) {
        console.warn(`⚠️ Rate limited for ${upperSymbol}, using cached data if available`);

        // Return cached data even if slightly stale
        if (cached) {
          console.log(`📦 Using stale cached price for ${upperSymbol}`);
          return cached.price;
        }

        // If no cache and rate limited, wait longer and retry once
        console.log(`⏳ Waiting 30 seconds before retry for ${upperSymbol}`);
        await this.delay(30000);

        try {
          const retryResponse = await axios.get(`${CRYPTO_CONSTANTS.COINGECKO_BASE_URL}/simple/price`, {
            params: {
              ids: this.getCoinId(symbol),
              vs_currencies: 'usd',
              include_24hr_change: true,
              include_last_updated_at: true,
            },
            timeout: CRYPTO_CONSTANTS.REQUEST_TIMEOUT,
          });

          const coinId = this.getCoinId(symbol);
          const retryData = retryResponse.data[coinId];

          if (retryData) {
            const priceData: ICryptoPrice = {
              symbol: upperSymbol,
              price: retryData.usd,
              change24h: retryData.usd_24h_change || 0,
              lastUpdated: new Date(retryData.last_updated_at * 1000),
            };

            this.priceCache.set(upperSymbol, {
              price: priceData,
              timestamp: Date.now(),
            });

            return priceData;
          }
        } catch (retryError) {
          console.error(`❌ Retry failed for ${upperSymbol}:`, retryError);
        }
      }

      console.error(ErrorMessages.PRICE_FETCH_FAILED(symbol), error);
      return null;
    }
  }

  /**
   * Add delay to prevent rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get prices for multiple cryptocurrencies using batch request
   */
  public async getPrices(symbols: string[]): Promise<ICryptoPrice[]> {
    const prices: ICryptoPrice[] = [];
    const uncachedSymbols: string[] = [];

    // Check cache for all symbols first
    for (const symbol of symbols) {
      const upperSymbol = symbol.toUpperCase();
      const cached = this.priceCache.get(upperSymbol);

      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION_MS) {
        console.log(`📦 Using cached price for ${upperSymbol}`);
        prices.push(cached.price);
      } else {
        uncachedSymbols.push(symbol);
      }
    }

    if (uncachedSymbols.length === 0) {
      return prices;
    }

    // Batch request for uncached symbols
    try {
      await this.delay(this.REQUEST_DELAY_MS);

      const coinIds = uncachedSymbols.map(symbol => this.getCoinId(symbol)).join(',');
      console.log(`🌐 Fetching batch prices for: ${uncachedSymbols.join(', ')}`);

      const response = await axios.get(`${CRYPTO_CONSTANTS.COINGECKO_BASE_URL}/simple/price`, {
        params: {
          ids: coinIds,
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_last_updated_at: true,
        },
        timeout: CRYPTO_CONSTANTS.REQUEST_TIMEOUT,
      });

      // Process batch response
      for (const symbol of uncachedSymbols) {
        const upperSymbol = symbol.toUpperCase();
        const coinId = this.getCoinId(symbol);
        const data = response.data[coinId];

        if (data) {
          const priceData: ICryptoPrice = {
            symbol: upperSymbol,
            price: data.usd,
            change24h: data.usd_24h_change || 0,
            lastUpdated: new Date(data.last_updated_at * 1000),
          };

          // Cache the result
          this.priceCache.set(upperSymbol, {
            price: priceData,
            timestamp: Date.now(),
          });

          prices.push(priceData);
        }
      }
    } catch (error) {
      console.error('Error fetching batch prices:', error);

      // Fallback to individual requests with longer delays if batch fails
      for (const symbol of uncachedSymbols) {
        const price = await this.getPrice(symbol);
        if (price) {
          prices.push(price);
        }
        // Add extra delay between individual requests
        await this.delay(this.REQUEST_DELAY_MS * 2);
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
