import { BotMessages } from '../../../shared/messages/index.js';
import { InlineKeyboardService } from '../services/inline-keyboard.service.js';

import type { Context } from 'telegraf';

export class BotHandlers {
  private inlineKeyboardService: InlineKeyboardService;

  constructor() {
    this.inlineKeyboardService = InlineKeyboardService.getInstance();
  }

  /**
   * Handler for /start command
   */
  public async handleStart(ctx: Context): Promise<void> {
    const keyboard = this.inlineKeyboardService.getMainMenuKeyboard();
    const markup = this.inlineKeyboardService.toTelegrafKeyboard(keyboard);

    await ctx.reply(BotMessages.WELCOME + '\n\n🎛️ Use the menu below or commands:', {
      parse_mode: 'Markdown',
      reply_markup: markup,
    });
  }

  /**
   * Handler for /help command
   */
  public async handleHelp(ctx: Context): Promise<void> {
    const keyboard = this.inlineKeyboardService.getMainMenuKeyboard();
    const markup = this.inlineKeyboardService.toTelegrafKeyboard(keyboard);

    await ctx.reply(BotMessages.HELP, {
      parse_mode: 'Markdown',
      reply_markup: markup,
    });
  }

  /**
   * Handler for /menu command - show inline keyboard menu
   */
  public async handleMenu(ctx: Context): Promise<void> {
    const keyboard = this.inlineKeyboardService.getMainMenuKeyboard();
    const markup = this.inlineKeyboardService.toTelegrafKeyboard(keyboard);

    await ctx.reply('🏠 *Main Menu*\n\nChoose an action:', {
      parse_mode: 'Markdown',
      reply_markup: markup,
    });
  }
}
