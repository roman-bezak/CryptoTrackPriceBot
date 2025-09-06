import type { IInlineKeyboard, ICallbackData } from '../types/inline-keyboard.types.js';

export const INLINE_KEYBOARD_CONSTANTS = {
  // Main menu keyboard
  MAIN_MENU: {
    rows: [
      {
        buttons: [
          { text: '📊 Get Price', callback_data: 'price' },
          { text: '🔔 Set Alert', callback_data: 'alert_create' },
        ],
      },
      {
        buttons: [
          { text: '📋 My Alerts', callback_data: 'alert_list' },
          { text: '📈 Statistics', callback_data: 'alert_stats' },
        ],
      },
      {
        buttons: [
          { text: '💰 Symbols', callback_data: 'symbols' },
          { text: '❓ Help', callback_data: 'help' },
        ],
      },
    ],
  } as IInlineKeyboard,

  // Alert management keyboard
  ALERT_MENU: {
    rows: [
      {
        buttons: [
          { text: '➕ Create Alert', callback_data: 'alert_create' },
          { text: '📋 My Alerts', callback_data: 'alert_list' },
        ],
      },
      {
        buttons: [
          { text: '📈 Statistics', callback_data: 'alert_stats' },
          { text: '🔙 Back to Menu', callback_data: 'menu' },
        ],
      },
    ],
  } as IInlineKeyboard,

  // Price menu keyboard
  PRICE_MENU: {
    rows: [
      {
        buttons: [
          { text: '🚀 BTC', callback_data: 'price_BTC' },
          { text: '💎 ETH', callback_data: 'price_ETH' },
          { text: '🟡 BNB', callback_data: 'price_BNB' },
        ],
      },
      {
        buttons: [
          { text: '💙 ADA', callback_data: 'price_ADA' },
          { text: '☀️ SOL', callback_data: 'price_SOL' },
          { text: '🌊 XRP', callback_data: 'price_XRP' },
        ],
      },
      {
        buttons: [
          { text: '🔴 DOT', callback_data: 'price_DOT' },
          { text: '🐕 DOGE', callback_data: 'price_DOGE' },
        ],
      },
      {
        buttons: [
          { text: '🔺 AVAX', callback_data: 'price_AVAX' },
          { text: '🟣 MATIC', callback_data: 'price_MATIC' },
        ],
      },
      {
        buttons: [{ text: '🔙 Back to Menu', callback_data: 'menu' }],
      },
    ],
  } as IInlineKeyboard,

  // Alert conditions keyboard
  ALERT_CONDITIONS: {
    rows: [
      {
        buttons: [
          { text: '📈 Above', callback_data: 'condition_above' },
          { text: '📉 Below', callback_data: 'condition_below' },
        ],
      },
      {
        buttons: [{ text: '❌ Cancel', callback_data: 'cancel' }],
      },
    ],
  } as IInlineKeyboard,

  // Confirmation keyboard
  CONFIRM_CANCEL: {
    rows: [
      {
        buttons: [
          { text: '✅ Confirm', callback_data: 'confirm' },
          { text: '❌ Cancel', callback_data: 'cancel' },
        ],
      },
    ],
  } as IInlineKeyboard,

  // Back button
  BACK_TO_MENU: {
    rows: [
      {
        buttons: [{ text: '🔙 Back to Menu', callback_data: 'menu' }],
      },
    ],
  } as IInlineKeyboard,
} as const;

// Helper function to create callback data
export const createCallbackData = (action: string, data?: string, page?: number): string => {
  const callbackData: ICallbackData = { action: action as ICallbackData['action'] };
  if (data) callbackData.data = data;
  if (page !== undefined) callbackData.page = page;
  return JSON.stringify(callbackData);
};

// Helper function to parse callback data
export const parseCallbackData = (data: string): ICallbackData | null => {
  try {
    // Try to parse as JSON first
    return JSON.parse(data) as ICallbackData;
  } catch {
    // If it's not JSON, treat as simple action string
    return { action: data as ICallbackData['action'] };
  }
};

// Pagination helper
export const createPaginationKeyboard = (
  items: Array<{ text: string; callback_data: string }>,
  currentPage: number,
  itemsPerPage: number,
  backAction: string = 'menu',
): IInlineKeyboard => {
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, items.length);

  const pageItems = items.slice(startIndex, endIndex);
  const rows: Array<{ buttons: Array<{ text: string; callback_data: string }> }> = [];

  // Add items (2 per row)
  for (let i = 0; i < pageItems.length; i += 2) {
    const row = {
      buttons: [pageItems[i]],
    };
    if (pageItems[i + 1]) {
      row.buttons.push(pageItems[i + 1]);
    }
    rows.push(row);
  }

  // Add pagination controls if needed
  if (totalPages > 1) {
    const paginationRow = { buttons: [] as Array<{ text: string; callback_data: string }> };

    if (currentPage > 0) {
      paginationRow.buttons.push({
        text: '⬅️ Previous',
        callback_data: createCallbackData('page', undefined, currentPage - 1),
      });
    }

    paginationRow.buttons.push({
      text: `${currentPage + 1}/${totalPages}`,
      callback_data: 'noop',
    });

    if (currentPage < totalPages - 1) {
      paginationRow.buttons.push({
        text: 'Next ➡️',
        callback_data: createCallbackData('page', undefined, currentPage + 1),
      });
    }

    rows.push(paginationRow);
  }

  // Add back button
  rows.push({
    buttons: [{ text: '🔙 Back', callback_data: backAction }],
  });

  return { rows };
};
