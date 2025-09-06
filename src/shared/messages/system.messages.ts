export const SystemMessages = {
  // Startup messages
  STARTING_BOT: '🚀 Starting CryptoTrackPriceBot...',
  BOT_LAUNCHED: '✅ Bot successfully launched!',
  ALERT_CHECKING_STARTED: '🔄 Alert checking service started',

  // Environment
  NODE_ENV: (env: string) => `🌍 NODE_ENV: ${env}`,

  // Alert checking
  STARTING_ALERT_CHECKING: (intervalMinutes: number) => `🔄 Starting alert checking every ${intervalMinutes} minutes`,
  ALERT_CHECKING_ALREADY_RUNNING: '⚠️ Alert checking is already running',
  ALERT_CHECKING_STOPPED: '🛑 Alert checking stopped',
  CHECKING_ALERTS: '🔍 Checking active alerts...',
  NO_TRIGGERED_ALERTS: '✅ No triggered alerts found',
  FOUND_TRIGGERED_ALERTS: (count: number) => `🚨 Found ${count} triggered alerts`,
  ALERT_PROCESSED: (alertId: number, chatId: string) => `✅ Alert ${alertId} processed for user ${chatId}`,
  ALERTS_PROCESSED: (count: number) => `✅ Processed ${count} alerts`,
  NOTIFICATION_SENT: (chatId: string, symbol: string) => `✅ Notification sent to user ${chatId} for ${symbol}`,

  // Cleanup
  STARTING_CLEANUP: (intervalHours: number) => `🧹 Starting cleanup of old alerts every ${intervalHours} hours`,
  CLEANUP_COMPLETED: '✅ Old alerts cleanup completed',
  FIRST_CLEANUP_COMPLETED: '✅ First old alerts cleanup completed',

  // Graceful shutdown
  GRACEFUL_SHUTDOWN: (signal: string) => `\n🛑 Received ${signal}, stopping bot...`,
  ALERT_CHECKING_SERVICE_STOPPED: '🛑 Alert checking service stopped',
  BOT_STOPPED: '✅ Bot stopped gracefully',
  DATABASE_CLOSED: '✅ Database connection closed',
} as const;
