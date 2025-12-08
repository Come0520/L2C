# L2C Next.js 生产环境 Dockerfile
# 多阶段构建，优化镜像体积和安全性

# ==================== 阶段1: 依赖安装 ====================
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# ==================== 阶段2: 构建应用 ====================
FROM node:18-alpine AS builder
WORKDIR /app

# 从依赖阶段复制node_modules
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置环境变量（仅用于构建，不包含业务配置）
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 构建应用（使用standalone输出，不包含运行时配置）
RUN npm run build

# ==================== 阶段3: 运行时环境 ====================
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 设置正确的权限
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
