# showroom 模块审计问题报告

> 审计时间：2026-03-10
> 审计人：Agent
> 模块路径：src/features/showroom

---

## 📊 总览

| 级别 | 数量 |
|:---:|:---:|
| 🔴 P0 — 安全/数据（必须立即修复） | 1 |
| 🟠 P1 — 质量/性能（应当修复） | 3 |
| 🟡 P2 — 规范/UX（建议改进） | 3 |
| **合计** | **7** |

---

## 🔴 P0 — 必须立即修复

- [x] [D3-006-R7] `actions/items.ts:362` — `deleteShowroomItem` 软删除时 UPDATE 的 WHERE 子句为 `eq(showroomItems.id, id)`，**缺少 `tenantId` 过滤**（D3-006 TOCTOU 第 7 次复现）。前置查询（第347-349行）已验证 tenantId，但实际 UPDATE 未加保护

---

## 🟠 P1 — 应当修复

- [x] [D3-P1-2] `actions/items.ts:35-172` — `getShowroomItems` 函数**无 `checkPermission` 权限校验**，任意已登录用户均可查询该租户下所有 PUBLISHED 状态的展厅素材。建议至少要求 `SHOWROOM.VIEW` 权限

- [x] [D5-P1-3] `actions/shares.ts:221` — 分享通知的 `content` 字段包含 `shareId` 明文（`分享ID: ${shareId}`）。分享 ID 是 UUID，出现在通知记录中无严重安全问题，但会增加内部 ID 暴露面。建议改为业务友好描述（如"您于今日创建的展厅分享"），不暴露技术 ID

- [ ] [D3-P1-4] `actions/shares.ts:149-153` — **TOCTOU 并发锁定漏洞**：在处理分享链接的 `lockedToUserId` 绑定时，判断存在分离的 `findFirst` 和 `update`，若两名不同访客在同一毫秒并发访问，均会绕过 `!share.lockedToUserId` 判断，造成最后一次 UPDATE 覆盖前者，且两人都能拿到展厅数据。建议使用 `and(eq(id), isNull(lockedToUserId))` 原子更新并依靠 `returning()` 验证是否锁定成功

---

## 🟡 P2 — 建议改进

- [x] [D4-P2-1] `actions/shares.ts:197-207` — `getShareContent` 查询 `showroomItems` 时使用 `inArray(showroomItems.id, itemIds)`，**未加 `tenantId` 过滤**。理论上分享快照的 itemId 来自创建时的数据，不存在主动注入风险，但建议加上 `eq(showroomItems.tenantId, share.tenantId)` 防御性过滤

- [x] [D6-P2-2] 仅 1 个测试文件（覆盖率极低），缺少：分享链接密码保护测试、身份锁定测试、MaxViews 超限测试、软删除跨租户测试

- [ ] [D5-P2-3] `actions/items.ts` 与 `actions/shares.ts` 中几乎所有的修改操作（包括 `createShowroomItem`、`updateShowroomItem`、`deleteShowroomItem`、`createShareLink`、`deactivateShareLink`）都**未配置数据库事务隔离**。这会导致发生异常时业务数据落盘完成，但相关的 `AuditService.log` 记录丢失

---

## ✅ 表现良好项（无需修复）

- **D3 分享链接安全体系完整**：密码 SHA-256 哈希存储、身份锁定（`lockedToUserId`）、MaxViews 阅后即焚、过期检查、`isActive = 0` 停用五重保护
- **D3 IP 限流**：`getShareContent` 公开接口使用 `checkRateLimit` 按 IP 限流（60次/分钟），防止爬虫枚举
- **D3 幂等防重视图计数**：Redis `incr` 原子计数 + 10% 采样回写 DB，防并发计数失真
- **D3 内容 XSS 清洗**：创建和更新素材时调用 `sanitizeContent` 净化 HTML 内容
- **D3 分享停用 tenantId 校验**：`deactivateShareLink` UPDATE 包含 `eq(showroomShares.tenantId, tenantId)`，正确隔离
- **D4 版本号缓存失效**：`invalidateShowroomCache` 通过 Redis `incr` 版本号，使旧缓存 key 自动失效，避免精确 key 删除的复杂性
- **D4 SQL 窗口函数**：`getShowroomItems` 使用 `COUNT(*) OVER()` 在单次查询中获取总数，避免两次查询
- **D8 全链审计**：创建/更新/删除/停用分享链接均有 AuditService 记录
