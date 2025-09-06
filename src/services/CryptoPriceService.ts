import axios from 'axios';

export interface ICryptoPrice {
  symbol: string;
  price: number;
  change24h: number;
  lastUpdated: Date;
}

export class CryptoPriceService {
  private static instance: CryptoPriceService;
  private readonly baseUrl = 'https://api.coingecko.com/api/v3';

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
      const response = await axios.get(`${this.baseUrl}/simple/price`, {
        params: {
          ids: this.getCoinId(symbol),
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_last_updated_at: true,
        },
        timeout: 10000,
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
      console.error(`Error getting price for ${symbol}:`, error);
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
    return [
      'bitcoin',
      'ethereum',
      'binancecoin',
      'cardano',
      'solana',
      'ripple',
      'polkadot',
      'dogecoin',
      'avalanche-2',
      'polygon',
    ];
  }

  /**
   * Convert symbol to ID for CoinGecko API
   */
  public getCoinId(symbol: string): string {
    const symbolMap: Record<string, string> = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      BNB: 'binancecoin',
      ADA: 'cardano',
      SOL: 'solana',
      XRP: 'ripple',
      DOT: 'polkadot',
      DOGE: 'dogecoin',
      AVAX: 'avalanche-2',
      MATIC: 'polygon',
    };

    return symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  /**
   * Get readable cryptocurrency name
   */
  public getCoinName(symbol: string): string {
    const nameMap: Record<string, string> = {
      BTC: 'Bitcoin',
      ETH: 'Ethereum',
      BNB: 'Binance Coin',
      ADA: 'Cardano',
      SOL: 'Solana',
      XRP: 'Ripple',
      DOT: 'Polkadot',
      DOGE: 'Dogecoin',
      AVAX: 'Avalanche',
      MATIC: 'Polygon',
    };

    return nameMap[symbol.toUpperCase()] || symbol.toUpperCase();
  }
}

export const cryptoPriceService = CryptoPriceService.getInstance();
