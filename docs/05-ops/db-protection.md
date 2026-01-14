# L2C 数据库保护与系统迭代安全规划

> 基于项目现状分析，制定的数据库保护和版本迭代安全策略
> 
> **更新**: 整合团队建议，增加阿里云生产环境、双向迁移、审计日志等内容

## 一、现状分析

### 已有的基础设施
- ✅ Drizzle ORM + PostgreSQL 17
- ✅ 迁移文件管理 (`drizzle/` 目录)
- ✅ Docker 容器化部署
- ✅ 测试策略文档 (金字塔测试体系)
- ✅ 数据库重置脚本 (`scripts/reset-db.ts`)

### 需要加强的部分
- ❌ 数据库备份与恢复机制
- ❌ 迁移前的安全检查
- ❌ 生产环境数据保护
- ❌ 版本发布流程规范

---

## 二、数据库保护方案

### 2.1 备份策略

#### 本地开发环境
```bash
# 添加到 package.json scripts
"db:backup": "docker exec l2c-postgres pg_dump -U l2c_user l2c_dev > backups/dev_$(date +%Y%m%d_%H%M%S).sql",
"db:restore": "docker exec -i l2c-postgres psql -U l2c_user l2c_dev < "
```

#### 生产环境 (推荐)
1. **自动备份**: 使用 AWS RDS 自动备份或 pg_cron 定时任务
2. **备份频率**: 
   - 全量备份: 每日凌晨 2:00
   - 增量备份: 每 6 小时
3. **保留策略**: 保留最近 30 天的备份

### 2.2 迁移安全检查清单

在执行 `pnpm db:migrate` 前，必须完成以下检查：

```markdown
## 迁移前检查清单
- [ ] 已在本地测试环境验证迁移脚本
- [ ] 已备份当前数据库
- [ ] 迁移脚本不包含 DROP TABLE (除非明确需要)
- [ ] 迁移脚本不包含 TRUNCATE
- [ ] 新增列有默认值或允许 NULL
- [ ] 已评估迁移对现有数据的影响
- [ ] 已准备回滚脚本
```

### 2.3 危险操作保护

创建 `scripts/db-safe-migrate.ts`:

```typescript
// scripts/db-safe-migrate.ts
import 'dotenv/config';
import { execSync } from 'child_process';
import * as readline from 'readline';

const DANGEROUS_KEYWORDS = ['DROP TABLE', 'TRUNCATE', 'DELETE FROM', 'DROP COLUMN'];

async function main() {
  // 1. 检查是否为生产环境
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  检测到生产环境，需要额外确认');
    const confirmed = await confirm('确定要在生产环境执行迁移吗？(yes/no): ');
    if (confirmed !== 'yes') {
      console.log('❌ 迁移已取消');
      process.exit(0);
    }
  }

  // 2. 检查迁移文件中的危险操作
  const pendingMigrations = getPendingMigrations();
  for (const migration of pendingMigrations) {
    const content = readMigrationFile(migration);
    const dangers = DANGEROUS_KEYWORDS.filter(k => content.includes(k));
    if (dangers.length > 0) {
      console.log(`⚠️  迁移文件 ${migration} 包含危险操作: ${dangers.join(', ')}`);
      const confirmed = await confirm('确定要继续吗？(yes/no): ');
      if (confirmed !== 'yes') {
        console.log('❌ 迁移已取消');
        process.exit(0);
      }
    }
  }

  // 3. 自动备份
  console.log('📦 正在备份数据库...');
  execSync('pnpm db:backup', { stdio: 'inherit' });

  // 4. 执行迁移
  console.log('🚀 开始执行迁移...');
  execSync('pnpm db:migrate', { stdio: 'inherit' });

  console.log('✅ 迁移完成');
}

function confirm(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer); }));
}

function getPendingMigrations(): string[] {
  // 实现获取待执行迁移的逻辑
  return [];
}

function readMigrationFile(name: string): string {
  // 实现读取迁移文件内容的逻辑
  return '';
}

main();
```

---

## 三、系统迭代安全策略

