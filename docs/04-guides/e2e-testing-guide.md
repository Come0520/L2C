# L2C E2E 自动化测试指引与维护手册

本文档旨在规范与指导本项目中端到端（E2E）测试的编写、优化与本地问题排查。本项目测试构建于 **Playwright** 及 **Next.js** 之上。

---

## 1. 核心编写规范

### 1.1 元素定位 (Selector) 优先级

为了保证测试不因为 UI 结构（DOM 重构）变化而频繁失效，请严格遵循以下定位策略：

1. **User Facing 角色优先**: 尽可能使用 `page.getByRole('button', { name: /提交/ })` 或 `page.getByPlaceholder('手机号')`。
2. **测试专用 ID 兜底**: 当组件封装复杂，无法通过文本或语义角色获取时，**应在源码中补充** `data-testid` 属性，并结合 `page.getByTestId('xx')`。
3. **禁用脆弱依赖**: 坚决抵制任何诸如 `page.locator('div > div > span:nth-child(2)')` 一类的 XPath/长链 CSS 定位。

### 1.2 稳定等待策略 (Smart Waiting)

本地环境由于构建差异，极易引起资源下发迟滞，切记：
❌ **禁止静态超时**: 不允许硬编码 `page.waitForTimeout(5000)`。
✅ **依赖框架断言**: 利用 `expect(locator).toBeVisible()` 或 `page.waitForSelector('.xxx', { state: 'attached' })` 配合 `timeout`。
✅ **页面网络监听**: 页面整体跳转或初始化时，多加利用 `await page.waitForLoadState('networkidle')` 作为保险。

---

## 2. API 异常与环境 Mock 策略

针对异常边界测试（如验证接口 500、断网断电、审批流超时），**无需过度依赖外部沙箱或真实数据库构造异常数据**，请善用 `page.route` 实施请求拦截：

```typescript
// 案例：拦截后端响应，伪造模拟超时数据
await page.route('**/api/approvals*', async (route) => {
  // 允许通过正常抓取，在此基础上补充 Mock
  const response = await route.fetch();
  const json = await response.json();

  // 植入非法或边界数据以欺骗前台 UI
  json.unshift({ id: 'mock', status: 'TIMEOUT' });
  await route.fulfill({ response, json });
});
```

---

## 3. 本地执行与调试环境避坑指南

### 3.1 本地编译耗时过长与 FCP 卡顿 (`ERR_CONNECTION_CLOSED`)

- **现象**: 执行 Playwright 测试时，浏览器经常白屏数十秒，以至于遇到 120,000ms 的硬超时（`Timeout exceeded`）失败。
- **原因**: 运行于 `pnpm dev` 下的 Next.js 在接受到首个路由请求时才开始编译页面，消耗极端大量的 CPU。
- **解法**:
  1. `playwright.config.ts` 已优化 `workers` 在本地固定为少量并发。同时 `retries` 置为 1 以应对编译期闪退。
  2. 推荐使用生成报告专用的命令：`npx playwright test --project=chromium`，减少非必要内核加载。

### 3.2 离线用例崩溃

- **现象**: 断网测试（`context.setOffline(true)`）之后如果直接调用 `page.reload()` 或评估 JS 上下文，Playwright 会因宿主进程断档而挂起报错。
- **解法**: 恢复网络后应该放弃 `reload`，转而重新打向指定业务路由 `await page.goto('/business')`，或者在捕获断网页使用严密受控的 `try...catch` 块容错。
