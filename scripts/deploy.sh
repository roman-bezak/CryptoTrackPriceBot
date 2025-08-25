#!/bin/bash
set -e

# ------------------------------
# Load environment variables locally (visible only in this script)
# ------------------------------
load_env_local() {
  local env_file=".env"
  if [ -f "$env_file" ]; then
    echo "Loading environment variables locally..."
    while IFS='=' read -r key value || [ -n "$key" ]; do
      # Skip comments and empty lines
      [[ "$key" =~ ^#.*$ ]] && continue
      [[ -z "$key" ]] && continue
      # Export variable only for this script and child processes
      export "$key=$value"
    done <"$env_file"
  fi
}

# ------------------------------
# Check that required environment variables are set
# ------------------------------
check_required_vars() {
  REQUIRED_VARS=("VPS_WORKDIR" "VPS_APP_FOLDER" "VPS_BACKUPS_FOLDER" "VPS_TEMP_DEPLOY_DIR" "DATABASE_URL" "DOCKER_IMAGE")

  for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
      echo "ERROR: Required variable $var is not set!"
      exit 1
    fi
  done
}

# ------------------------------
# Stop the app if docker-compose file exists
# ------------------------------
stop_app() {
  local APP_DIR="${VPS_WORKDIR}/${VPS_APP_FOLDER}"
  local COMPOSE_FILE="${APP_DIR}/docker-compose.yml"

  if [ -d "$APP_DIR" ] && [ -f "$COMPOSE_FILE" ]; then
    echo "Stopping app $VPS_APP_FOLDER..."
    docker-compose -f "$COMPOSE_FILE" down
    echo "✅ App $VPS_APP_FOLDER stopped"
  else
    echo "Running app $VPS_APP_FOLDER not found"
    echo "Considering it is not running or never was deployed"
    echo "Continue..."
  fi
}

# ------------------------------
# Perform backup of the app folder
# ------------------------------
backup_app() {
  local APP_DIR="${VPS_WORKDIR}/${VPS_APP_FOLDER}"
  local BACKUP_DIR="${VPS_WORKDIR}/${VPS_BACKUPS_FOLDER}"
  local BACKUP_DATE="$(date -u +"%Y-%m-%dT%H-%M-%SZ")"
  local TARGET_DIR="${BACKUP_DIR}/${BACKUP_DATE}_${VPS_APP_FOLDER}"

  if [ -d "$APP_DIR" ]; then
    echo "Starting backup process..."

    # Ensure parent backup directory exists
    mkdir -p "$TARGET_DIR"

    echo "Creating backup folder..."
    echo "Copying files to $TARGET_DIR ..."

    if rsync -av "$APP_DIR/" "$TARGET_DIR/"; then
      echo "✅ Backup completed successfully"
    else
      echo "❌ Backup failed!"
      exit 1
    fi
  else
    echo "⚠️ Source folder ($APP_DIR) missing, skipping backup"
  fi
}

# ------------------------------
# Deploy the app with Docker Compose
# ------------------------------
deploy_app() {
  local APP_DIR="${VPS_WORKDIR}/${VPS_APP_FOLDER}"
  local COMPOSE_FILE="${APP_DIR}/docker-compose.yml"

  local TEMP_NEW_VERSION_DEPLOY_DIR="${VPS_WORKDIR}/${VPS_TEMP_DEPLOY_DIR}"

  if [ -d "$TEMP_NEW_VERSION_DEPLOY_DIR" ]; then
    cp -r "${TEMP_NEW_VERSION_DEPLOY_DIR}/." "${APP_DIR}" || {
      echo "❌ deploy_app: Copy failed"
      exit 1
    }
  else
    echo "❌ deploy_app: Temp deploy dir not found: $TEMP_NEW_VERSION_DEPLOY_DIR"
    exit 1
  fi

  if [ -d "$APP_DIR" ] && [ -f "$COMPOSE_FILE" ]; then
    echo "Pulling latest Docker images..."
    docker-compose -f "$COMPOSE_FILE" pull

    echo "Starting containers..."
    docker-compose -f "$COMPOSE_FILE" up -d --force-recreate

    echo "Cleaning up old dangling images..."
    docker image prune -f

    echo "✅ Deployment completed successfully"
  else
    echo "❌ deploy_app: App folder or docker-compose.yml not found in ${APP_DIR}"
    exit 1
  fi
}

# ------------------------------
# Main script execution
# ------------------------------
main() {
  load_env_local      # Load .env variables locally
  check_required_vars # Validate required variables
  stop_app            # Stop running containers
  backup_app          # Backup app folder
  deploy_app          # Pull new images and start containers
}

main
