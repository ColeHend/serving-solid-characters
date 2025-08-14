#!/usr/bin/env bash
set -euo pipefail

# Variables (with defaults)
REPO_OWNER=${REPO_OWNER:-colehend}
IMAGE_TAG=${IMAGE_TAG:-latest}
APP_DIR=/opt/serving-solid-characters
COMPOSE_FILE=$APP_DIR/docker-compose.yml
IMAGE="ghcr.io/${REPO_OWNER}/serving-solid-characters:${IMAGE_TAG}"

echo "Pulling image $IMAGE"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Login to GHCR if token provided (expect GHCR_TOKEN passed via environment)
if [[ -n "${GHCR_TOKEN:-}" ]]; then
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "$REPO_OWNER" --password-stdin
fi

docker pull "$IMAGE"

# Create/update .env for docker-compose variable substitution
cat > .env <<EOF
REPO_OWNER=$REPO_OWNER
IMAGE_TAG=$IMAGE_TAG
EOF

echo "Recreating container"
# Stop old container if exists
if docker ps -aq -f name=serving-solid-characters >/dev/null; then
  docker compose -f "$COMPOSE_FILE" down
fi

docker compose -f "$COMPOSE_FILE" up -d

echo "Deployment complete"
