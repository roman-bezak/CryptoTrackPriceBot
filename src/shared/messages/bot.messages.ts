export const BotMessages = {
  WELCOME: `🤖 *Welcome to CryptoTrackPriceBot!* v1.0.0

💰 This bot helps you track cryptocurrency prices and receive notifications when target levels are reached.

📋 *Available commands:*

🎛️ *Interactive Menu:*
• /menu - Show interactive menu with buttons

🔔 *Alert management:*
• /setalert <symbol> <price> <condition> - Create alert
• /alerts - Show your alerts
• /deletealert <ID> - Delete alert
• /stats - Alert statistics

📊 *Information:*
• /price <symbol> - Current cryptocurrency price
• /symbols - List of supported cryptocurrencies
• /help - Show this help

💡 *Examples:*
• /setalert BTC 50000 above - Notify when Bitcoin is above $50,000
• /setalert ETH 3000 below - Notify when Ethereum is below $3,000
• /price BTC - Show current Bitcoin price

Use /help for more detailed information.`,

  HELP: `📚 *CryptoTrackPriceBot Command Guide*

🎛️ *Interactive Interface:*
Use /menu to access the interactive menu with buttons for easy navigation!

🔔 *Creating alerts:*
/setalert <symbol> <price> <condition>
Creates an alert for tracking cryptocurrency price.

*Parameters:*
• symbol - cryptocurrency code (BTC, ETH, BNB, etc.)
• price - target price in dollars
• condition - above or below

*Examples:*
• /setalert BTC 50000 above
• /setalert ETH 3000 below
• /setalert BNB 400 above

📝 *Alert management:*
• /alerts - Show all your active alerts
• /deletealert <ID> - Delete alert by ID
• /stats - Show your alert statistics

📊 *Price information:*
• /price <symbol> - Show current cryptocurrency price
• /symbols - List of all supported cryptocurrencies

💡 *How it works:*
1. Create an alert using /setalert
2. Bot will check prices every 5 minutes
3. When price reaches target level, you'll receive notification
4. Alert automatically disables after triggering

🔧 *Supported cryptocurrencies:*
Bitcoin (BTC), Ethereum (ETH), Binance Coin (BNB), Cardano (ADA), Solana (SOL), Ripple (XRP), Polkadot (DOT), Dogecoin (DOGE), Avalanche (AVAX), Polygon (MATIC)`,

  NO_USERS: '🙁 No users in database.',
  ERROR_FETCHING_USERS: '❌ Error fetching users from database.',

  USERS_LIST_HEADER: '👥 Users:\n\n',
  USER_INFO_TEMPLATE: (user: { id: number; chatId: string; createdAt: Date }) =>
    `ID: ${user.id}\nChat ID: ${user.chatId}\nCreated: ${user.createdAt.toISOString()}\n\n`,
} as const;
