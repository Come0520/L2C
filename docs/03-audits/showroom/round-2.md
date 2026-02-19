# Showroom 模块审计报告 — Round 2

> 本轮基于 Round 1 修复后的代码进行回归验证 + 深度扫描，聚焦于 **Round 1 遗留风险**、**前端安全**与**逻辑完整性**。

---

## 1. Round 1 修复回归验证

| ID | 修复项 | 状态 | 备注 |
|:---|:---|:---:|:---|
| R1.1 | 软删除 (`ARCHIVED`) | ✅ 通过 | `deleteShowroomItem` 已改为 `set({ status: 'ARCHIVED' })`。 |
| R1.2 | 输入净化 (DOMPurify) | ⚠️ 部分 | 见 2.1 — 回归点。 |
| R1.3 | 审计日志 (AuditService) | ✅ 通过 | 创建/更新/删除/分享 均已调用 `AuditService.record`。 |
| R1.4 | 速率限制 | ✅ 通过 | 使用 `checkRateLimit` 基于 IP 限流。 |
| R1.5 | Redis 浏览量计数 | ⚠️ 部分 | 见 2.2 — 降级路径安全性。 |

---

## 2. 新发现 — 安全类

| ID | 漏洞 | 严重性 | 位置 | 分析 | 建议 | 决策 |
|:---|:---|:---:|:---|:---|:---|:---:|
| 2.1 | **更新时 DOMPurify 清洗存在竞态逻辑** | Medium | `items.ts:157-170` | `mergedData` 先赋值了 `data.content`（未清洗），后续 `if (data.content)` 才清洗并写回 `mergedData.content`。但传入 DB 的实际是 `...data`（L176），此时 L169 已写回 `data.content = mergedData.content`，逻辑可行但**极度容易误修改**。应简化为在一开始就清洗 `data.content`。 | 将清洗提前至 `parse` 之后，`mergedData` 构造之前，只清洗一次。 | **Fix** |
| 2.2 | **Redis 降级路径无限流** | Medium | `shares.ts:98-106` | 当 Redis 不可用时（`redis === null`），`checkRateLimit` 依赖 Redis 也会失效，降级路径直接写 DB 无限流保护，攻击者可无限刷量。 | 降级路径应在无 Redis 时直接 `throw` 拒绝服务，或使用内存 Map 做简易限流。 | **Fix** |
| 2.3 | **卡片组件删除按钮未绑定逻辑** | Low | `showroom-card.tsx:99` | `<DropdownMenuItem className="text-red-600">删除</DropdownMenuItem>` 无 `onClick` 处理，用户点击无反应，形成 UX 死角。虽然不是安全问题但可能造成困惑。 | 绑定 `deleteShowroomItem` 或添加确认弹窗。 | **Backlog** |

---

## 3. 新发现 — 逻辑完整性

| ID | 问题 | 严重性 | 位置 | 分析 | 建议 | 决策 |
|:---|:---|:---:|:---|:---|:---|:---:|
| 3.1 | **列表页未过滤 ARCHIVED 状态** | High | `items.ts:25-48`, `page.tsx:12-17` | `getShowroomItems` 查询条件中没有排除 `status = 'ARCHIVED'`。默认调用 `page.tsx` 时也没传 `status` 参数。这意味着**被"删除"的素材仍然出现在列表页**，软删除形同虚设。 | 在 `getShowroomItems` 中添加默认条件：若未指定 `status`，则排除 `ARCHIVED`。 | **Fix** |
| 3.2 | **详情页可访问 ARCHIVED 素材** | Medium | `items.ts:66-78` | `getShowroomItem(id)` 未检查 `status !== 'ARCHIVED'`，用户可通过直接输入 URL 访问已归档素材。 | 在 `getShowroomItem` 中添加 `status` 排除条件，或在页面层做提示。 | **Fix** |
| 3.3 | **分享链接无租户隔离** | Medium | `shares.ts:49-64` | `getShareContent` 查询 `showroomShares` 时未加 `tenantId` 条件。虽然 `shareId` 是 UUID 难以猜测，但若泄露，某租户的分享链接可被任何人读取。同时获取的 `items` 也未过滤 `tenantId`。 | 分享链接本身是公开给客户的，**这是设计意图**。但建议在获取 items 时过滤 `tenantId` 以防数据泄露。 | **Fix** |
| 3.4 | **`getShareContent` 未校验 `shareId` 格式** | Low | `shares.ts:45` | `shareId` 参数直接传入数据库查询，未经 Zod 校验。虽然 Drizzle 参数化查询防止了 SQL 注入，但应校验格式以防止无意义查询。 | 在函数开头添加 `getShareContentSchema.parse({ shareId })`。 | **Fix** |

---

## 4. 新发现 — 代码质量

| ID | 问题 | 位置 | 建议 | 决策 |
|:---|:---|:---|:---|:---:|
| 4.1 | **`showroom-client-page.tsx` 使用 `any` 类型** | `showroom-client-page.tsx:19` | `initialData: any[]`, `searchParams: any` → 替换为具体类型。 | **Backlog** |
| 4.2 | **`showroom-card.tsx` 的 `stripHtml` 正则不安全** | `showroom-card.tsx:18` | `html.replace(/<[^>]+>/g, '')` 是简易方案，可能被精心构造的 HTML 绕过。建议改用 DOMPurify 的 `sanitize` + `ALLOWED_TAGS: []`。 | **Backlog** |
| 4.3 | **`ArticleLayout` 使用 placeholder 图片** | `showroom-detail-client.tsx:268` | `'https://via.placeholder.com/800x600?text=No+Image'` 引用外部域名，生产环境应使用本地占位图或 SVG。 | **Backlog** |
| 4.4 | **Redis 客户端实例未做单例缓存** | `redis.ts` | 每次 import 均重新创建实例。应使用 `globalThis` 缓存，避免 HMR 时重复创建。 | **Backlog** |

---

## 5. 总结

本轮发现 **2 个 High** (3.1 列表未过滤 ARCHIVED)、**4 个 Medium**、**2 个 Low** 级别问题。

**最紧急**: 3.1 — 软删除的 `ARCHIVED` 状态未在列表查询中被排除，意味着 Round 1 的软删除修复实际上**对用户不可见**（被删除的素材仍然显示）。必须优先修复。
