export const ErrorMessages = {
  GENERIC_ERROR: (message: string) => `❌ *Error:* ${message}`,

  // Bot startup errors
  BOT_LAUNCH_FAILED: '❌ Failed to launch bot:',

  // Service errors
  NOTIFICATION_SEND_FAILED: (chatId: string, _error: unknown) => `❌ Error sending notification to user ${chatId}:`,
  CONFIRMATION_SEND_FAILED: (chatId: string, _error: unknown) => `❌ Error sending confirmation to user ${chatId}:`,
  ALERTS_LIST_SEND_FAILED: (chatId: string, _error: unknown) => `❌ Error sending alerts list to user ${chatId}:`,
  DELETION_CONFIRMATION_SEND_FAILED: (chatId: string, _error: unknown) =>
    `❌ Error sending deletion confirmation to user ${chatId}:`,
  ERROR_MESSAGE_SEND_FAILED: (chatId: string, _error: unknown) => `❌ Error sending error message to user ${chatId}:`,
  STATS_SEND_FAILED: (chatId: string, _error: unknown) => `❌ Error sending statistics to user ${chatId}:`,
  SYMBOLS_LIST_SEND_FAILED: (chatId: string, _error: unknown) => `❌ Error sending symbols list to user ${chatId}:`,

  // Alert service errors
  CREATE_ALERT_FAILED: 'Error creating alert:',
  GET_ALERTS_FAILED: 'Error getting alerts:',
  DELETE_ALERT_FAILED: 'Error deleting alert:',
  GET_STATS_FAILED: 'Error getting statistics:',
  GET_SYMBOLS_FAILED: 'Error getting symbols list:',
  GET_PRICE_FAILED: 'Error getting price:',
  CHECK_ALERTS_FAILED: '❌ Error checking alerts:',
  PROCESS_ALERT_FAILED: (alertId: number) => `❌ Error processing alert ${alertId}:`,

  // Price service errors
  PRICE_FETCH_FAILED: (symbol: string) => `Error getting price for ${symbol}:`,

  // Update type errors
  UPDATE_TYPE_ERROR: (updateType: string) => `❌ Error in update type ${updateType}`,

  // Global error handlers
  UNCAUGHT_EXCEPTION: '💥 Uncaught Exception:',
  UNHANDLED_REJECTION: '💥 Unhandled Rejection at:',

  // Service initialization errors
  NOTIFICATION_SERVICE_NOT_INITIALIZED: 'NotificationService not initialized. Call getInstance(bot) first.',
  ALERT_CHECKER_SERVICE_NOT_INITIALIZED: 'AlertCheckerService not initialized. Call getInstance(bot) first.',
  CONFIG_KEY_NOT_FOUND: (key: string) => `Config key '${key}' not found`,

  // Cleanup errors
  OLD_ALERTS_CLEANUP_FAILED: '❌ Error during old alerts cleanup:',
  FIRST_CLEANUP_FAILED: '❌ Error during first old alerts cleanup:',
} as const;
