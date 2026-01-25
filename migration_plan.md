# Docker数据库表结构迁移到RDS方案

## 一、迁移概述

将Docker PostgreSQL数据库的102张表结构迁移到阿里云RDS数据库。

### 数据库信息对比

| 项目     | Docker数据库     | RDS数据库                                     |
| -------- | ---------------- | --------------------------------------------- |
| 数据库名 | l2c_dev          | l2c                                           |
| 用户名   | l2c_user         | l2c                                           |
| 密码     | l2c_dev_password | I@rds2026                                     |
| 表数量   | 102张            | 待确认                                        |
| 连接地址 | localhost:5433   | pgm-uf6aq31y169c8wvl.pg.rds.aliyuncs.com:5432 |

## 二、迁移方案

### 方案一：通过阿里云DMS工具执行（推荐）

#### 步骤1：登录阿里云DMS

1. 访问：https://dms.console.aliyun.com/
2. 选择"数据管理" → "数据库开发"
3. 点击"新建数据库连接"

#### 步骤2：配置RDS连接

- 连接名称：`l2c-rds`
- 数据库类型：PostgreSQL
- 主机地址：`pgm-uf6aq31y169c8wvl.pg.rds.aliyuncs.com`
- 端口：`5432`
- 数据库名：`l2c`
- 用户名：`l2c`
- 密码：`I@rds2026`

#### 步骤3：执行DDL

1. 在DMS中打开SQL窗口
2. 打开文件：`schema.sql`（已从Docker导出）
3. 点击"执行"按钮
4. 等待执行完成

### 方案二：通过psql命令行执行

#### 步骤1：安装psql客户端

```bash
# Windows（使用Chocolatey）
choco install postgresql

# 或下载安装包
# https://www.postgresql.org/download/windows/
```

#### 步骤2：连接RDS并执行DDL

```bash
psql -h pgm-uf6aq31y169c8wvl.pg.rds.aliyuncs.com -p 5432 -U l2c -d l2c -f schema.sql
```

### 方案三：通过MCP服务器执行（需要外网地址）

如果RDS配置了外网地址，可以通过MCP服务器执行SQL：

1. 配置PostgreSQL MCP服务器
2. 使用query_sql工具执行DDL语句
3. 逐个表或批量执行

## 三、DDL文件说明

### 文件位置

- **文件名**：`schema.sql`
- **文件大小**：246KB
- **包含内容**：102张表的完整DDL定义

### DDL内容结构

```sql
-- PostgreSQL database dump
--
-- 包含：
-- 1. Schema定义
-- 2. 数据类型定义（ENUM等）
-- 3. 表结构定义（CREATE TABLE）
-- 4. 约束定义（PRIMARY KEY, FOREIGN KEY等）
-- 5. 索引定义（CREATE INDEX）
```

### 主要表列表

1. users - 用户信息
2. customers - 客户信息
3. orders - 订单信息
4. products - 产品信息
5. quotes - 报价单
6. inventory - 库存记录
7. work_orders - 工单信息
8. install_tasks - 安装任务
9. measure_tasks - 测量任务
10. payment_orders - 支付订单
    ...（共102张表）

## 四、执行注意事项

### 1. 数据库名称差异

- Docker数据库名：`l2c_dev`
- RDS数据库名：`l2c`
- **注意**：DDL中的数据库名称需要调整

### 2. Schema处理

- DDL中包含`drizzle` schema
- RDS数据库可能只需要`public` schema
- 执行时注意schema名称

### 3. 权限问题

- 确保RDS用户有创建表的权限
- 建议使用超级用户或具有DDL权限的用户

### 4. 依赖关系

- 表之间有外键约束
- 建议按依赖顺序执行DDL
- 或先禁用外键约束，创建表后再启用

## 五、验证步骤

### 1. 检查表数量

```sql
SELECT COUNT(*) FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema');
```

### 2. 检查表结构

```sql
SELECT
    schemaname,
    tablename,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
GROUP BY schemaname, tablename
ORDER BY schemaname, tablename;
```

### 3. 检查约束

```sql
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;
```

## 六、回滚方案

如果执行失败，可以回滚：

### 方案1：删除所有表

```sql
-- 谨慎使用！
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

### 方案2：使用备份

- 在执行DDL前，先备份RDS数据库
- 如果失败，从备份恢复

## 七、后续数据迁移

表结构迁移完成后，可以迁移数据：

### 1. 使用pg_dump导出数据

```bash
pg_dump -h localhost -p 5433 -U l2c_user -d l2c_dev --data-only -f data.sql
```

### 2. 导入数据到RDS

```bash
psql -h pgm-uf6aq31y169c8wvl.pg.rds.aliyuncs.com -p 5432 -U l2c -d l2c -f data.sql
```

### 3. 验证数据一致性

```sql
-- 比较行数
SELECT
    tablename,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

## 八、常见问题

### Q1: 执行DDL时提示表已存在

**A**: 先删除已存在的表或使用`IF NOT EXISTS`语法

### Q2: 外键约束失败

**A**: 先禁用外键约束，创建表后再启用

### Q3: 权限不足

**A**: 使用具有DDL权限的用户执行，或联系管理员授权

### Q4: 连接超时

**A**: 检查白名单配置，确认外网地址已申请

## 九、执行清单

- [ ] 确认RDS外网地址已申请
- [ ] 确认白名单配置正确
- [ ] 备份RDS数据库（可选）
- [ ] 选择执行方案（DMS/psql/MCP）
- [ ] 执行schema.sql文件
- [ ] 验证表数量（应为102张）
- [ ] 验证表结构正确性
- [ ] 检查约束和索引
- [ ] 记录执行日志
- [ ] 制定数据迁移计划

---

**文档版本**: 1.0
**创建时间**: 2026-01-25
**DDL文件**: schema.sql
**预计执行时间**: 5-10分钟
