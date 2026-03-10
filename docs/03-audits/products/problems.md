# products 模块审计问题报告

> 审计时间：2026-03-10
> 审计人：Agent
> 模块路径：src/features/products

---

## 📊 总览

| 级别 | 数量 |
|:---:|:---:|
| 🔴 P0 — 安全/数据（必须立即修复） | 2 |
| 🟠 P1 — 质量/性能（应当修复） | 3 |
| 🟡 P2 — 规范/UX（建议改进） | 2 |
| **合计** | **7** |

---

## 🔴 P0 — 必须立即修复

- [x] [D3-P0-1] `actions/channel-discount-actions.ts` — `updateGlobalDiscountConfig`、`createDiscountOverride`、`updateDiscountOverride`、`deleteDiscountOverride` 等全部折扣配置写操作**完全没有 `checkPermission` 权限校验**，仅验证登录状态（`auth()` 返回 session）。任何已登录用户均可修改全局折扣配置，影响所有报价计算结果，涉及重大财务风险

- [x] [D3-006-R5] `actions/channel-discount-actions.ts:309` — `updateDiscountOverride` 函数更新 `channelDiscountOverrides` 的 WHERE 子句为 `eq(channelDiscountOverrides.id, id)`，**缺少 `tenantId` 过滤**（D3-006 第 5 次复现）。前置查询（第280-285行）已验证 tenantId，但实际 UPDATE 未加保护

---

## 🟠 P1 — 应当修复

- [x] [D8-P1-1] `actions/channel-discount-actions.ts:161,248,314` — 审计日志中 `userId` 字段**硬编码为字符串 `'system'`**，无法追渂实际操作用户。折扣配置是高影响力操作（直接影响所有报价单金额），审计记录必须写入真实操作人 userId（从 session 获取）

- [x] [D4-P1-2] `actions/mutations.ts:264-320` — `batchCreateProducts` **使用串行 `for` 循环**逐条 INSERT，批量导入 100 件产品时会产生 100+ 次串行数据库写入。建议改为先批量查询已存在 SKU（`inArray`），再 `db.insert().values([...])`  批量插入，并用事务保证原子性

- [x] [D4-P1-3] `actions/channel-discount-actions.ts:103` — `getCachedGlobalDiscountConfig` 未设置 `revalidate` 时间（D3-004 同类）。全局折扣配置的缓存依赖 `updateTag` 手动失效，若 tag 失效未触发，配置将永久使用旧值。建议添加 `revalidate: 3600` 兄底

---

## 🟡 P2 — 建议改进

- [x] [D5-P2-1] `actions/mutations.ts:175-194` — `deleteProduct` 对产品执行**硬删除**（物理删除），若产品已关联报价单、订单或套餐，则删除后这些历史记录将丢失产品信息关联。建议改为软删除（`isActive = false` + `deletedAt`）

- [ ] [D6-P2-2] 9 个测试文件中，缺少针对 P0 问题的专项测试：折扣配置无权限绕过测试、updateDiscountOverride 跨租户测试

---

## ✅ 表现良好项（无需修复）

- **D3 mutations.ts 安全合格**：`createProduct`、`updateProduct`、`deleteProduct`、`activateProduct`、`batchUpdateProductImages` 全部有 `checkPermission(session, PERMISSIONS.PRODUCTS.MANAGE)`，且 UPDATE/DELETE WHERE 均含 tenantId
- **D3 SKU 唯一性校验**：创建和批量创建前均验证同租户内 SKU 唯一，防止数据污染
- **D8 审计覆盖**：mutations.ts 中 CREATE/UPDATE/DELETE 操作均有 AuditService 记录且携带新旧值
- **D3 折扣查询隔离**：`getDiscountOverrides`、`getProductDiscountRate` 等读操作均正确使用 `eq(table.tenantId, tenantId)` 隔离
- **D3 折扣计算优先链**：商品级 > 品类级 > 全局默认，三层覆盖逻辑清晰正确

---

## 📢 第二轮深入审计新增发现 (High & Medium Priority)

### 🟥 P1 严重问题

- [ ] **[P1-New-1] 组合明细更新缺失事务保护 (数据丢失风险)**
  - **文件**: `actions/bundle-actions.ts:282` (`updateBundleItems`)
  - **描述**: 在全量覆盖组合套餐明细时，采用了先 `db.delete(productBundleItems)` 取消关联，然后再 `db.insert(...)` 写入新明细的做法。但这两个步骤**没有用 `db.transaction()` 包裹**。如果在 delete 成功后插入失败，合法的套餐明细数据会被永久误删。
  - **建议**: 使用 `db.transaction(async (tx) => { await tx.delete(...); if(arr.length) await tx.insert(...) })` 重构。

### 🟨 P2 一般问题

- [ ] **[P2-New-1] 默认供应商切换缺少事务一致性**
  - **文件**: `actions/manage-suppliers.ts`
  - **描述**: 在 `addProductSupplierActionInternal`、`updateProductSupplierActionInternal`、`autoSwitchDefaultSupplierActionInternal` 中，如果需要设定某个供应商为 `isDefault: true`，代码显式先使用 `db.update().set({ isDefault: false })` 取消其他，再设定当前。但这两个独立 update/insert 缺乏事务包裹，异常终端容易产生多个 default，或 0 个 default 的中间态。
  - **建议**: 在相关方法内部使用 `db.transaction()` 包裹组合写入操作。

- [ ] **[P2-New-2] 列表查询缺乏分页导致潜在内存风险**
  - **文件**: 
    - `actions/bundle-actions.ts:81` (`getBundles` 没有传递分页参数，拉取该租户全库套餐)
    - `actions/channel-price-actions.ts:97` (`getAllChannelPrices` 直接 findMany 拉取该租户下全部商品专属价格清单)
  - **描述**: 这两处直接获取了租户名下所有数据并未加以 `.limit(xxx)`，商品库及价格策略持续膨胀后有引发生产环境 OOM 或拖慢数据库响应的风险。
  - **建议**: 添加标准分页参数或者保守硬编码 `.limit(1000)`。
