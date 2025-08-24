#!/bin/bash

(
  if [ -f .env ]; then
    set -a
    source .env
    set +a
  fi

  printenv

  echo "API Key: $BOT_TOKEN"
)
