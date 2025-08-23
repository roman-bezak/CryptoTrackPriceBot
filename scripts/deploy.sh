#!/bin/bash

(
  if [ -f .env ]; then
    set -a
    source .env
    set +a
  fi

  echo "Database: $DB_HOST:$DB_PORT"
  echo "API Key: $API_KEY"

  echo "API Key: $BOT_TOKEN"
)
