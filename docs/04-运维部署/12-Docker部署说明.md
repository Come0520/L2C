# L2C Next.js 配置说明

## Standalone 输出模式

本项目使用 Next.js Standalone 输出模式进行Docker部署，需要在 `next.config.js` 中配置：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用 Standalone 输出模式（Docker部署必需）
  output: 'standalone',
  
  // 其他配置...
}

module.exports = nextConfig
```

## 健康检查端点

为了支持Docker健康检查和负载均衡，需要创建健康检查API端点：

**文件位置**: `src/app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
}
```

## 部署前检查

在部署到生产环境前，请确保：

1. ✅ `next.config.js` 中已配置 `output: 'standalone'`
2. ✅ 已创建 `/api/health` 健康检查端点
3. ✅ 环境变量配置正确
4. ✅ 本地构建测试通过

## 本地测试Docker镜像

```bash
# 构建镜像
docker build -t l2c-test -f Dockerfile .

# 运行测试
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  l2c-test

# 验证健康检查
curl http://localhost:3000/api/health
```
