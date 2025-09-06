export interface IInlineKeyboardButton {
  text: string;
  callback_data: string;
}

export interface IInlineKeyboardRow {
  buttons: IInlineKeyboardButton[];
}

export interface IInlineKeyboard {
  rows: IInlineKeyboardRow[];
}

export type TCallbackAction =
  | 'price'
  | 'alert_create'
  | 'alert_list'
  | 'alert_delete'
  | 'alert_stats'
  | 'symbols'
  | 'help'
  | 'menu'
  | 'back'
  | 'confirm'
  | 'cancel'
  | 'symbol_select'
  | 'condition_above'
  | 'condition_below'
  | 'page'
  | 'noop'
  | string; // Allow price_BTC, price_ETH, etc.

export interface ICallbackData {
  action: TCallbackAction;
  data?: string;
  page?: number;
}

export interface IMenuState {
  chatId: string;
  currentMenu: string;
  data?: Record<string, unknown>;
}

export interface IAlertCreationState {
  chatId: string;
  step: 'symbol' | 'price' | 'condition';
  symbol?: string;
  price?: number;
  condition?: 'above' | 'below';
}
