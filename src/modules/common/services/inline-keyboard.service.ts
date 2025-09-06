import {
  INLINE_KEYBOARD_CONSTANTS,
  createCallbackData,
  parseCallbackData,
  createPaginationKeyboard,
} from '../../../shared/constants/index.js';

import type {
  IMenuState,
  IAlertCreationState,
  IInlineKeyboard,
  ICallbackData,
  IInlineKeyboardRow,
  IInlineKeyboardButton,
} from '../../../shared/types/index.js';

export class InlineKeyboardService {
  private static instance: InlineKeyboardService;
  private menuStates: Map<string, IMenuState> = new Map();
  private alertCreationStates: Map<string, IAlertCreationState> = new Map();

  private constructor() {}

  public static getInstance(): InlineKeyboardService {
    if (!InlineKeyboardService.instance) {
      InlineKeyboardService.instance = new InlineKeyboardService();
    }
    return InlineKeyboardService.instance;
  }

  /**
   * Get main menu keyboard
   */
  public getMainMenuKeyboard(): IInlineKeyboard {
    return INLINE_KEYBOARD_CONSTANTS.MAIN_MENU;
  }

  /**
   * Get alert menu keyboard
   */
  public getAlertMenuKeyboard(): IInlineKeyboard {
    return INLINE_KEYBOARD_CONSTANTS.ALERT_MENU;
  }

  /**
   * Get price selection keyboard
   */
  public getPriceMenuKeyboard(): IInlineKeyboard {
    return INLINE_KEYBOARD_CONSTANTS.PRICE_MENU;
  }

  /**
   * Get alert conditions keyboard
   */
  public getAlertConditionsKeyboard(): IInlineKeyboard {
    return INLINE_KEYBOARD_CONSTANTS.ALERT_CONDITIONS;
  }

  /**
   * Get confirmation keyboard
   */
  public getConfirmationKeyboard(): IInlineKeyboard {
    return INLINE_KEYBOARD_CONSTANTS.CONFIRM_CANCEL;
  }

  /**
   * Get back to menu keyboard
   */
  public getBackToMenuKeyboard(): IInlineKeyboard {
    return INLINE_KEYBOARD_CONSTANTS.BACK_TO_MENU;
  }

  /**
   * Create symbol selection keyboard for alerts
   */
  public getSymbolSelectionKeyboard(): IInlineKeyboard {
    const symbols = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'XRP', 'DOT', 'DOGE', 'AVAX', 'MATIC'];
    const buttons = symbols.map(symbol => ({
      text: `${this.getSymbolEmoji(symbol)} ${symbol}`,
      callback_data: createCallbackData('symbol_select', symbol),
    }));

    return createPaginationKeyboard(buttons, 0, 10, 'alert_create');
  }

  /**
   * Create alerts list keyboard with delete options
   */
  public getAlertsListKeyboard(
    alerts: Array<{ id: number; symbol: string; targetPrice: number; condition: string }>,
    page: number = 0,
  ): IInlineKeyboard {
    const alertButtons = alerts.map(alert => ({
      text: `🗑️ Delete ${alert.symbol} ${alert.condition} $${alert.targetPrice}`,
      callback_data: createCallbackData('alert_delete', alert.id.toString()),
    }));

    return createPaginationKeyboard(alertButtons, page, 5, 'alert_list');
  }

  /**
   * Parse callback data from inline keyboard
   */
  public parseCallback(data: string): ICallbackData | null {
    return parseCallbackData(data);
  }

  /**
   * Set menu state for user
   */
  public setMenuState(chatId: string, menu: string, data?: Record<string, unknown>): void {
    this.menuStates.set(chatId, { chatId, currentMenu: menu, data });
  }

  /**
   * Get menu state for user
   */
  public getMenuState(chatId: string): IMenuState | undefined {
    return this.menuStates.get(chatId);
  }

  /**
   * Clear menu state for user
   */
  public clearMenuState(chatId: string): void {
    this.menuStates.delete(chatId);
  }

  /**
   * Start alert creation process
   */
  public startAlertCreation(chatId: string): void {
    this.alertCreationStates.set(chatId, {
      chatId,
      step: 'symbol',
    });
  }

  /**
   * Update alert creation state
   */
  public updateAlertCreationState(chatId: string, updates: Partial<IAlertCreationState>): void {
    const current = this.alertCreationStates.get(chatId);
    if (current) {
      this.alertCreationStates.set(chatId, { ...current, ...updates });
    }
  }

  /**
   * Get alert creation state
   */
  public getAlertCreationState(chatId: string): IAlertCreationState | undefined {
    return this.alertCreationStates.get(chatId);
  }

  /**
   * Clear alert creation state
   */
  public clearAlertCreationState(chatId: string): void {
    this.alertCreationStates.delete(chatId);
  }

  /**
   * Check if user is in alert creation process
   */
  public isInAlertCreation(chatId: string): boolean {
    return this.alertCreationStates.has(chatId);
  }

  /**
   * Convert InlineKeyboard to Telegraf format
   */
  public toTelegrafKeyboard(keyboard: IInlineKeyboard): {
    inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
  } {
    return {
      inline_keyboard: keyboard.rows.map((row: IInlineKeyboardRow) =>
        row.buttons.map((button: IInlineKeyboardButton) => ({
          text: button.text,
          callback_data: button.callback_data,
        })),
      ),
    };
  }

  /**
   * Get emoji for cryptocurrency symbol
   */
  private getSymbolEmoji(symbol: string): string {
    const emojiMap: Record<string, string> = {
      BTC: '🚀',
      ETH: '💎',
      BNB: '🟡',
      ADA: '💙',
      SOL: '☀️',
      XRP: '🌊',
      DOT: '🔴',
      DOGE: '🐕',
      AVAX: '🔺',
      MATIC: '🟣',
    };
    return emojiMap[symbol] || '💰';
  }

  /**
   * Clean up old states (call periodically)
   */
  public cleanupOldStates(): void {
    // In a real application, you might want to implement TTL for states
    // For now, we keep it simple
    console.log('Cleaning up old states...');
  }
}
