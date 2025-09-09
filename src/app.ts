import { Telegraf } from 'telegraf';

import { config } from './core/config/config.service.js';
import { databaseService } from './core/database/database.service.js';
import { AlertHandlers, AlertCheckerService } from './modules/alerts/index.js';
import { BotHandlers, NotificationService, InlineKeyboardHandlers } from './modules/common/index.js';
import { PriceHandlers } from './modules/prices/index.js';
import { UserHandlers } from './modules/users/index.js';
import { SystemMessages, ErrorMessages } from './shared/messages/index.js';

export class CryptoTrackPriceBotApp {
  private bot: Telegraf;
  private notificationService: NotificationService;
  private alertCheckerService: AlertCheckerService;

  // Handlers
  private alertHandlers: AlertHandlers;
  private priceHandlers: PriceHandlers;
  private userHandlers: UserHandlers;
  private botHandlers: BotHandlers;
  private inlineKeyboardHandlers: InlineKeyboardHandlers;

  constructor() {
    // Initialize bot
    this.bot = new Telegraf(config.get('BOT_TOKEN'));

    // Initialize services
    this.notificationService = NotificationService.getInstance(this.bot);
    this.alertCheckerService = AlertCheckerService.getInstance(this.bot);

    // Initialize handlers
    this.alertHandlers = new AlertHandlers(this.notificationService);
    this.priceHandlers = new PriceHandlers(this.notificationService);
    this.userHandlers = new UserHandlers();
    this.botHandlers = new BotHandlers();
    this.inlineKeyboardHandlers = new InlineKeyboardHandlers(this.notificationService);

    this.setupCommands();
    this.setupErrorHandlers();
  }

  private setupCommands(): void {
    // Basic bot commands
    this.bot.start(ctx => this.botHandlers.handleStart(ctx));
    this.bot.help(ctx => this.botHandlers.handleHelp(ctx));
    this.bot.command('menu', ctx => this.botHandlers.handleMenu(ctx));

    // Alert commands
    this.bot.command('setalert', ctx => this.alertHandlers.handleSetAlert(ctx));
    this.bot.command('alerts', ctx => this.alertHandlers.handleGetAlerts(ctx));
    this.bot.command('deletealert', ctx => this.alertHandlers.handleDeleteAlert(ctx));
    this.bot.command('stats', ctx => this.alertHandlers.handleGetStats(ctx));

    // Price commands
    this.bot.command('price', ctx => this.priceHandlers.handleGetPrice(ctx));
    this.bot.command('symbols', ctx => this.priceHandlers.handleGetSymbols(ctx));

    // Admin commands
    this.bot.command('users', ctx => this.userHandlers.handleGetUsers(ctx));

    // Inline keyboard handlers
    this.bot.on('callback_query', ctx => this.inlineKeyboardHandlers.handleCallbackQuery(ctx));

    // Text message handler for alert creation
    this.bot.on('text', ctx => this.inlineKeyboardHandlers.handleAlertCreationText(ctx));
  }

  private setupErrorHandlers(): void {
    // Runtime error handler
    this.bot.catch((err, ctx) => {
      console.error(ErrorMessages.UPDATE_TYPE_ERROR(ctx.updateType), err);
    });

    // Global error handlers
    process.on('uncaughtException', error => {
      console.error(ErrorMessages.UNCAUGHT_EXCEPTION, error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error(ErrorMessages.UNHANDLED_REJECTION, promise, 'reason:', reason);
    });
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = (signal: string) => {
      console.log(SystemMessages.GRACEFUL_SHUTDOWN(signal));

      // Stop alert checking service
      this.alertCheckerService.stopChecking();
      console.log(SystemMessages.ALERT_CHECKING_SERVICE_STOPPED);

      // Stop bot
      this.bot.stop(signal);
      console.log(SystemMessages.BOT_STOPPED);

      // Close database connection
      databaseService.disconnect();
      console.log(SystemMessages.DATABASE_CLOSED);

      process.exit(0);
    };

    process.once('SIGINT', () => gracefulShutdown('SIGINT'));
    process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
  }

  public async start(): Promise<void> {
    try {
      // Log startup info
      console.log(SystemMessages.NODE_ENV(config.get('NODE_ENV')));
      console.log(SystemMessages.STARTING_BOT);

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      // Launch bot with callback
      this.bot.launch({ dropPendingUpdates: true }, () => {
        console.log('✅ Bot successfully launched!');

        // Start alert checking service
        this.alertCheckerService.startChecking();
        this.alertCheckerService.startCleanup();
        console.log(SystemMessages.ALERT_CHECKING_STARTED);
      });
    } catch (error) {
      console.error(ErrorMessages.BOT_LAUNCH_FAILED, error);
      process.exit(1);
    }
  }
}
