# L2C 生产环境连接池管理方案

> 版本: v1.0 | 日期: 2026-01-22 | 状态: 待评审

## 1. 背景与问题分析

### 1.1 当前配置

| 组件 | 现状 |
|:---|:---|
| **数据库驱动** | postgres.js (原生 PostgreSQL 协议) |
| **连接池** | postgres.js 内置连接池，最大连接数通过 `DB_MAX_CONNECTIONS` 配置 |
| **默认值** | 20 个连接 |

### 1.2 生产环境挑战

```
问题场景：Next.js Serverless 部署 + PostgreSQL

┌─────────────────────────────────────────────────────────────┐
│                    Next.js 多实例部署                        │
├─────────────────────────────────────────────────────────────┤
│  实例1 (20连接)  │  实例2 (20连接)  │  实例3 (20连接)  │ ... │
│       ↓                 ↓                 ↓                 │
│       └─────────────────┼─────────────────┘                 │
│                         ↓                                   │
│            PostgreSQL (max_connections=100)                 │
│                    ⚠️ 连接耗尽风险                          │
└─────────────────────────────────────────────────────────────┘
```

**核心问题：**
1. **连接膨胀**: 每个 Next.js 实例独立维护连接池，3 个实例 × 20 连接 = 60 连接
2. **冷启动延迟**: 每个请求可能触发新连接创建
3. **连接泄漏**: 应用崩溃时连接无法正确释放
4. **资源浪费**: 空闲连接占用数据库资源

---

## 2. 解决方案：PgBouncer 连接池

### 2.1 架构设计

```
                          推荐架构 (带 PgBouncer)
┌──────────────────────────────────────────────────────────────────┐
│                    Next.js 多实例部署                             │
├──────────────────────────────────────────────────────────────────┤
│  实例1 (5连接)  │  实例2 (5连接)  │  实例3 (5连接)  │ 实例N ...  │
│       ↓                 ↓                 ↓                      │
│       └─────────────────┼─────────────────┘                      │
│                         ↓                                        │
│           ┌─────────────────────────────┐                        │
│           │        PgBouncer            │                        │
│           │   (Transaction Pooling)     │                        │
│           │   前端连接: 100+            │                        │
│           │   后端连接: 20              │                        │
│           └─────────────┬───────────────┘                        │
│                         ↓                                        │
│            PostgreSQL (max_connections=50)                       │
│                    ✅ 资源优化                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 PgBouncer 连接模式对比

| 模式 | 适用场景 | L2C 适配性 |
|:---|:---|:---|
| **Session** | 长连接应用 | ❌ 不推荐 |
| **Transaction** | 短事务 Web 应用 | ✅ **推荐** |
| **Statement** | 简单查询 (无事务) | ❌ 不适用 |

> [!IMPORTANT]
> L2C 使用 Drizzle ORM 的事务功能，**必须使用 Transaction 模式**

---

## 3. Docker Compose 生产配置

### 3.1 完整配置文件

```yaml
# docker-compose.prod.yml (更新版)

