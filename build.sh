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
docker compose down -v

echo "==> Starting Postgres and waiting for healthcheck..."
docker compose up -d --wait

echo "==> Applying migrations..."
npx prisma migrate dev

echo "==> Seeding..."
npx prisma db seed

echo "==> Done. Database is fresh."
