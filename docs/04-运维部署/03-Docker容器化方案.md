# 罗莱L2C销售管理系统 - 本地开发环境与私有化部署方案 v2.0

## 1. 方案概述

本方案基于 **Next.js + Supabase** 技术栈，重新定义了容器化与部署策略。原有的基于 Docker Compose 的微服务编排方案（包含 Nginx, Redis Cluster, ELK 等）已简化为 **Supabase 本地开发环境** 和 **Next.js Standalone 容器**。

### 核心变更
- **开发环境**：使用 Supabase CLI (`npx supabase start`) 自动管理本地 Docker 容器，替代手写的 `docker-compose.dev.yml`。
- **生产环境 (SaaS)**：推荐使用 **Vercel (前端/API)** + **Supabase Cloud (后端/数据库)**，无需自行维护容器。
- **生产环境 (私有化)**：提供基于 Supabase Docker 和 Next.js Standalone 的私有化部署方案。

## 2. 本地开发环境 (Supabase Local Dev)

本地开发环境完全基于 Supabase CLI，它在底层使用 Docker 运行完整的 Supabase 堆栈。

### 2.1 架构组件
本地启动 `npx supabase start` 后，Docker 将运行以下容器：
- **Studio**: 本地仪表板 (http://localhost:54323)
- **Kong**: API 网关
- **GoTrue**: 认证服务 (Auth)
- **PostgREST**: 自动 REST API
- **Realtime**: 实时广播服务
- **Storage**: 对象存储服务
- **PostgreSQL**: 核心数据库 (带扩展)
- **Edge Functions**: 边缘函数运行时 (Deno)

### 2.2 配置文件 (config.toml)
替代原有的复杂 Docker Compose 配置，所有后端服务配置通过 `supabase/config.toml` 管理。

```toml
# supabase/config.toml 示例
project_id = "your-project-id"

[api]
enabled = true
port = 54321
schemas = ["public", "storage", "graphql_public"]

[db]
port = 54322
major_version = 15

[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/**"]
jwt_expiry = 3600

[storage]
enabled = true
file_size_limit = "50MiB"

[edge_runtime]
enabled = true
policy = "per_function"
```

### 2.3 启动与管理
```bash
# 启动本地环境 (自动拉取并运行 Docker 镜像)
npx supabase start

# 查看服务状态与密钥
npx supabase status

# 停止服务
npx supabase stop

# 重置数据库 (清除数据并重新应用迁移)
npx supabase db reset
```

## 3. 私有化部署方案 (Self-Hosting)

针对需要私有化部署的场景（如客户内部机房），采用 **Supabase Docker** + **Next.js Docker** 的组合。

### 3.1 部署架构图
```mermaid
graph TB
    subgraph "宿主机 / K8s Node"
        proxy[Nginx / Kong Gateway]
        
        subgraph "前端应用"
            nextjs[Next.js App (Standalone Docker)]
        end
        
        subgraph "后端服务 (Supabase Docker)"
            auth[GoTrue (Auth)]
            rest[PostgREST]
            realtime[Realtime]
            storage[Storage API]
            meta[Postgres Meta]
            
            db[(PostgreSQL DB)]
        end
    end
    
    client[客户端浏览器] --> proxy
    proxy --> nextjs
    proxy --> auth
    proxy --> rest
    proxy --> realtime
    
    nextjs --> auth
    nextjs --> rest
    nextjs --> db
    
    auth --> db
    rest --> db
    realtime --> db
    storage --> db
```

### 3.2 Next.js 应用容器化
使用 Next.js 的 `output: 'standalone'` 模式构建轻量级生产镜像。

#### Dockerfile
```dockerfile
FROM node:18-alpine AS base

# 1. 依赖安装阶段
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 2. 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
# 设置构建时的环境变量
ENV NEXT_PUBLIC_SUPABASE_URL=http://your-supabase-url:8000
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
RUN npm run build

# 3. 运行阶段
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制 standalone 构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 3.3 Supabase 服务部署
私有化部署 Supabase 建议直接使用官方提供的 Docker Compose 编排。

1.  **获取官方配置**：
    ```bash
    git clone --depth 1 https://github.com/supabase/supabase
    cd supabase/docker
    cp .env.example .env
    ```

2.  **配置关键参数 (.env)**：
    ```bash
    # 生成随机密钥
    JWT_SECRET=your-super-secret-jwt-token-at-least-32-chars-long
    ANON_KEY=your-generated-anon-key
    SERVICE_ROLE_KEY=your-generated-service-key
    
    # 数据库密码
    POSTGRES_PASSWORD=your-secure-db-password
    
    # 外部访问 URL
    API_EXTERNAL_URL=http://your-server-ip:8000
    ```

3.  **启动服务**：
    ```bash
    docker compose up -d
    ```

## 4. CI/CD 集成

在 GitHub Actions 中使用 Supabase CLI 进行自动化部署，不再需要构建和推送自定义后端镜像。

```yaml
# .github/workflows/production.yml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      
      # 链接到 Supabase Cloud 项目
      - run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          
      # 部署数据库迁移
      - run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          
      # 部署 Edge Functions
      - run: supabase functions deploy
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

## 5. 总结

| 环境 | 部署方式 | 数据库 | 应用服务 |
|------|----------|--------|----------|
| **本地开发** | Supabase CLI (Docker) | 本地 Docker 容器 | `npm run dev` (本地 Node) |
| **SaaS 生产** | Vercel + Supabase Cloud | Supabase Cloud (AWS) | Vercel Edge / Serverless |
| **私有化部署** | Docker Compose | Supabase Docker 堆栈 | Next.js Standalone 容器 |

本方案移除了原有的 Redis 独立集群、RabbitMQ 和微服务容器，通过 Supabase 的一体化架构极大地简化了运维复杂度。
