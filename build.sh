#!/usr/bin/env bash
# Rebuilds the local Postgres dev database from scratch:
#   1. Stops the container and deletes the data volume (destroys all data)
#   2. Brings Postgres back up and waits for it to pass its healthcheck
#   3. Applies Prisma migrations
#   4. Runs the seed script
#
# Usage: ./build.sh
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Tearing down database (volume will be deleted)..."
docker compose down -v --remove-orphans
# Force-remove a stranded container with the same fixed name (e.g. left over
# from a Docker Desktop restart). Ignore failure if it doesn't exist.
docker rm -f tcss460-postgres 2>/dev/null || true

# Free port 5433 if something else is still bound to it.
echo "==> Checking port 5433..."
others=$(docker ps --filter "publish=5433" --format "{{.Names}}" | grep -v "^tcss460-postgres$" || true)
if [ -n "$others" ]; then
  echo "    Stopping other container(s) on port 5433: $others"
  echo "$others" | xargs docker stop >/dev/null
fi
# Fallback for non-docker processes (e.g. a native postgres install). Skip
# Docker Desktop's port proxy — killing it crashes Docker.
if pids=$(lsof -ti :5433 2>/dev/null); then
  for pid in $pids; do
    name=$(ps -p "$pid" -o comm= 2>/dev/null || true)
    case "$name" in
      *docker*|*Docker*) ;;
      *)
        echo "    Killing host process on port 5433: $pid ($name)"
        kill -9 "$pid" 2>/dev/null || true
        ;;
    esac
  done
fi

echo "==> Starting Postgres and waiting for healthcheck..."
docker compose up -d --wait

echo "==> Applying migrations..."
npx prisma migrate dev

echo "==> Seeding..."
npx prisma db seed

echo "==> Done. Database is fresh."
