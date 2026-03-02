# Sprint 3 — 任务 3.2：超管防串入 Middleware

## 你的身份

你是一个实现子代理 (Implementer Subagent)，正在执行 L2C 多租户改造方案。

**前置条件**：Sprint 1-2 和任务 3.1 已完成。

## 任务描述

添加路由保护逻辑，确保：

1. 超管（`tenantId === '__PLATFORM__'`）不能访问租户级别的业务路由
2. 普通用户不能访问 `/platform` 平台管理路由

## 具体工作

### 修改现有的 middleware 或创建新的 middleware

在项目中找到 Next.js middleware（通常在 `src/middleware.ts` 或 `src/app/middleware.ts`），添加如下路由保护逻辑：

```typescript
/**
 * 多租户路由保护
 *
 * 1. 超管（isPlatformAdmin）只能访问 /platform/* 路由
 * 2. 普通用户不能访问 /platform/* 路由
 */

// 在 middleware 的路由匹配逻辑中添加：

// 超管防串入：禁止超管访问业务路由
if (session?.user?.tenantId === '__PLATFORM__') {
  const isAccessingPlatform =
    pathname.startsWith('/platform') || pathname.startsWith('/api/platform');
  const isAccessingAuth =
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register');
  const isAccessingStatic = pathname.startsWith('/_next') || pathname.startsWith('/favicon');

  if (!isAccessingPlatform && !isAccessingAuth && !isAccessingStatic) {
    // 超管试图访问业务路由，重定向到平台管理首页
    return NextResponse.redirect(new URL('/platform', request.url));
  }
}

// 普通用户防串入：禁止非超管访问平台路由
if (pathname.startsWith('/platform') && !session?.user?.isPlatformAdmin) {
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

**注意**：需要根据项目实际的 middleware 结构来决定具体的插入位置。请先阅读现有 middleware 文件的结构后再修改。

如果项目还没有 matcher 配置来覆盖 `/platform` 路由，需要添加。

## 注意事项

1. 不要破坏现有的认证 middleware 逻辑
2. 确保 API 路由也被覆盖（`/api/platform/*`）
3. 注意不要阻止身份认证相关的路由（`/api/auth/*`、`/login`）
4. 所有代码注释必须使用**中文**
5. 工作目录：`c:\Users\bigey\Documents\Antigravity\L2C`

## 验证方式

```bash
npx tsc --noEmit --pretty 2>&1 | head -50
```

## 完成后报告

请报告修改了哪些文件、编译是否通过。
