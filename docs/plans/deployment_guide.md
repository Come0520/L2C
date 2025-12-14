# 批量操作功能部署指南

> **创建时间**: 2025-12-13 00:28  
> **Supabase项目**: rdpiajialjnmngnaokix  
> **项目URL**: https://rdpiajialjnmngnaokix.supabase.co

---

## 📋 部署前准备

### 需要的信息
- ✅ Supabase项目URL: `rdpiajialjnmngnaokix.supabase.co`
- ❓ 数据库密码（Supabase Dashboard → Settings → Database）
- ❓ Anon/Service Key（用于Edge Function）

---

## 🚀 部署步骤

### Step 1: 链接到Supabase项目

```bash
cd /Users/laichangcheng/Documents/文稿\ -\ 来长城的MacBook\ Air/trae/L2C

# 链接项目（需要输入数据库密码）
supabase link --project-ref rdpiajialjnmngnaokix
```

**如果遇到网络问题**，可以尝试：
```bash
# 使用代理（如果有的话）
export HTTPS_PROXY=http://your-proxy:port

# 或者手动配置
supabase link --project-ref rdpiajialjnmngnaokix --password <your-db-password>
```

---

### Step 2: 执行数据库迁移

```bash
# 推送所有新的迁移文件
supabase db push
```

**将执行的迁移**：
1. `20251212000005_orders_status_edge_cases.sql` - 订单状态边界处理
2. `20251212000006_orders_audit_log_enhanced.sql` - 审计日志增强
3. `20251212000007_batch_assign_sales.sql` - 批量分配功能

**预期输出**：
```
Applied migration: 20251212000005_orders_status_edge_cases.sql
Applied migration: 20251212000006_orders_audit_log_enhanced.sql
Applied migration: 20251212000007_batch_assign_sales.sql
Finished supabase db push.
```

---

### Step 3: 部署Edge Function

```bash
# 部署导出订单功能
supabase functions deploy export-orders

# 验证部署
supabase functions list
```

**预期输出**：
```
Deployed Function export-orders
Version: 1
Region: ap-southeast-1
```

---

### Step 4: 创建Storage Bucket

```bash
# 方法1: 使用Supabase Dashboard（推荐）
# 1. 访问 https://rdpiajialjnmngnaokix.supabase.co
# 2. 进入 Storage → Create bucket
# 3. 名称: order-exports
# 4. Public bucket: ✅ 是

# 方法2: 使用CLI（需要安装supabase storage插件）
supabase storage mb order-exports
supabase storage update order-exports --public
```

---

### Step 5: 验证部署

#### 5.1 验证数据库函数

在Supabase SQL Editor中运行：

```sql
-- 测试乐观锁功能
SELECT update_order_status_v2(
  '<test-order-id>',
  'shipped',
  '<user-id>',
  NULL,
  '测试乐观锁',
  1
);

-- 测试批量分配
SELECT batch_assign_sales_person(
  ARRAY['<order-id-1>', '<order-id-2>'],
  '<sales-person-id>',
  '<admin-user-id>'
);
```

#### 5.2 验证Edge Function

```bash
# 使用curl测试
curl -X POST \
  https://rdpiajialjnmngnaokix.supabase.co/functions/v1/export-orders \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderIds": ["<test-order-id>"],
    "format": "csv"
  }'
```

#### 5.3 验证前端集成

```bash
cd slideboard-frontend
pnpm run dev

# 访问订单列表页测试批量操作UI
```

---

## ⚠️ 常见问题

### 问题1: 密码认证失败
```
FATAL: password authentication failed for user "postgres"
```

**解决方案**：
1. 在Supabase Dashboard确认数据库密码
2. 如果忘记密码，重置后重新link

---

### 问题2: 迁移冲突
```
Migration conflicts detected
```

**解决方案**：
```bash
# 查看迁移状态
supabase migration list

# 如果本地迁移落后，先拉取远程
supabase db pull

# 解决冲突后重新push
supabase db push
```

---

### 问题3: Edge Function部署失败
```
Failed to deploy function
```

**解决方案**：
1. 检查Deno版本: `deno --version` (需要2.x)
2. 检查函数代码是否有语法错误
3. 查看详细日志: `supabase functions deploy export-orders --debug`

---

## 📊 部署检查清单

部署完成后，请检查以下内容：

- [ ] 数据库迁移成功（3个文件）
- [ ] Edge Function部署成功
- [ ] Storage bucket创建成功
- [ ] 前端可以调用新的RPC函数
- [ ] 批量操作UI组件正常显示
- [ ] 导出功能可以生成CSV文件
- [ ] 文件可以正常下载

---

## 🔧 回滚指南

如果部署出现问题，可以回滚：

```bash
# 回滚最后一次迁移
supabase migration repair --status reverted

# 删除Edge Function
supabase functions delete export-orders

# 删除Storage bucket
supabase storage rb order-exports
```

---

## 📝 部署后任务

1. **监控日志**
   - 查看Edge Function日志
   - 检查数据库慢查询
   - 监控Storage使用量

2. **性能测试**
   - 测试批量分配100+订单
   - 测试导出1000+订单
   - 测试并发操作

3. **用户培训**
   - 演示批量操作功能
   - 说明进度UI使用方法
   - 培训失败重试流程

---

**部署负责人**: 来长城  
**预计部署时间**: 15-20分钟  
**建议部署时间**: 工作日上午（便于处理问题）
