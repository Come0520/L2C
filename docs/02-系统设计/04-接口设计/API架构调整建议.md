# Next.js + Supabase API架构调整建议

## 🎯 架构调整目标

1. **明确分层**：区分Supabase直接调用 vs 后端API调用
2. **统一规范**：保持RESTful设计原则
3. **性能优化**：减少不必要的网络跳转
4. **安全强化**：敏感操作必须走后端

## 📋 API分层设计

### 第一层：Supabase直接调用（客户端）
适用于：简单CRUD、实时数据、用户自身数据
```typescript
// 前端直接调用Supabase
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
```

### 第二层：Next.js API路由（服务端）
适用于：需要服务器逻辑、数据聚合、缓存场景
```typescript
// app/api/leads/list/route.ts
export async function GET(req: NextRequest) {
  // 服务器端逻辑处理
  const { data, error } = await supabaseServer
    .from('leads')
    .select('*')
    .order('updated_at', { ascending: false })
  
  return NextResponse.json({ items: data ?? [] })
}
```

### 第三层：NestJS后端API（业务逻辑）
适用于：复杂业务逻辑、事务处理、第三方集成
```typescript
// 后端复杂业务逻辑
@Post('/leads/:id/convert')
async convertLead(@Param('id') id: string, @Body() data: ConvertLeadDto) {
  return this.leadsService.convertLead(id, data);
}
```

## 🔧 具体调整建议

### 1. 用户认证相关
- **保持现状**：使用NestJS后端处理认证
- **原因**：安全性要求高，需要JWT token管理

### 2. 线索管理
- **轻度调整**：列表查询走Next.js API路由
- **原因**：需要权限控制和数据过滤

### 3. 订单管理
- **保持现状**：继续使用NestJS后端
- **原因**：涉及复杂业务逻辑和状态流转

### 4. 积分系统
- **优化调整**：查询走Next.js API，兑换走NestJS
- **原因**：查询频繁需要缓存，兑换需要事务

### 5. 实时功能
- **新增支持**：使用Supabase Realtime
- **场景**：消息通知、状态更新推送

## 📊 性能优化建议

### 1. 缓存策略
```typescript
// Next.js API路由中添加缓存
import { cacheGet, cacheSet } from '@/services/cache'

export async function GET(req: NextRequest) {
  const cacheKey = `orders:list:${userId}:${status}:${page}:${pageSize}`
  const cached = await cacheGet(cacheKey)
  if (cached) return NextResponse.json(cached)

  // 查询逻辑...
  await cacheSet(cacheKey, payload, 60) // 缓存60秒
}
```

### 2. 数据预加载
```typescript
// 使用Next.js的generateStaticParams
export async function generateStaticParams() {
  const { data: products } = await supabase
    .from('point_products')
    .select('id')
  
  return products.map(({ id }) => ({
    productId: id.toString(),
  }))
}
```

## 🛡️ 安全建议

### 1. Row Level Security (RLS)
```sql
-- 启用RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "用户只能查看自己的线索" ON leads
  FOR SELECT
  USING (
    assigned_to_id = auth.uid() OR created_by_id = auth.uid()
  );
```

### 2. API密钥管理
```typescript
// 使用Next.js环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 服务端使用不同的密钥
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!
```

## 📈 实施步骤

1. **第一阶段**：梳理现有API调用，分类处理
2. **第二阶段**：优化高频查询，添加缓存
3. **第三阶段**：完善RLS策略，增强安全性
4. **第四阶段**：添加实时监控和错误处理

## ✅ 检查清单

- [ ] 梳理所有API端点，明确分层
- [ ] 配置Supabase RLS策略
- [ ] 实现Next.js API路由缓存
- [ ] 添加API监控和日志
- [ ] 优化高频查询性能
- [ ] 完善错误处理机制