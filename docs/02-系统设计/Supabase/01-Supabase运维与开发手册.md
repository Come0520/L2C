# Supabase 运维与开发手册

本文档整合了 Supabase 的开发指南、监控配置及性能优化策略，旨在为开发和运维团队提供一站式的参考手册。

---

## 第一部分：开发指南 (Development Guide)

### 1. Supabase 简介

Supabase 是一个开源的 Backend-as-a-Service (BaaS) 平台，提供了构建现代化 Web 应用所需的所有后端功能。它基于 PostgreSQL 数据库，提供了认证、实时数据同步、对象存储、边缘函数等功能。

**核心价值主张**：Build in a weekend, scale to millions.

#### 1.1 与传统后端的区别

| 特性 | 传统后端 (NestJS/Express) | Supabase |
|-----|-------------------------|----------|
| 数据库 | 需要自行配置和维护 | 托管的 PostgreSQL 数据库 |
| 认证 | 需要自行实现 JWT 认证 | 内置的 Auth 系统 |
| 实时数据 | 需要自行实现 WebSocket | 内置的 Realtime 引擎 |
| 存储 | 需要自行配置对象存储 | 内置的 Storage 服务 |
| 部署 | 需要自行部署和维护服务器 | 自动部署和扩展 |
| 维护成本 | 较高 | 较低 |

### 2. 核心功能概览

- **认证 (Auth)**：支持邮箱/密码、OAuth (Google, GitHub, 微信等)、Magic Link、匿名登录。
- **数据库 (Database)**：完整 PostgreSQL 支持，自动生成 PostgREST API，支持 RLS (行级安全)，支持 pgvector/pg_cron 等扩展。
- **实时数据 (Realtime)**：基于 WAL 日志，支持 INSERT/UPDATE/DELETE 事件订阅，支持广播和 Presence。
- **对象存储 (Storage)**：支持文件夹结构、RLS 权限控制、图片处理。
- **边缘函数 (Edge Functions)**：基于 Deno 运行时，低延迟，支持 Webhooks。

### 3. 开发环境设置

#### 3.1 安装 Supabase CLI

```bash
# 使用 npm 安装
npm install -g supabase

# 或使用 brew (macOS)
brew install supabase/tap/supabase
```

#### 3.2 初始化与启动

```bash
# 登录 Supabase
supabase login

# 初始化本地项目
supabase init

# 启动本地开发环境 (包含 DB, Studio, Auth, Storage 等)
supabase start
```

#### 3.3 连接配置 (Next.js)

**安装 SDK**:
```bash
npm install @supabase/supabase-js
```

