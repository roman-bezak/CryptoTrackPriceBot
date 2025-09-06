# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Interactive Interface Features

- **Inline Keyboard Support**: Complete implementation of interactive buttons interface
- **Main Menu**: Interactive navigation with buttons for all bot functions
- **Price Quick Access**: One-click price checking for all supported cryptocurrencies
- **Interactive Alert Creation**: Step-by-step alert creation process with buttons
- **Alert Management Interface**: View and delete alerts through interactive menus
- **Command `/menu`**: New command to access interactive interface anytime
- **Enhanced User Experience**: Seamless navigation between different bot functions
- **State Management**: Persistent state handling for multi-step operations
- **Pagination Support**: Smart pagination for long lists of items
- **Responsive Design**: Optimized button layouts for better usability

#### Technical Improvements

- **TypeScript Types**: Comprehensive type definitions for inline keyboard components
- **Service Architecture**: Dedicated `InlineKeyboardService` for state management
- **Handler System**: Specialized `InlineKeyboardHandlers` for callback processing
- **Constants Management**: Centralized keyboard layouts and button configurations
- **Error Handling**: Robust error handling for interactive operations
- **Integration**: Seamless integration with existing command-based interface

## [1.0.0] - 2024-08-26

### Added

#### Core Features

- Price alerts system with flexible conditions (above/below thresholds)
- Real-time cryptocurrency price tracking with 24-hour change data
- Automated background monitoring (checks prices every 5 minutes)
- Support for 10 major cryptocurrencies: BTC, ETH, BNB, ADA, SOL, XRP, DOT, DOGE, AVAX, MATIC

#### Bot Commands

- `/start` - Welcome message and bot overview
- `/help` - Command guide and usage examples
- `/setalert <symbol> <price> <condition>` - Create price alerts
- `/alerts` - View all active alerts
- `/deletealert <id>` - Remove specific alerts
- `/stats` - Display alert statistics
- `/price <symbol>` - Get current cryptocurrency price
- `/symbols` - List supported cryptocurrencies
- `/users` - Admin command for user management

#### Alert Management

- Duplicate alert prevention
- Automatic alert cleanup after triggering
- User-specific alert isolation
- Persistent storage with SQLite database

#### Technical Features

- TypeScript implementation with strict type safety
- Telegraf framework for Telegram Bot API
- Prisma ORM for database operations
- Docker support with multi-stage builds
- Comprehensive error handling and logging
- Graceful shutdown and auto-recovery
- Rate limiting protection

#### Development Tools

- ESLint and Prettier for code quality
- Automated database migrations
- NPM scripts for build and deployment
- Health checks and monitoring

### Security

- Environment-based configuration management
- Input validation for all user commands
- Protection against API abuse

### Performance

- Response time under 2 seconds for all commands
- Near real-time alert notifications (under 30 seconds)
- Scalable architecture supporting unlimited users within API limits
