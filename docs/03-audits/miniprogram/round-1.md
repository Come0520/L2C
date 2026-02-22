# 小程序端 (Miniprogram) 审计报告 - 第 1 轮

> **审计范围**: 后端 API (`src/app/api/miniprogram/`, 35 个路由文件) + 前端小程序 (`miniprogram/`, 19 个页面)
> **审计日期**: 2026-02-21

## 1. 需求一致性 (Requirement Consistency)

| ID | 问题 | 类型 | 位置 | 建议操作 |
|:---|:---|:---|:---|:---|
| 1.1 | 小程序端无任何需求文档 | DocMissing | `docs/02-requirements/modules/` | 创建 `小程序端.md` 需求文档 |
| 1.2 | `invite/accept` 中大量 TODO 注释，OpenID 传递方案未确定 | CodeMissing | `invite/accept/route.ts` L13-68 | 确定安全的 OpenID 传递方案 |
| 1.3 | 报价单编号使用时间戳生成 (`Q${Date.now()}`)，不符合业务规范 | Mismatch | `quotes/route.ts` L34 | 使用与 Web 端一致的编号生成器 |
| 1.4 | 客户编号同样使用时间戳 (`C${Date.now()}`)  | Mismatch | `customers/route.ts` L99 | 使用统一的编号生成器 |

## 2. 业务逻辑与代码质量 (Business Logic & Code Quality)

| ID | 问题 | 分类 | 位置 | 建议操作 |
|:---|:---|:---|:---|:---|
| 2.1 | JWT Token 有效期 30 天过长 | Flow | `auth/login/route.ts` L25 | 缩短至 7d，增加刷新机制 |
| 2.2 | `generateToken` 函数在 `login/route.ts` 和 `invite/accept/route.ts` 重复定义 | Quality | 多文件 | 抽取到 `auth-utils.ts` 统一管理 |
| 2.3 | `dashboard/route.ts` 210 行，函数圈复杂度高（admin/sales 分支逻辑未拆分） | Complexity | `dashboard/route.ts` | 拆分为独立的 handler 函数 |
| 2.4 | 11 处 `as any` 类型断言 | Quality | 多文件 | 使用正确的类型替代 |
| 2.5 | `earnings/route.ts` 存在 N+1 查询 (循环内查 details) | Quality | `engineer/earnings/route.ts` L47-55 | 改为 `IN` 批量查询 |
| 2.6 | `orders/route.ts` GET 缺少分页，可能返回全量数据 | Flow | `orders/route.ts` L28-36 | 添加 `limit` + `offset` 分页 |
| 2.7 | `app.ts` 中 `API_BASE` 硬编码为 localhost | Quality | `miniprogram/app.ts` L11 | 使用环境配置切换 |
| 2.8 | 注释和错误提示中英文混杂 | Naming | 多文件 | 统一为中文 |

## 3. 安全审计 (Security)

| ID | 漏洞 | 严重程度 | 位置 | 修复方案 |
|:---|:---|:---|:---|:---|
| 3.1 | **34/35 路由缺少 Zod 输入验证** — 仅 `tenant/apply` 有验证 | **Critical** | 全局 | 为所有路由添加 Zod Schema 验证 |
| 3.2 | **`invite/accept` 直接接受前端传递的 OpenID** — 可被伪造 | **Critical** | `invite/accept/route.ts` L65-70 | 必须通过签名 Token 验证 OpenID |
| 3.3 | **开发环境 Mock Token 硬编码真实 User/Tenant ID** | **High** | `auth-utils.ts` L32-38 | 使用独立的测试 ID |
| 3.4 | **错误信息泄露技术细节** — `tenant/apply` 返回原始 error.message | **High** | `tenant/apply/route.ts` L123 | 统一返回通用错误信息 |
| 3.5 | **`quotes/route.ts` 错误响应拼接 error 对象** | **High** | `quotes/route.ts` L108 | 移除 error 拼接 |
| 3.6 | 前端 `auth-store.ts` 使用 `wx.setStorageSync` 明文存储 Token | **Med** | `miniprogram/stores/auth-store.ts` L44 | 记录为已知风险（小程序限制，可接受） |
| 3.7 | 登录无限速/限流保护 | **Med** | `auth/login/route.ts` | 增加登录失败计数和限速 |
| 3.8 | `invite/accept` 未验证 OpenID 是否被占用后仍接受重复绑定 | **Med** | `invite/accept/route.ts` | 增加 OpenID 重复检查 |

## 4. 数据库与性能 (Database & Performance)

