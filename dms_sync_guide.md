# DMS 数据库同步执行指南

> **目标**: 将线下Docker的数据库架构同步到线上RDS
> **执行位置**: DMS控制台 → `pgm-uf6aq31y169c8wvl` → `l2c` 数据库

---

## ⚠️ 执行前检查

1. ✅ 确保已备份线上数据库
2. ✅ 在DMS选择正确的数据库 (`l2c`)
3. ✅ 按照下面的顺序执行

---

## 第一步：创建枚举类型

在DMS SQL窗口中执行以下内容（如果类型已存在会报错，可忽略）：

复制以下文件内容的 **第47行到第978行**:
📂 [schema.sql](file:///c:/Users/bigey/Documents/Antigravity/L2C/alibabacloud-rds-openapi-mcp-server/schema.sql)

或者使用以下命令生成只包含枚举类型的SQL:

```powershell
# 在项目目录执行
Get-Content ".\alibabacloud-rds-openapi-mcp-server\schema.sql" | Select-String -Pattern "CREATE TYPE" -Context 0,10 | Out-File "enum_types.sql"
```

---

## 第二步：创建缺失表（核心）

直接复制 [fix_schema.sql](file:///c:/Users/bigey/Documents/Antigravity/L2C/fix_schema.sql) 全部内容到DMS执行。

**建议分批执行**：

- 第1批：1-400行
- 第2批：401-800行
- 第3批：801-1200行
- 第4批：1201-1803行

---

## 第三步：验证同步结果

执行以下SQL验证表是否创建成功：

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

---

## 快速命令（如果有psql访问权限）

```powershell
# 方法1：直接执行完整的schema.sql（推荐，会覆盖创建所有对象）
$env:PGPASSWORD='I@rds2026'; psql -h pgm-uf6aq31y169c8wvl.pg.rds.aliyuncs.com -U l2c -d l2c -f ".\alibabacloud-rds-openapi-mcp-server\schema.sql"

# 方法2：只执行增量修复
$env:PGPASSWORD='I@rds2026'; psql -h pgm-uf6aq31y169c8wvl.pg.rds.aliyuncs.com -U l2c -d l2c -f ".\fix_schema.sql"
```

---

## 常见错误处理

| 错误信息                        | 解决方案                 |
| ------------------------------- | ------------------------ |
| `type "xxx" does not exist`     | 先执行第一步创建枚举类型 |
| `relation "xxx" already exists` | 表已存在，可忽略         |
| `duplicate key`                 | 可忽略，数据已存在       |
