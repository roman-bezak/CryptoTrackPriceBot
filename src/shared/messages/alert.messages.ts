export const AlertMessages = {
  // Validation errors
  INVALID_MESSAGE_TYPE: 'Invalid message type',
  INVALID_COMMAND_FORMAT:
    'Invalid command format. Use: /setalert <symbol> <price> <condition>\n\nExample: /setalert BTC 50000 above\n\nConditions: above or below',
  INVALID_PRICE: 'Invalid price. Price must be a positive number.',
  INVALID_CONDITION: 'Invalid condition. Use "above" or "below".',
  UNSUPPORTED_SYMBOL: (symbol: string) =>
    `Unsupported symbol "${symbol}". Use /symbols to view available cryptocurrencies.`,
  ALERT_ALREADY_EXISTS:
    '⚠️ *Alert already exists!*\n\nYou already have an identical alert for this cryptocurrency with the same price and condition.\n\nUse /alerts to view all your active alerts.',

  // Delete alert errors
  INVALID_DELETE_FORMAT: 'Invalid command format. Use: /deletealert <ID>\n\nID can be found in alerts list (/alerts)',
  INVALID_ALERT_ID: 'Invalid alert ID. ID must be a positive number.',
  ALERT_NOT_FOUND: 'Alert with this ID not found or does not belong to you.',

  // Price command errors
  INVALID_PRICE_FORMAT: 'Invalid command format. Use: /price <symbol>\n\nExample: /price BTC',
  PRICE_FETCH_FAILED: (symbol: string) =>
    `Failed to get price for "${symbol}". Check symbol correctness or try again later.`,

  // Generic errors
  CREATE_ALERT_ERROR: 'An error occurred while creating alert. Try again later.',
  FETCH_ALERTS_ERROR: 'An error occurred while fetching alerts. Try again later.',
  DELETE_ALERT_ERROR: 'An error occurred while deleting alert. Try again later.',
  FETCH_STATS_ERROR: 'An error occurred while fetching statistics. Try again later.',
  FETCH_SYMBOLS_ERROR: 'An error occurred while fetching symbols list. Try again later.',
  FETCH_PRICE_ERROR: 'An error occurred while fetching price. Try again later.',

  // Success messages
  ALERT_CREATED: (coinName: string, symbol: string, targetPrice: number, condition: 'above' | 'below') => {
    const conditionText = condition === 'above' ? 'above' : 'below';
    return `✅ *Alert created!*

💰 *${coinName} (${symbol})*
🎯 Notification when price is ${conditionText} $${targetPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Use /alerts to view all your alerts.`;
  },

  ALERT_DELETED: (alertId: number) => `✅ Alert with ID \`${alertId}\` successfully deleted.`,

  NO_ACTIVE_ALERTS: '📝 You have no active alerts yet.\n\nUse /setalert to create a new alert.',

  ALERTS_LIST_HEADER: '📝 *Your active alerts:*\n\n',
  ALERT_ITEM: (
    coinName: string,
    symbol: string,
    condition: 'above' | 'below',
    targetPrice: number,
    createdAt: Date,
    id: number,
  ) => {
    const conditionText = condition === 'above' ? 'above' : 'below';
    const date = new Date(createdAt).toLocaleDateString('ru-RU');

    return `💰 *${coinName} (${symbol})*
🎯 ${conditionText} $${targetPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
📅 Created: ${date}
🆔 ID: \`${id}\`

`;
  },
  ALERTS_LIST_FOOTER: 'To delete an alert use /deletealert <ID>',

  // Statistics
  STATS_MESSAGE: (stats: { total: number; active: number; triggered: number }) => `📊 *Your alert statistics:*

📝 Total created: ${stats.total}
✅ Active: ${stats.active}
🚨 Triggered: ${stats.triggered}`,

  // Price alert notification
  PRICE_ALERT_TRIGGERED: (
    coinName: string,
    symbol: string,
    currentPrice: number,
    targetPrice: number,
    condition: 'above' | 'below',
    change24h: number,
    lastUpdated: Date,
  ) => {
    const conditionText = condition === 'above' ? 'above' : 'below';
    const changeEmoji = change24h >= 0 ? '📈' : '📉';
    const changeText = change24h >= 0 ? '+' : '';

    return `🚨 *Price alert triggered!*

💰 *${coinName} (${symbol})*
💵 Current price: $${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
🎯 Target price: $${targetPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${conditionText})
${changeEmoji} 24h Change: ${changeText}${change24h.toFixed(2)}%
🕐 Updated: ${lastUpdated.toLocaleString('ru-RU')}

✅ Alert automatically disabled.`;
  },

  // Price information
  PRICE_INFO: (coinName: string, symbol: string, price: number, change24h: number, lastUpdated: Date) => {
    const changeEmoji = change24h >= 0 ? '📈' : '📉';
    const changeText = change24h >= 0 ? '+' : '';

    return `💰 *${coinName} (${symbol})*

💵 Price: $${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
${changeEmoji} 24h Change: ${changeText}${change24h.toFixed(2)}%
🕐 Updated: ${lastUpdated.toLocaleString('ru-RU')}`;
  },

  // Supported symbols
  SUPPORTED_SYMBOLS_HEADER: '💰 *Supported cryptocurrencies:*\n\n',
  SYMBOL_ITEM: (coinName: string, symbol: string) => `• ${coinName} (${symbol})\n`,
  SUPPORTED_SYMBOLS_FOOTER: '\nUse the currency symbol when creating alerts.',
} as const;