| ID | 问题 | 分类 | 位置 | 修复方案 |
|:---|:---|:---|:---|:---|
| 4.1 | `orders/route.ts` GET 无分页限制 | Performance | `orders/route.ts` | 添加 `limit(50)` 和分页参数 |
| 4.2 | `dashboard/route.ts` 发起 6+ 个独立 DB 查询 | Performance | `dashboard/route.ts` | 合并为更少的聚合查询 |
| 4.3 | `earnings/route.ts` N+1 查询模式 | Performance | `engineer/earnings/route.ts` | 使用 `inArray` 批量查询 |
| 4.4 | `tasks/route.ts` 无分页限制 | Performance | `tasks/route.ts` | 添加分页 |

## 5. UI/UX (界面与体验审计)

> **参考标准**: [微信小程序设计指南](https://developers.weixin.qq.com/miniprogram/design/) + 2025 年小程序 UI/UX 最佳实践

| ID | 问题 | 分类 | 位置 | 修复方案 |
|:---|:---|:---|:---|:---|
| 5.1 | `quotes/index` 和 `crm/index` 缺少下拉刷新功能 | Flow | `pages/quotes/index.wxml`, `pages/crm/index.wxml` | 参照 `tasks/index.wxml` 添加 `refresher-enabled` |
| 5.2 | `quotes/index` 和 `crm/index` 缺少 Loading 状态展示 | Feedback | `pages/quotes/index.wxml`, `pages/crm/index.wxml` | 添加加载骨架屏或 loading 提示 |
| 5.3 | 列表页缺少上拉加载更多 (无限滚动/分页) | Flow | 多个列表页 | 添加 `bindscrolltolower` 分页加载 |
| 5.4 | 状态标签 (status tag) 直接显示英文枚举值如 `DRAFT`、`PENDING` | Consistency | `pages/workbench/index.wxml` L78, `pages/quotes/index.wxml` L24 | 添加状态中文映射函数 |
| 5.5 | FAB 按钮 (`+`) 仅用文字，缺少视觉图标和触控反馈 | Feedback | `pages/quotes/index.wxml` L49, `pages/crm/index.wxml` L57 | 使用 SVG 图标 + 按压动画，确保触控区域 ≥ 75x75px |
| 5.6 | 工作台 `dashboard` 默认值硬编码 `'85'%`，无数据时显示误导 | InfoArch | `pages/workbench/index.wxml` L19 | 默认值改为 `'0'` 或显示 `--` |
| 5.7 | 空状态文案风格不统一（"暂无信号" vs "暂无报价单" vs "暂无客户数据"） | Consistency | 多页面 | 统一空状态设计和文案风格 |
| 5.8 | 登录页无错误提示 UI 反馈（toast 或 inline error） | Feedback | `pages/login/login.wxml` | 添加错误提示区域 |
| 5.9 | 密码输入无显示/隐藏切换 | A11y | `pages/login/login.wxml` L20-26 | 添加密码可见性切换按钮 |

## 6. 测试覆盖 (Test Coverage)

| ID | 问题 | 分类 | 位置 | 修复方案 |
|:---|:---|:---|:---|:---|
| 6.1 | **零测试文件** — 35 个 API 路由无任何单元/集成测试 | Unit | `src/app/api/miniprogram/` | 为关键路由编写测试 |
| 6.2 | 冒烟测试脚本存在但依赖运行时环境 | Integration | `scripts/smoke-test-miniprogram-v2.ts` | 改造为可离线运行的集成测试 |

## 7. 文档完整性 (Documentation)

| ID | 问题 | 分类 | 位置 | 修复方案 |
|:---|:---|:---|:---|:---|
| 7.1 | 无小程序 API 接口文档 | API | — | 创建 API 接口文档 |
| 7.2 | 多数路由文件缺少 JSDoc | Comments | 多文件 | 添加函数级 JSDoc |
| 7.3 | 无小程序端需求文档 | Requirements | `docs/02-requirements/` | 从代码反向生成需求文档 |

## 8. 可运维性 (Observability & Operations)

| ID | 问题 | 分类 | 位置 | 修复方案 |
|:---|:---|:---|:---|:---|
| 8.1 | **全部路由使用 `console.error`**，未使用项目 `logger` | Logging | 全局 35 个文件 | 替换为 `logger.error` |
| 8.2 | **零审计日志** — 所有写操作 (POST/PUT/DELETE) 无 `AuditService.log` | AuditTrail | 全局 | 为所有写操作添加审计日志 |
| 8.3 | 错误信息缺少上下文 (userId, tenantId, traceId) | Logging | 全局 | 在日志中添加结构化上下文 |

## 用户标记忽略 (Ignored Items)

| ID | 原因 |
|:---|:---|
| — | （等待用户确认） |
