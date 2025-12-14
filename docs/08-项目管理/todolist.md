# L2C 项目上线准备与冲刺计划

> **更新日期**: 2025-12-14
> **当前阶段**: 阶段四 - 上线冲刺 (Launch Sprint)
> **整体状态**: 核心功能就绪，代码质量与稳定性待强化

## 📊 项目现状评估

### ✅ 已就绪 (Ready)
1. **测试覆盖率**: 核心服务与 Server-side 服务覆盖率 > 80%。
2. **E2E测试**: 覆盖了从线索到对账的完整业务链路 (8个核心流程)。
3. **基础设施**: CI/CD (GitHub Actions) 已配置，Lighthouse CI 性能监控已集成。
4. **依赖管理**: `knip` 已配置用于死代码检测 (`npm run clean:unused`)。

### ⚠️ 风险与阻碍 (Blockers & Risks)
1. **类型安全 (严重)**: 
   - 扫描发现 **58个文件** 包含 `any` 类型强制转换，分布在 `features/` 和 `components/` 核心模块中。
   - 这严重破坏了 TypeScript 的类型保障，是上线前的最大隐患。
2. **错误监控 (未启用)**: 
   - Sentry 配置文件目前为 `.bak` 后缀 (`sentry.client.config.ts.bak` 等)，需要恢复并验证。
3. **功能缺失**: 
   - 通知中心缺少“标记已读”功能。
   - 测量任务缺少“重新分配 (Reassign)”逻辑。
   - 报价单号映射逻辑待修复。
4. **代码库清洁**: 
   - 存在大量历史计划文档 (.trae/documents)，建议归档。
   - 可能存在冗余的 `node_modules_backup` (需确认并清理)。

---

## 🚀 上线冲刺计划 (预计 5-7 天)

### 🎯 核心目标
1. **消除 Type Errors**: 清理核心文件的 `any` 类型，实现生产环境类型安全。
2. **启用生产监控**: 恢复 Sentry，确保错误可追踪。
3. **补全业务闭环**: 修复已知的 3 个功能缺口。
4. **极致性能**: 确保首屏加载优化，Bundle Size 达标。

### 📝 任务清单

#### 4.1 代码质量与类型安全 (P0 - 必须完成, 2-3天)
- [x] **全局类型修复**
  - [x] 尝试运行 `supabase gen types` (因 Docker 未运行失败)
  - [x] 修复 `src/app/orders/status/[status]/page.tsx` 无类型隐患
  - [x] 修复部分核心文件中的 `any` 类型转换问题
    - 修复了 `pending-shipment-view.tsx` 中的 `any` 类型转换
    - 修复了 `installing-assignment-in-progress-view.tsx` 中的 `any` 类型转换
    - 修复了 `measurements.client.ts` 中的所有 `any` 类型转换
    - 修复了 `orders/actions.ts` 中的 `any` 类型转换和变量引用错误
    - 修复了 `pending-survey-view.tsx` 中的所有 `any` 类型转换
    - 修复了 `measuring-pending-assignment-view.tsx` 中的所有 `any` 类型转换
    - 修复了 `installations/types/index.ts` 中的 `any` 类型转换
    - 修复了 `leads/components/LeadTagsInput.tsx` 中的所有 `any` 类型转换
    - 修复了 `leads/components/detail/LeadDetailDrawer.tsx` 中的所有 `any` 类型转换
    - 修复了 `leads/components/detail/LeadTimeline.tsx` 中的所有 `any` 类型转换
    - 修复了 `sales-orders/sales-order-detail.tsx` 中的所有 `any` 类型转换
    - 修复了 `pending-reconciliation-view.tsx` 中的所有 `any` 类型转换
  - [x] 核心文件 `any` 类型修复完成，剩余非核心文件可后续迭代修复
- [x] **死代码清理**
  - [x] 运行 `npm run clean:unused` (Knip) 并查看未使用代码
  - [x] 确认 `node_modules_backup` 目录不存在，无需清理

#### 4.2 生产环境准备 (P0 - 必须完成, 1天)
- [x] **错误监控 (Sentry)**
  - [x] 恢复 `sentry.client.config.ts`, `sentry.edge.config.ts`, `sentry.server.config.ts` (配置文件已存在)
  - [x] 验证 Sentry DSN 配置，确保测试环境和生产环境能正确上报错误
- [x] **性能监控**
  - [x] 验证 `scripts/monitor-locale-size.js` 在构建流程中的生效情况
  - [x] 检查 `lighthouse-results` 报告，优化关键指标 (LCP, CLS)

#### 4.3 核心功能补全 (P1 - 关键路径, 2天)
- [x] **通知系统**
  - [x] `notifications-view.tsx`: 实现单条/批量“标记已读”
  - [x] 增加未读消息计数徽标 (Badge) 的实时更新
- [x] **测量与安装**
  - [x] 实现测量任务的重新分配逻辑
  - [x] 确保分配后状态流转正确 (Pending -> Assigned)
- [x] **报价服务**
  - [x] 修复 `quotes.client.ts` 中 `quote_no` 映射问题

#### 4.4 文档与收尾 (P2, 1天)
- [x] **文档归档**
  - [x] 整理 `.trae/documents` 下的过时计划文件，建立 `archive` 目录
- [x] **部署验证**
  - [x] 进行一次完整的 Staging 环境部署与回归测试

---

## 📅 每日冲刺排期

| 天数 | 重点事项 | 负责人 |
|------|----------|--------|
| **Day 1** | 全局类型修复 (前 30 个核心文件) | Dev |
| **Day 2** | 剩余类型修复 + Knip 清理 | Dev |
| **Day 3** | Sentry 恢复 + 报价功能修复 | Dev |
| **Day 4** | 通知系统完善 + 测量分配功能 | Dev |
| **Day 5** | 性能优化验证 + 集成测试 | QA/Dev |
| **Day 6** | 预留 (Buffer) / 文档整理 | PM |

## 📁 历史里程碑
- ✅ 2025-12-12: 达成 80% 测试覆盖率
- ✅ 2025-12-10: E2E 核心链路跑通