services:
  # Next.js 应用
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: l2c-app
    restart: unless-stopped
    deploy:
      replicas: 3  # 多实例部署
    environment:
      - NODE_ENV=production
      # 连接到 PgBouncer，而非直连 PostgreSQL
      - DATABASE_URL=postgres://l2c_user:${POSTGRES_PASSWORD}@pgbouncer:6432/l2c
      - DB_MAX_CONNECTIONS=5  # 每个实例减少到 5 个连接
      - AUTH_SECRET=${AUTH_SECRET}
    depends_on:
      pgbouncer:
        condition: service_healthy
    networks:
      - l2c-network

  # PgBouncer 连接池
  pgbouncer:
    image: bitnami/pgbouncer:1.22.1
    container_name: l2c-pgbouncer
    restart: unless-stopped
    ports:
      - "6432:6432"
    environment:
      # 数据库配置
      PGBOUNCER_DATABASE: l2c
      POSTGRESQL_HOST: postgres
      POSTGRESQL_PORT: 5432
      POSTGRESQL_USERNAME: l2c_user
      POSTGRESQL_PASSWORD: ${POSTGRES_PASSWORD}
      
      # 连接池配置
      PGBOUNCER_POOL_MODE: transaction
      PGBOUNCER_MAX_CLIENT_CONN: 200      # 最大前端连接数
      PGBOUNCER_DEFAULT_POOL_SIZE: 20     # 每个数据库的默认后端连接数
      PGBOUNCER_MIN_POOL_SIZE: 5          # 最小保持连接数
      PGBOUNCER_RESERVE_POOL_SIZE: 5      # 预留连接数
      PGBOUNCER_RESERVE_POOL_TIMEOUT: 3   # 预留连接等待超时(秒)
      PGBOUNCER_MAX_DB_CONNECTIONS: 30    # 单数据库最大后端连接
      PGBOUNCER_MAX_USER_CONNECTIONS: 30  # 单用户最大后端连接
      
      # 连接生命周期
      PGBOUNCER_SERVER_IDLE_TIMEOUT: 600  # 空闲连接超时(秒)
      PGBOUNCER_SERVER_LIFETIME: 3600     # 连接最大生命周期(秒)
      PGBOUNCER_CLIENT_IDLE_TIMEOUT: 0    # 客户端空闲超时(0=禁用)
      
      # 认证方式
      PGBOUNCER_AUTH_TYPE: scram-sha-256
      PGBOUNCER_IGNORE_STARTUP_PARAMETERS: extra_float_digits
    healthcheck:
      test: ["CMD", "pg_isready", "-h", "localhost", "-p", "6432"]
      interval: 10s
      timeout: 5s
      retries: 5
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - l2c-network

  # PostgreSQL 数据库
  postgres:
    image: postgres:17-alpine
    container_name: l2c-postgres-prod
    restart: unless-stopped
    environment:
      POSTGRES_DB: l2c
      POSTGRES_USER: l2c_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      # 优化 PostgreSQL 配置
      POSTGRES_INITDB_ARGS: "--auth-host=scram-sha-256"
    command:
      - "postgres"
      - "-c"
      - "max_connections=50"           # 减少最大连接数
      - "-c"
      - "shared_buffers=256MB"         # 共享缓冲区
      - "-c"
      - "effective_cache_size=768MB"   # 有效缓存大小
      - "-c"
      - "work_mem=16MB"                # 工作内存
      - "-c"
      - "maintenance_work_mem=128MB"   # 维护工作内存
    volumes:
      - l2c_postgres_data:/var/lib/postgresql/data
    networks:
      - l2c-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U l2c_user -d l2c"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    container_name: l2c-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - l2c-network

networks:
  l2c-network:
    driver: bridge

volumes:
  l2c_postgres_data:
    name: l2c_postgres_prod_data
```

### 3.2 环境变量配置 (.env.production)

```bash
# .env.production

# PostgreSQL
POSTGRES_PASSWORD=<生成强密码>
POSTGRES_DB=l2c
POSTGRES_USER=l2c_user

# 应用连接到 PgBouncer
DATABASE_URL=postgres://l2c_user:${POSTGRES_PASSWORD}@pgbouncer:6432/l2c
DB_MAX_CONNECTIONS=5

# NextAuth
AUTH_SECRET=<生成安全密钥>
AUTH_URL=https://yourdomain.com
```

---

## 4. 应用代码适配

### 4.1 当前 db.ts 代码 (无需修改)

```typescript
// src/shared/api/db.ts - 当前代码已兼容 PgBouncer

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '@/shared/config/env';

const connectionString = env.DATABASE_URL;

const client = postgres(connectionString, {
    max: env.DB_MAX_CONNECTIONS,  // 配置为 5
    idle_timeout: 30,
    connect_timeout: 10,
    prepare: true,  // ⚠️ 需要关注
});

export const db = drizzle(client, { schema });
```

### 4.2 可选优化: 禁用 Prepared Statements

> [!WARNING]
> PgBouncer Transaction 模式与 Prepared Statements 存在兼容性问题

如果遇到 `prepared statement does not exist` 错误，修改 `db.ts`:

```typescript
// src/shared/api/db.ts - 优化版本