**客户端初始化**:
```typescript
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

export function createClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 4. Next.js 集成模式

#### 4.1 Server Components (数据获取)
```typescript
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = createClient()
  const { data } = await supabase.from('table').select('*')
  return <pre>{JSON.stringify(data, null, 2)}</pre>
}
```

#### 4.2 Server Actions (数据变更)
```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitData(formData: FormData) {
  const supabase = createClient()
  await supabase.from('table').insert({ name: formData.get('name') })
  revalidatePath('/path')
}
```

### 5. RLS 安全策略 (Row Level Security)

**原则**：Never trust the client. 所有安全控制下沉到数据库层。

**示例策略**：

1. **用户只能查看自己的资料**:
   ```sql
   CREATE POLICY "Users can view own profile" ON users
   FOR SELECT USING (id = auth.uid());
   ```

2. **管理员查看所有**:
   ```sql
   CREATE POLICY "Admins view all" ON users
   FOR SELECT USING (auth.jwt()->>'role' = 'admin');
   ```

---

## 第二部分：监控配置 (Monitoring Configuration)

### 1. 监控仪表盘 (Dashboard)

#### 1.1 访问路径
Supabase Console -> Project -> **Reports** / **Database**

#### 1.2 关键监控指标
- **API Requests**: 监控请求量突增或异常跌落。
- **Database Health**:
  - **CPU Usage**: 持续超过 80% 需警惕。
  - **RAM Usage**: 内存不足会导致 Swap 甚至 OOM。
  - **Disk IO**: IOPS 瓶颈会严重拖慢查询。
  - **Active Connections**: 接近最大连接数时需考虑连接池 (Supavisor)。
- **Auth**: 新增用户数、活跃用户数、失败登录尝试。

### 2. 告警规则配置 (Alerts)

#### 2.1 配置路径
Supabase Console -> Project -> **Database** -> **Alerts** (部分功能需通过集成第三方监控如 Grafana/PMM 实现，或使用 Supabase 提供的 Log Drains)。

*注：Supabase 原生告警功能正在完善中，建议结合 Log Drains 导出日志到监控平台。*

#### 2.2 推荐告警阈值

| 指标 | 阈值 | 级别 | 建议行动 |
|------|------|------|----------|
| CPU 使用率 | > 80% (持续5分钟) | Warning | 检查慢查询，考虑升配 |
| 内存使用率 | > 85% | Critical | 检查内存泄漏，优化查询 |
| 磁盘使用率 | > 90% | Critical | 清理日志，扩容存储 |
| 数据库连接数 | > 90% Max | Warning | 检查连接泄露，调整 Pool Size |
| 5xx 错误率 | > 1% | Critical | 检查应用日志，数据库状态 |
| 慢查询数量 | > 10/小时 (耗时>1s) | Warning | 运行 `EXPLAIN ANALYZE` 优化 |

---

## 第三部分：性能优化 (Performance Optimization)

### 1. 性能分析工具

#### 1.1 pg_stat_statements
这是 PostgreSQL 最强大的性能分析插件，记录了所有 SQL 语句的执行统计。

**常用分析 SQL**:

1. **查看执行时间最长的 TOP 50 查询**:
   ```sql
   SELECT 
     substring(query, 1, 50) as query_snippet,
     calls,
     round(total_exec_time::numeric, 2) as total_time,
     round(mean_exec_time::numeric, 2) as mean_time,
     round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 2) as percent_total
   FROM pg_stat_statements
   ORDER BY total_exec_time DESC
   LIMIT 50;
   ```

2. **查看表大小排行**:
   ```sql
   SELECT 
     schemaname,
     relname,
     pg_size_pretty(pg_total_relation_size(relid)) AS total_size
   FROM pg_catalog.pg_statio_user_tables
   ORDER BY pg_total_relation_size(relid) DESC;
   ```

3. **查看未使用的索引**:
   ```sql
   SELECT
     schemaname, relname, indexrelname
   FROM pg_stat_user_indexes
   WHERE idx_scan = 0 AND idx_tup_read = 0;
   ```

### 2. 定期检查流程

#### 2.1 每周检查
1. **慢查询审查**: 检查 `pg_stat_statements` 中 `mean_exec_time` > 100ms 的查询。
2. **索引使用**: 确认新上线的业务查询是否命中了索引。
3. **连接池**: 检查 `pg_stat_activity` 中的 `waiting` 状态连接数。

#### 2.2 每月深度分析
1. **索引清理**: 删除长期未使用的索引（注意：确保不是为低频但关键的查询保留的）。
2. **表膨胀 (Bloat)**: 检查是否需要手动 `VACUUM FULL` (谨慎操作，会锁表) 或调整自动 Vacuum 策略。
3. **容量规划**: 根据磁盘和资源增长趋势，评估是否需要升级套餐。

### 3. 最佳实践

#### 3.1 查询优化
- **避免 `SELECT *`**: 仅获取所需字段，减少网络传输和内存开销。
- **避免 N+1 查询**: 在应用层使用 `.select('*, relation(*)')` 或 Join，而不是循环查询。
- **分页**: 对大表使用基于游标的分页 (Cursor-based pagination) 而非 `OFFSET/LIMIT`。

#### 3.2 索引策略
- **外键必建索引**: 用于 Join 和级联删除。
- **RLS 字段**: 在 RLS 策略中使用的字段（如 `user_id`, `organization_id`）必须建立索引，否则每次查询都会全表扫描。
- **部分索引**: 对状态字段（如 `status = 'active'`）建立部分索引，减小索引体积。

#### 3.3 连接池 (Connection Pooling)
- Serverless 环境（如 Next.js API Routes / Edge Functions）**必须**使用连接池（Supabase 提供的 Transaction Mode 端口 6543）。
- 避免在长连接环境中使用 Transaction Mode，应使用 Session Mode。

---

**文档维护**：开发团队
**最后更新**：2025-12-07
