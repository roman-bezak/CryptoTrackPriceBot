#!/bin/sh

# Exit on any error
set -e

echo "🚀 Starting CryptoTrackPriceBot..."

# Validate required environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL environment variable is required"
  exit 1
fi

if [ -z "$BOT_TOKEN" ]; then
  echo "❌ BOT_TOKEN environment variable is required"
  exit 1
fi

echo "🗄️  Database: $DATABASE_URL"

# Run migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "📊 Running database migrations..."
  npx prisma migrate deploy
  echo "✅ Migrations completed successfully"
else
  echo "⚠️  DATABASE_URL not set, skipping migrations"
fi

echo "🌐 Starting Prisma Studio..."
npx prisma studio --port 5555 &
STUDIO_PID=$!
echo "Prisma Studio PID: $STUDIO_PID"

# Start the application
echo "🤖 Starting the bot from image..."
exec npm run start:prod
