export const CRYPTO_CONSTANTS = {
  // Supported cryptocurrencies mapping
  SYMBOL_TO_COIN_ID: {
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
  } as const,

  // Readable cryptocurrency names
  SYMBOL_TO_NAME: {
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
  } as const,

  // API configurations
  COINGECKO_BASE_URL: 'https://api.coingecko.com/api/v3',
  REQUEST_TIMEOUT: 10000, // 10 seconds

  // Price checking intervals
  DEFAULT_CHECK_INTERVAL_MINUTES: 5,
  DEFAULT_CLEANUP_INTERVAL_HOURS: 24,
  FIRST_CLEANUP_DELAY_HOURS: 1,

  // Data retention
  OLD_ALERTS_RETENTION_DAYS: 30,
} as const;

export type TSupportedSymbol = keyof typeof CRYPTO_CONSTANTS.SYMBOL_TO_COIN_ID;
export type TSupportedCoinId = (typeof CRYPTO_CONSTANTS.SYMBOL_TO_COIN_ID)[TSupportedSymbol];
