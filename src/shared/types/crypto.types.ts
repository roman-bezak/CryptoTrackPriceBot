export interface ICryptoPrice {
  symbol: string;
  price: number;
  change24h: number;
  lastUpdated: Date;
}

export interface ITriggeredAlert {
  alert: import('./alert.types.js').IAlertWithUser;
  currentPrice: ICryptoPrice;
}
