# 服务管理模块 (Service) 审计报告

## 审计概述
本次针对 `service` 模块（包含安装调配、师傅技能分配、售后客诉处理子模块）的代码规范、安全性、性能和业务逻辑完备进行审计。该模块广泛应用了权限隔离与基于租户的安全过滤。但是，在某些数据库交互、性能防御和流程状态机约束上，发现了严重缺陷及潜在隐患。

---

## 缺陷记录

### 🟥 P1 严重问题 (High Priority)

#### [P1] `updateWorkerSkills` 破坏性更新缺失数据库事务 (数据完整性风险)
- **文件路径**: `src/features/service/actions/task-split-actions.ts`
- **问题描述**: 在 `updateWorkerSkills` 方法中，系统采取了"先全量删除（`db.delete`）、再全量插入（`db.insert`）"的简单流转。但这两个操作**并未用 `db.transaction()` 包裹**。若在第二步插入阶段发生服务端崩溃、网络异常或校验错误，不仅更新会失败，员工**原有的所有合法技能也会永久丢失**，造成非常严重的生产事故级数据破坏。
- **修复指引**: 必须使用 `db.transaction(async (tx) => { await tx.delete(...); if(arr.length) await tx.insert(...) })` 重构该段逻辑。

#### [P1] 验收方法跳过了状态机约束 (业务逻辑漏洞)
- **文件路径**: `src/features/service/installation/actions.ts`
- **问题描述**: 在 `confirmInstallationInternal` 验收方法中，系统仅校验了任务是否存在和权限，却没有检查任务当下的 `status`。这意味着，即便安装工人还没有接单或未上门实施（例如状态还是 `PENDING_DISPATCH` 或 `DISPATCHING`），拥有权限的销售或管理员仍可**强制并无警告地直接点击通过验收**，瞬间将其置为 `COMPLETED`。这突破了正常的闭环逻辑。
- **修复指引**: 在读取出 `task` 之后，显式加上业务防线：`if (task.status !== 'PENDING_CONFIRM') throw Error(...)`。

#### [P1] `getInstallTasks` (旧版) API 完全缺失分页保护 (性能与 DoS 风险)
- **文件路径**: `src/features/service/actions/install-actions.ts`
- **问题描述**: 区别于 `installation/actions.ts` 内重构后的版本，历史遗留暴露在 `actions/install-actions.ts` 中的 `getInstallTasks` 方法内部直接使用了 `db.query.installTasks.findMany({...})`，但**完全没有加上 `.limit()` 与 `.offset()` 设置**。如果前端或三方调用此历史接口而不传递状态过滤，将由于拉取全库成千上万条记录直接撑爆内存并拖垮数据库。
- **修复指引**: 移除或清理老旧未使用代码；或者为 `findMany` 强制硬编码一个兜底的 `limit: 100`。

---

### 🟨 P2 一般问题 (Medium Priority)

#### [P2] 核心流转场景缺失乐观锁管控 (TOCTOU 风险)
- **文件路径**: 
  - `src/features/service/actions/ticket-actions.ts`
  - `src/features/service/installation/actions.ts`
- **问题描述**:
  - `updateTicketStatus` 直接更新 `afterSalesTickets`，但未配合 `version` 进行并发限制检查。
  - 安装单在多角色协作期间（派单、接单、签到、签退、验收）密集发生状态覆盖（且夹杂位置信息汇报），但当前设计完全依赖 `eq(id)` 和 `eq(tenantId)` 进行安全定址，缺失了基于 `version` 的乐观锁机制。当网络抖动出现防抖失败的双击请求，或管理员和工人同时修改状态时，发生非预期覆盖的隐患变高。
- **修复指引**: 在底层 Schema 或关键状态业务加入 `version` 控制，于每一次 `.set()` 中加入 `.where(and(..., eq(version, currentVersion)))` 和 `version: sql\`version + 1\``，防范脏写。

---

## 优秀实践 (Good Practices)
✅ **冲突和安全检测**: `dispatchInstallTaskInternal` 中非常完善地处理了 Hard/Soft 冲突（`checkSchedulingConflict`）、预收货款检查及物流发货状态的多级联防检查，保证了"无货不派单、有欠款预警"的良好规范。
✅ **位置迟到合规运算**: 在工人打卡签退环节引入了真实的坐标收集和基于 GPS / 预定时间的迟到算数防假打卡判断，功能贴合门店管理痛点。
✅ **订单验收联动全闭环**: 安装任务确认竣工后，设计了向上的父订单 `orders` 状态检查——只有发现当前订单下无其他尚未完成的安装单时，父订单才正式标记为竣工，状态同步逻辑紧密。