### 3.1 版本发布流程

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   开发分支   │ -> │   测试环境   │ -> │   预发布环境  │ -> │   生产环境   │
│  (feature)  │    │  (staging)  │    │ (pre-prod)  │    │   (prod)    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      │                  │                  │                  │
      ▼                  ▼                  ▼                  ▼
   单元测试           集成测试           E2E测试           监控告警
   类型检查           数据库迁移         性能测试          回滚准备
```

### 3.2 发布前检查清单

```markdown
## 发布前检查清单

### 代码质量
- [ ] `pnpm type-check` 通过
- [ ] `pnpm lint` 通过
- [ ] `pnpm test:run` 所有单元测试通过
- [ ] `pnpm test:e2e` 核心流程 E2E 测试通过

### 数据库
- [ ] 迁移脚本已在测试环境验证
- [ ] 已准备回滚脚本
- [ ] 已评估数据迁移时间

### 部署
- [ ] Docker 镜像构建成功
- [ ] 环境变量配置正确
- [ ] 健康检查端点正常
```

### 3.3 回滚策略

#### 应用回滚
```bash
# 使用 Docker 回滚到上一版本
docker-compose -f docker-compose.prod.yml down
docker tag l2c-app:latest l2c-app:rollback
docker pull l2c-app:previous
docker-compose -f docker-compose.prod.yml up -d
```

#### 数据库回滚
```bash
# 恢复备份
docker exec -i l2c-postgres-prod psql -U l2c_user l2c < backup_before_migration.sql
```

### 3.4 推荐的 Git 分支策略

```
main (生产)
  │
  ├── develop (开发主线)
  │     │
  │     ├── feature/xxx (功能分支)
  │     └── fix/xxx (修复分支)
  │
  └── release/v1.x.x (发布分支)
