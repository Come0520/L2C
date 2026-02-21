FROM node:20-alpine AS base

ENV COREPACK_NPM_REGISTRY=https://registry.npmmirror.com
ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com

FROM base AS deps
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

ENV NEXT_TELEMETRY_DISABLED 1

# 构建时占位环境变量，避免 Next.js 构建因缺少变量而失败
# 实际值在运行时通过 .env 或 docker-compose 注入
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV AUTH_SECRET="build-time-placeholder-secret"

# 版本信息通过 ARG 注入（可选，由 CI 传入）
ARG NEXT_PUBLIC_GIT_COMMIT_SHA=""
ARG NEXT_PUBLIC_BUILD_TIME=""
ENV NEXT_PUBLIC_GIT_COMMIT_SHA=$NEXT_PUBLIC_GIT_COMMIT_SHA
ENV NEXT_PUBLIC_BUILD_TIME=$NEXT_PUBLIC_BUILD_TIME

RUN pnpm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

ENV PNPM_HOME="/app/.pnpm"
ENV PATH="/app/.local/bin:$PNPM_HOME:$PATH"
RUN corepack enable pnpm

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]

# ==========================================
# 数据库迁移阶段（独立服务）
# 用于在容器内执行 drizzle-kit push
# 解决 CentOS 7 宿主机 GLIBC 版本过低的问题
# ==========================================
FROM base AS migrator
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 安装 expect 工具（用于自动回答 drizzle-kit 的交互提示）
RUN apk add --no-cache expect

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 复制迁移所需文件
COPY drizzle ./drizzle
COPY drizzle.config.ts ./
COPY src/shared/api/schema.ts ./src/shared/api/schema.ts
COPY src/shared/api/schema/ ./src/shared/api/schema/
COPY tsconfig.json ./

# 复制 expect 脚本：自动回答 drizzle-kit push 的交互提示
COPY scripts/auto-push.exp /app/auto-push.exp
RUN chmod +x /app/auto-push.exp

CMD ["/app/auto-push.exp"]

