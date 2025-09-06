import { BotMessages, AlertMessages } from '../../../shared/messages/index.js';
import { alertService } from '../../alerts/services/alert.service.js';
import { cryptoPriceService } from '../../prices/services/crypto-price.service.js';
import { InlineKeyboardService } from '../services/inline-keyboard.service.js';

import type { ICallbackData } from '../../../shared/types/index.js';
import type { NotificationService } from '../services/notification.service.js';
import type { Context } from 'telegraf';

export class InlineKeyboardHandlers {
  private inlineKeyboardService: InlineKeyboardService;
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this.inlineKeyboardService = InlineKeyboardService.getInstance();
    this.notificationService = notificationService;
  }

  /**
   * Handle callback query from inline keyboard
   */
  public async handleCallbackQuery(ctx: Context): Promise<void> {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      return;
    }

    console.log('Received callback data:', ctx.callbackQuery.data);

    const callbackData = this.inlineKeyboardService.parseCallback(ctx.callbackQuery.data);
    if (!callbackData) {
      console.error('Failed to parse callback data:', ctx.callbackQuery.data);
      await ctx.answerCbQuery('Invalid callback data');
      return;
    }

    console.log('Parsed callback data:', callbackData);
    const chatId = ctx.chat?.id?.toString() || '';

    try {
      await this.handleCallback(ctx, chatId, callbackData);
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Error handling callback query:', error);
      await ctx.answerCbQuery('An error occurred');
    }
  }

  /**
   * Handle different callback actions
   */
  private async handleCallback(ctx: Context, chatId: string, callbackData: ICallbackData): Promise<void> {
    switch (callbackData.action) {
      case 'menu':
        await this.handleMainMenu(ctx, chatId);
        break;

      case 'price':
        await this.handlePriceMenu(ctx, chatId);
        break;

      case 'alert_create':
        await this.handleAlertCreation(ctx, chatId);
        break;

      case 'alert_list':
        await this.handleAlertsList(ctx, chatId);
        break;

      case 'alert_stats':
        await this.handleAlertStats(ctx, chatId);
        break;

      case 'alert_delete':
        if (callbackData.data) {
          await this.handleAlertDelete(ctx, chatId, parseInt(callbackData.data));
        }
        break;

      case 'symbols':
        await this.handleSymbolsList(ctx, chatId);
        break;

      case 'help':
        await this.handleHelp(ctx, chatId);
        break;

      default:
        if (callbackData.action.startsWith('price_')) {
          const symbol = callbackData.action.replace('price_', '');
          await this.handleGetPrice(ctx, chatId, symbol);
        } else if (callbackData.action === 'symbol_select' || callbackData.action.startsWith('symbol_select_')) {
          const symbol = callbackData.data || callbackData.action.replace('symbol_select_', '');
          if (symbol) {
            await this.handleSymbolSelect(ctx, chatId, symbol);
          }
        } else if (callbackData.action.startsWith('condition_')) {
          const condition = callbackData.action.replace('condition_', '') as 'above' | 'below';
          await this.handleConditionSelect(ctx, chatId, condition);
        } else if (callbackData.action === 'confirm') {
          await this.handleConfirmAlert(ctx, chatId);
        } else if (callbackData.action === 'cancel') {
          await this.handleCancel(ctx, chatId);
        } else if (callbackData.action === 'noop') {
          // No operation - just acknowledge the callback
          await ctx.answerCbQuery();
          return;
        } else {
          console.warn('Unhandled callback action:', callbackData.action);
          await ctx.answerCbQuery('Unknown action');
        }
        break;
    }
  }

  /**
   * Show main menu
   */
  private async handleMainMenu(ctx: Context, chatId: string): Promise<void> {
    const keyboard = this.inlineKeyboardService.getMainMenuKeyboard();
    const markup = this.inlineKeyboardService.toTelegrafKeyboard(keyboard);

    this.inlineKeyboardService.setMenuState(chatId, 'main');

    await ctx.editMessageText('🏠 *Main Menu*\n\nChoose an action:', {
      parse_mode: 'Markdown',
      reply_markup: markup,
    });
  }

  /**
   * Show price menu
   */
  private async handlePriceMenu(ctx: Context, chatId: string): Promise<void> {
    const keyboard = this.inlineKeyboardService.getPriceMenuKeyboard();
    const markup = this.inlineKeyboardService.toTelegrafKeyboard(keyboard);

    this.inlineKeyboardService.setMenuState(chatId, 'price');

    await ctx.editMessageText('📊 *Price Check*\n\nSelect a cryptocurrency to see its current price:', {
      parse_mode: 'Markdown',
      reply_markup: markup,
    });
  }

  /**
   * Handle price request for specific symbol
   */
  private async handleGetPrice(ctx: Context, chatId: string, symbol: string): Promise<void> {
    try {
      const price = await cryptoPriceService.getPrice(symbol);

      if (!price) {
        await ctx.editMessageText(`❌ Unable to fetch price for ${symbol}`, {
          reply_markup: this.inlineKeyboardService.toTelegrafKeyboard(
            this.inlineKeyboardService.getBackToMenuKeyboard(),
          ),
        });
        return;
      }

      const coinName = cryptoPriceService.getCoinName(symbol);
      const messageText = AlertMessages.PRICE_INFO(
        coinName,
        price.symbol,
        price.price,
        price.change24h,
        price.lastUpdated,
      );

      await ctx.editMessageText(messageText, {
        parse_mode: 'Markdown',
        reply_markup: this.inlineKeyboardService.toTelegrafKeyboard(this.inlineKeyboardService.getBackToMenuKeyboard()),
      });
    } catch (error) {
      console.error('Error getting price:', error);
      await ctx.editMessageText('❌ Error fetching price data', {
        reply_markup: this.inlineKeyboardService.toTelegrafKeyboard(this.inlineKeyboardService.getBackToMenuKeyboard()),
      });
    }
  }

  /**
   * Start alert creation process
   */
  private async handleAlertCreation(ctx: Context, chatId: string): Promise<void> {
    this.inlineKeyboardService.startAlertCreation(chatId);
    this.inlineKeyboardService.setMenuState(chatId, 'alert_create');

    const keyboard = this.inlineKeyboardService.getSymbolSelectionKeyboard();
    const markup = this.inlineKeyboardService.toTelegrafKeyboard(keyboard);

    await ctx.editMessageText('🔔 *Create Alert*\n\nStep 1/3: Select cryptocurrency:', {
      parse_mode: 'Markdown',
      reply_markup: markup,
    });
  }

  /**
   * Handle symbol selection for alert creation
   */
  private async handleSymbolSelect(ctx: Context, chatId: string, symbol: string): Promise<void> {
    this.inlineKeyboardService.updateAlertCreationState(chatId, {
      symbol: symbol.toUpperCase(),
      step: 'price',
    });

    await ctx.editMessageText(
      `🔔 *Create Alert*\n\nStep 2/3: Enter target price for ${symbol.toUpperCase()}\n\n💡 Send a message with the price (e.g., 50000)`,
      {
        parse_mode: 'Markdown',
        reply_markup: this.inlineKeyboardService.toTelegrafKeyboard(this.inlineKeyboardService.getBackToMenuKeyboard()),
      },
    );
  }

  /**
   * Handle condition selection for alert creation
   */
  private async handleConditionSelect(ctx: Context, chatId: string, condition: 'above' | 'below'): Promise<void> {
    const state = this.inlineKeyboardService.getAlertCreationState(chatId);
    if (!state || !state.symbol || !state.price) {
      await this.handleCancel(ctx, chatId);
      return;
    }

    this.inlineKeyboardService.updateAlertCreationState(chatId, {
      condition,
      step: 'condition',
    });

    const keyboard = this.inlineKeyboardService.getConfirmationKeyboard();
    const markup = this.inlineKeyboardService.toTelegrafKeyboard(keyboard);

    const conditionText = condition === 'above' ? 'above' : 'below';
    await ctx.editMessageText(
      `🔔 *Create Alert*\n\nConfirm your alert:\n\n` +
        `💰 **${state.symbol}** ${conditionText} **$${state.price}**\n\n` +
        `You will be notified when ${state.symbol} price goes ${conditionText} $${state.price}`,
      {
        parse_mode: 'Markdown',
        reply_markup: markup,
      },
    );
  }

  /**
   * Confirm and create alert
   */
  private async handleConfirmAlert(ctx: Context, chatId: string): Promise<void> {
    const state = this.inlineKeyboardService.getAlertCreationState(chatId);
    if (!state || !state.symbol || !state.price || !state.condition) {
      await this.handleCancel(ctx, chatId);
      return;
    }

    try {
      await alertService.createAlert({
        chatId,
        symbol: state.symbol,
        targetPrice: state.price,
        condition: state.condition,
      });

      this.inlineKeyboardService.clearAlertCreationState(chatId);

      const coinName = cryptoPriceService.getCoinName(state.symbol);
      await ctx.editMessageText(
        `✅ **Alert Created Successfully!**\n\n` +
          `💰 **${coinName} (${state.symbol})**\n` +
          `🎯 **Target:** $${state.price} (${state.condition})\n\n` +
          `You will receive a notification when the price condition is met.`,
        {
          parse_mode: 'Markdown',
          reply_markup: this.inlineKeyboardService.toTelegrafKeyboard(
            this.inlineKeyboardService.getBackToMenuKeyboard(),
          ),
        },
      );
    } catch (error) {
      console.error('Error creating alert:', error);

      if (error instanceof Error && error.message.includes('already exists')) {
        await ctx.editMessageText('❌ This alert already exists!', {
          reply_markup: this.inlineKeyboardService.toTelegrafKeyboard(
            this.inlineKeyboardService.getBackToMenuKeyboard(),
          ),
        });
      } else {
        await ctx.editMessageText('❌ Error creating alert. Please try again.', {
          reply_markup: this.inlineKeyboardService.toTelegrafKeyboard(
            this.inlineKeyboardService.getBackToMenuKeyboard(),
          ),
        });
      }

      this.inlineKeyboardService.clearAlertCreationState(chatId);
    }
  }

  /**
   * Show user's alerts list
   */
  private async handleAlertsList(ctx: Context, chatId: string): Promise<void> {
    try {
      const alerts = await alertService.getUserAlerts(chatId);

      if (alerts.length === 0) {
        await ctx.editMessageText('📋 *Your Alerts*\n\nYou have no active alerts.', {
          parse_mode: 'Markdown',
          reply_markup: this.inlineKeyboardService.toTelegrafKeyboard(
            this.inlineKeyboardService.getBackToMenuKeyboard(),
          ),
        });
        return;
      }

      const alertsText = alerts
        .map((alert, index) => `${index + 1}. **${alert.symbol}** ${alert.condition} $${alert.targetPrice}`)
        .join('\n');

      const keyboard = this.inlineKeyboardService.getAlertsListKeyboard(alerts);
      const markup = this.inlineKeyboardService.toTelegrafKeyboard(keyboard);

      await ctx.editMessageText(`📋 *Your Alerts*\n\n${alertsText}\n\nSelect an alert to delete:`, {
        parse_mode: 'Markdown',
        reply_markup: markup,
      });
    } catch (error) {
      console.error('Error fetching alerts:', error);
      await ctx.editMessageText('❌ Error fetching alerts', {
        reply_markup: this.inlineKeyboardService.toTelegrafKeyboard(this.inlineKeyboardService.getBackToMenuKeyboard()),
      });
    }
  }

  /**
   * Delete specific alert
   */
  private async handleAlertDelete(ctx: Context, chatId: string, alertId: number): Promise<void> {
    try {
      const deleted = await alertService.deleteAlert(chatId, alertId);

      if (deleted) {
        await ctx.editMessageText(`✅ Alert #${alertId} has been deleted successfully!`, {
          reply_markup: this.inlineKeyboardService.toTelegrafKeyboard(
            this.inlineKeyboardService.getBackToMenuKeyboard(),
          ),
        });
      } else {
        await ctx.editMessageText(`❌ Alert #${alertId} not found or doesn't belong to you.`, {
          reply_markup: this.inlineKeyboardService.toTelegrafKeyboard(
            this.inlineKeyboardService.getBackToMenuKeyboard(),
          ),
        });
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      await ctx.editMessageText('❌ Error deleting alert', {
        reply_markup: this.inlineKeyboardService.toTelegrafKeyboard(this.inlineKeyboardService.getBackToMenuKeyboard()),
      });
    }
  }

  /**
   * Show alert statistics
   */
  private async handleAlertStats(ctx: Context, chatId: string): Promise<void> {
    try {
      const stats = await alertService.getUserAlertStats(chatId);

      await ctx.editMessageText(
        `📈 *Your Alert Statistics*\n\n` +
          `🔔 **Active Alerts:** ${stats.active}\n` +
          `📊 **Total Alerts:** ${stats.total}\n` +
          `✅ **Triggered Alerts:** ${stats.triggered}`,
        {
          parse_mode: 'Markdown',
          reply_markup: this.inlineKeyboardService.toTelegrafKeyboard(
            this.inlineKeyboardService.getBackToMenuKeyboard(),
          ),
        },
      );
    } catch (error) {
      console.error('Error fetching stats:', error);
      await ctx.editMessageText('❌ Error fetching statistics', {
        reply_markup: this.inlineKeyboardService.toTelegrafKeyboard(this.inlineKeyboardService.getBackToMenuKeyboard()),
      });
    }
  }

  /**
   * Show supported symbols
   */
  private async handleSymbolsList(ctx: Context, _chatId: string): Promise<void> {
    await ctx.editMessageText(
      BotMessages.HELP.split('🔧 *Supported cryptocurrencies:*\n')[1] || 'List of supported cryptocurrencies...',
      {
        parse_mode: 'Markdown',
        reply_markup: this.inlineKeyboardService.toTelegrafKeyboard(this.inlineKeyboardService.getBackToMenuKeyboard()),
      },
    );
  }

  /**
   * Show help
   */
  private async handleHelp(ctx: Context, _chatId: string): Promise<void> {
    await ctx.editMessageText(BotMessages.HELP, {
      parse_mode: 'Markdown',
      reply_markup: this.inlineKeyboardService.toTelegrafKeyboard(this.inlineKeyboardService.getBackToMenuKeyboard()),
    });
  }

  /**
   * Handle cancel action
   */
  private async handleCancel(ctx: Context, chatId: string): Promise<void> {
    this.inlineKeyboardService.clearAlertCreationState(chatId);
    this.inlineKeyboardService.clearMenuState(chatId);

    await this.handleMainMenu(ctx, chatId);
  }

  /**
   * Handle text message during alert creation
   */
  public async handleAlertCreationText(ctx: Context): Promise<void> {
    if (!ctx.message || !('text' in ctx.message)) {
      return;
    }

    const chatId = ctx.chat?.id?.toString() || '';
    const state = this.inlineKeyboardService.getAlertCreationState(chatId);

    if (!state || state.step !== 'price') {
      return;
    }

    const text = ctx.message.text;
    const price = parseFloat(text);

    if (isNaN(price) || price <= 0) {
      await ctx.reply('❌ Invalid price format. Please send a valid number (e.g., 50000)', {
        reply_markup: this.inlineKeyboardService.toTelegrafKeyboard(this.inlineKeyboardService.getBackToMenuKeyboard()),
      });
      return;
    }

    this.inlineKeyboardService.updateAlertCreationState(chatId, {
      price,
      step: 'condition',
    });

    const keyboard = this.inlineKeyboardService.getAlertConditionsKeyboard();
    const markup = this.inlineKeyboardService.toTelegrafKeyboard(keyboard);

    await ctx.reply(`🔔 *Create Alert*\n\nStep 3/3: Select condition for ${state.symbol} at $${price}:`, {
      parse_mode: 'Markdown',
      reply_markup: markup,
    });
  }
}