```

---

## 四、推荐添加的 npm scripts

```json
{
  "scripts": {
    "db:backup": "tsx scripts/db-backup.ts",
    "db:restore": "tsx scripts/db-restore.ts",
    "db:safe-migrate": "tsx scripts/db-safe-migrate.ts",
    "pre-release": "pnpm type-check && pnpm lint && pnpm test:run",
    "release:check": "tsx scripts/release-check.ts"
  }
}
```

---

## 五、监控与告警 (生产环境)

### 5.1 数据库监控指标
- 连接数
- 查询响应时间
- 磁盘使用率
- 死锁检测

### 5.2 应用监控
- API 响应时间
- 错误率
- 内存使用
- CPU 使用

### 5.3 告警规则
- 数据库连接数 > 80% 时告警
- API 错误率 > 1% 时告警
- 磁盘使用率 > 85% 时告警

---

## 六、实施优先级

### 第一阶段 (立即实施)
1. ✅ 创建 `backups/` 目录并添加到 `.gitignore`
2. ✅ 添加 `db:backup` 和 `db:restore` 脚本
3. ✅ 创建迁移前检查清单文档

### 第二阶段 (1-2 周内)
1. 实现 `db-safe-migrate.ts` 脚本
2. 配置 CI/CD 流水线中的自动测试
3. 建立发布流程规范

### 第三阶段 (长期)
1. 配置生产环境自动备份
2. 建立监控告警系统
3. 定期进行灾难恢复演练

---

---

## 七、阿里云生产环境方案 (团队建议整合)

### 7.1 技术栈架构
- **数据库**: 阿里云 RDS PostgreSQL (生产) / Docker Postgres (开发)
- **存储**: 阿里云 OSS (内网访问模式)
- **部署**: 阿里云 ECS + Docker Compose + ACR (容器镜像服务)

### 7.2 双向迁移策略 (Migration First)

#### 核心准则
1. **禁止手动改库**: 严禁直接通过 SQL 修改生产环境表结构
2. **Schema 为准**: 所有变更必须先修改 `src/shared/api/schema.ts`
3. **双向迁移**: 每个 Up 迁移都要有对应的 Down 回滚脚本

#### 回滚脚本目录结构
```
drizzle/
├── 0000_bouncy_retro_girl.sql      # Up 迁移
├── 0001_windy_impossible_man.sql   # Up 迁移
├── rollback/
│   ├── 0000_rollback.sql           # Down 回滚
│   └── 0001_rollback.sql           # Down 回滚
└── meta/
```

#### 向后兼容原则
字段变更必须分两个版本：
- **版本 N**: 增加新字段，保持旧字段有效
- **版本 N+1**: 删除旧字段

### 7.3 三层回滚机制

| 层级 | 方式 | 适用场景 |
|-----|------|---------|
| 代码回滚 | `./deploy.sh rollback v1.0.0` | 功能 Bug |
| 轻量级 DB 回滚 | 执行 `rollback/*.sql` | 迁移问题 |
| 灾难级恢复 | 阿里云 RDS 按时间点还原 | 数据损坏 |

### 7.4 镜像版本化部署

```bash
# deploy.sh 示例
#!/bin/bash
VERSION=${1:-latest}
ACTION=${2:-deploy}

if [ "$ACTION" = "rollback" ]; then
  echo "🔄 回滚到版本: $VERSION"
  sed -i "s|image:.*l2c-app:.*|image: registry.cn-hangzhou.aliyuncs.com/l2c/app:$VERSION|" docker-compose.prod.yml
  docker-compose -f docker-compose.prod.yml up -d
else
  echo "🚀 部署版本: $VERSION"
  docker-compose -f docker-compose.prod.yml up -d
fi
```

**重要**: 禁止使用 `latest` 标签，每次部署必须打版本 Tag (如 `v1.0.1`)

---

## 八、L2C 业务安全补丁

### 8.1 订单状态锁定

当订单进入以下状态后，禁止修改关键财务字段：
- `SHIPPED` (已发货)
- `PAID` (已回款)
- `COMPLETED` (已完成)

```typescript
// 在订单更新逻辑中添加校验
const LOCKED_STATUSES = ['SHIPPED', 'PAID', 'COMPLETED'];
const PROTECTED_FIELDS = ['totalAmount', 'paidAmount', 'discount'];

function validateOrderUpdate(order: Order, updates: Partial<Order>) {
  if (LOCKED_STATUSES.includes(order.status)) {
    const changedProtectedFields = PROTECTED_FIELDS.filter(
      field => updates[field] !== undefined && updates[field] !== order[field]
    );
    if (changedProtectedFields.length > 0) {
      throw new Error(`订单状态为 ${order.status}，禁止修改: ${changedProtectedFields.join(', ')}`);
    }
  }
}
```

### 8.2 审计日志表

为 `orders` 和 `leads` 表建立审计日志：

```typescript
// schema.ts 中添加
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tableName: varchar('table_name', { length: 50 }).notNull(),
  recordId: uuid('record_id').notNull(),
  action: varchar('action', { length: 20 }).notNull(), // INSERT, UPDATE, DELETE
  userId: uuid('user_id').references(() => users.id),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  changedFields: text('changed_fields').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

```typescript
// 使用事务记录审计日志
async function updateOrderWithAudit(orderId: string, updates: Partial<Order>, userId: string) {
  return await db.transaction(async (tx) => {
    const [oldOrder] = await tx.select().from(orders).where(eq(orders.id, orderId));
    
    const [newOrder] = await tx.update(orders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    
    await tx.insert(auditLogs).values({
      tableName: 'orders',
      recordId: orderId,
      action: 'UPDATE',
      userId,
      oldValues: oldOrder,
      newValues: newOrder,
      changedFields: Object.keys(updates),
    });
    
    return newOrder;
  });
}
```

---

## 九、总结

通过以上规划，可以有效保护数据库安全并降低系统迭代风险：

| 风险类型 | 防护措施 |
|---------|---------|
| 数据丢失 | 定期备份 + RDS 按时间点还原 |
| 迁移失败 | 双向迁移 + 回滚脚本 |
| 代码缺陷 | 金字塔测试 + 镜像版本化回滚 |
| 部署故障 | 健康检查 + 秒级回滚 |
| 业务数据篡改 | 订单状态锁定 + 审计日志 |
| 权限泄露 | RBAC + 安全测试 |