const client = postgres(connectionString, {
    max: env.DB_MAX_CONNECTIONS,
    idle_timeout: 30,
    connect_timeout: 10,
    prepare: false,  // 禁用 Prepared Statements
});
```

或者配置 PgBouncer 支持 Prepared Statements (需要 1.21+):

```yaml
# docker-compose.prod.yml 中添加
PGBOUNCER_MAX_PREPARED_STATEMENTS: 100
```

---

## 5. 阿里云 RDS 部署方案

### 5.1 使用阿里云 RDS 时的架构

```
┌────────────────────────────────────────────────────────────────┐
│                        阿里云 ECS / K8s                         │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ Next.js  │  │ Next.js  │  │ Next.js  │                      │
│  │ 实例 1   │  │ 实例 2   │  │ 实例 N   │                      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                      │
│       │             │             │                            │
│       └─────────────┼─────────────┘                            │
│                     ↓                                          │
│           ┌─────────────────────┐                              │
│           │     PgBouncer       │  (部署在 ECS 上)             │
│           │  (Sidecar 或独立)   │                              │
│           └──────────┬──────────┘                              │
└──────────────────────┼─────────────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────────┐
│                    阿里云 RDS PostgreSQL                      │
│              (高可用版，主从复制，自动备份)                    │
│                                                              │
│  配置建议:                                                   │
│  - 规格: pg.n2.small.2c (2核4GB) 起步                        │
│  - 存储: 100GB ESSD PL1                                      │
│  - 备份: 7天自动备份 + PITR                                  │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 RDS 连接字符串格式

```bash
# 阿里云 RDS PostgreSQL 连接
DATABASE_URL=postgresql://l2c_user:<password>@rm-bp1xxxxxx.pg.rds.aliyuncs.com:5432/l2c?sslmode=require
```

### 5.3 RDS 参数组配置建议

| 参数 | 建议值 | 说明 |
|:---|:---|:---|
| `max_connections` | 200 | RDS 默认值通常足够 |
| `shared_buffers` | 25% 内存 | RDS 自动调整 |
| `log_statement` | ddl | 仅记录 DDL 操作 |
| `idle_in_transaction_session_timeout` | 30000 | 30秒事务超时 |

---

## 6. 监控与运维

### 6.1 PgBouncer 监控指标

```sql
-- 连接到 PgBouncer 的 admin 库
psql -h localhost -p 6432 -U pgbouncer pgbouncer

-- 查看连接池状态
SHOW POOLS;

-- 查看客户端连接
SHOW CLIENTS;

-- 查看服务端连接
SHOW SERVERS;

-- 查看统计信息
SHOW STATS;
```

### 6.2 关键指标告警阈值

| 指标 | 警告阈值 | 严重阈值 |
|:---|:---|:---|
| 活跃连接率 | > 70% | > 90% |
| 等待队列 | > 5 | > 20 |
| 平均等待时间 | > 100ms | > 500ms |
| 连接错误率 | > 1% | > 5% |

### 6.3 Prometheus 监控配置

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'pgbouncer'
    static_configs:
      - targets: ['pgbouncer:9127']
    metrics_path: /metrics
```

---

## 7. 性能对比

| 场景 | 直连 PostgreSQL | 使用 PgBouncer |
|:---|:---|:---|
| **3 实例 × 20 连接** | 60 个数据库连接 | 20 个数据库连接 |
| **冷启动延迟** | ~50-100ms/连接 | ~5ms (复用连接) |
| **连接泄漏风险** | 高 | 低 (自动超时回收) |
| **PostgreSQL 负载** | 高 | 低 |
| **水平扩展能力** | 受限于 max_connections | 几乎无限制 |

---

## 8. 验证清单

- [ ] PgBouncer 容器正常启动 (`docker-compose logs pgbouncer`)
- [ ] 应用能通过 PgBouncer 连接数据库
- [ ] 事务功能正常工作 (测试 Drizzle 事务)
- [ ] 连接池指标可监控 (`SHOW POOLS;`)
- [ ] 负载测试通过 (100 并发请求)

---

## 9. 总结

> [!TIP]
> **推荐的最终配置**
> - PgBouncer: Transaction 模式, 20 后端连接
> - Next.js: 每实例 5 连接
> - PostgreSQL: max_connections=50
> - 阿里云 RDS: 高可用版 + 自动备份
