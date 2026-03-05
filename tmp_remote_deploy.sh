#!/bin/bash
set -e
cd /root/L2C
git fetch origin main 2>&1
git checkout -f FETCH_HEAD -- .dockerignore docker-compose.prod.yml Dockerfile.prebuilt nginx/ package.json pnpm-lock.yaml drizzle/ drizzle.config.ts src/shared/api/schema.ts src/shared/api/schema/ tsconfig.json 2>&1
[ -f next-build.tar.gz ] && cp next-build.tar.gz next-build-backup-$(date +%Y%m%d-%H%M%S).tar.gz || true
rm -rf .next/standalone .next/static
tar -xzf next-build.tar.gz
sed -i '/^\.next$/d' .dockerignore
docker compose -f docker-compose.prod.yml build --no-cache
echo '.next' >> .dockerignore
docker rm -f l2c-app l2c-db-migrate l2c-nginx 2>/dev/null || true
docker compose -f docker-compose.prod.yml up -d
echo "Deployment restarted successfully on ECS"
