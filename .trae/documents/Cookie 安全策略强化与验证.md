## 任务概述
根据需求，需要强化 Cookie 安全策略并进行验证。当前 `server.ts` 文件中的 Cookie 配置已符合要求，但 `client.ts` 文件中存在问题。

## 实施步骤

### 1. 修改 `client.ts` 文件中的 Cookie 配置
- 将 `sameSite` 从 `'strict'` 修改为 `'lax'`
- 确保 `httpOnly: true` 和 `secure: process.env.NODE_ENV === 'production'` 配置正确

### 2. 验证配置
- 检查修改后的配置是否符合要求
- 确保所有 Supabase 相关文件的 Cookie 配置一致

## 文件修改清单
- `/Users/laichangcheng/Documents/文稿 - 来长城的MacBook Air/trae/L2C/slideboard-frontend/src/lib/supabase/client.ts`

## 预期结果
- 所有 Supabase 相关文件的 Cookie 配置符合要求
- `sameSite` 设置为 `'lax'`，允许 OAuth 重定向正常工作
- `httpOnly: true` 防止 XSS 攻击
- `secure` 仅在生产环境启用，避免本地开发 HTTPS 报错