# 🚀 CryptoTrackPriceBot

Telegram bot for tracking cryptocurrency prices and managing price alerts.

## ✨ Features

- **Price Alerts** - Get notified when crypto prices reach your target levels
- **Real-time Prices** - Check current cryptocurrency prices with 24h change
- **Multiple Cryptos** - Support for 10 major cryptocurrencies (BTC, ETH, BNB, ADA, SOL, XRP, DOT, DOGE, AVAX, MATIC)
- **Easy Management** - Simple commands to create, view, and delete alerts
- **Auto Monitoring** - Background price checking every 5 minutes

## 🤖 Bot Commands

| Command                                    | Description                     | Example                     |
| ------------------------------------------ | ------------------------------- | --------------------------- |
| `/start`                                   | Welcome message and overview    | `/start`                    |
| `/help`                                    | Show all available commands     | `/help`                     |
| `/price <symbol>`                          | Get current price               | `/price BTC`                |
| `/symbols`                                 | List supported cryptocurrencies | `/symbols`                  |
| `/setalert <symbol> <price> <above/below>` | Create price alert              | `/setalert BTC 50000 above` |
| `/alerts`                                  | View your active alerts         | `/alerts`                   |
| `/deletealert <id>`                        | Delete specific alert           | `/deletealert 1`            |
| `/stats`                                   | Show your alert statistics      | `/stats`                    |

## 🛠️ Installation

### Prerequisites

- Node.js >= 20.0.0
- npm >= 9.0.0

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/roman-bezak/CryptoTrackPriceBot.git
   cd CryptoTrackPriceBot
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment**

   ```bash
   cp env.example .env
   ```

   Edit `.env` and add your Telegram bot token:

   ```
   BOT_TOKEN=your-telegram-bot-token
   DATABASE_URL=file:./db/bot.db
   ```

4. **Setup database**

   ```bash
   npx prisma migrate deploy
   ```

5. **Build and start**
   ```bash
   npm run build
   npm run start:prod
   ```

### 🐳 Docker

Run with Docker Compose:

```bash
docker-compose up -d
```

## 📋 Environment Variables

| Variable       | Description            | Required | Default            |
| -------------- | ---------------------- | -------- | ------------------ |
| `BOT_TOKEN`    | Telegram Bot API token | ✅       | -                  |
| `DATABASE_URL` | SQLite database path   | ❌       | `file:./db/bot.db` |
| `NODE_ENV`     | Environment mode       | ❌       | `production`       |

## 🔧 Development

### Scripts

- `npm run build` - Build the project
- `npm run start:dev` - Start in development mode
- `npm run start:prod` - Start in production mode
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run precheck` - Run all checks (format, lint, type-check)

### Project Structure

```
src/
├── config/          # Configuration service
├── handlers/        # Telegram command handlers
├── services/        # Business logic services
└── main.ts          # Application entry point
```

## 💡 Usage Examples

### Setting Price Alerts

```
/setalert BTC 45000 below    # Alert when Bitcoin drops below $45,000
/setalert ETH 3000 above     # Alert when Ethereum rises above $3,000
```

### Checking Prices

```
/price BTC              # Get Bitcoin current price
/price ETH              # Get Ethereum current price
```

## 🔒 Getting Bot Token

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Create a new bot with `/newbot`
3. Follow the instructions to get your bot token
4. Add the token to your `.env` file

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📊 Supported Cryptocurrencies

| Symbol | Name         |
| ------ | ------------ |
| BTC    | Bitcoin      |
| ETH    | Ethereum     |
| BNB    | Binance Coin |
| ADA    | Cardano      |
| SOL    | Solana       |
| XRP    | Ripple       |
| DOT    | Polkadot     |
| DOGE   | Dogecoin     |
| AVAX   | Avalanche    |
| MATIC  | Polygon      |
