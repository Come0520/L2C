---
name: l2c-db-migration
description: 负责 Drizzle ORM 的 Schema 变更、迁移脚本生成及数据库安全校验
---

# 数据库操作指南

1. **Schema 变更流**：
   - 禁止直接操作数据库。必须修改 `src/db/schema.ts`。
   - 运行 `npx drizzle-kit generate` 生成迁移 SQL。
   - 检查生成的 SQL，确保没有破坏性操作（如直接 DROP 字段）。

2. **双向迁移要求**：
   - 每次生成 `up` 迁移时，必须同步提供对应的 `down` (回滚) SQL 脚本。
   - 存放在 `drizzle/migrations/rollback/` 目录下。

3. **安全准则**：
   - 涉及金额、订单状态的修改必须包裹在 `db.transaction()` 中。
   - 确保 `DATABASE_URL` 仅通过环境变量读取，严禁硬编码。
   - 提醒用户检查阿里云 RDS 的 VPC 白名单设置。
