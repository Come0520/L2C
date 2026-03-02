# 多租户改造 — Subagent 提示词索引

> 将对应 Sprint 的提示词全文复制给 subagent 即可执行
> 每个任务完成后需依次执行不要跳过

## 执行顺序

**严格按顺序执行！后续任务依赖前面的产出。**

### Sprint 1 — 数据库 Schema 层（预估 30min）

| 顺序 | 提示词文件                                                   | 说明                                 |
| ---- | ------------------------------------------------------------ | ------------------------------------ |
| 1    | [sprint-1-task-1.1-prompt.md](./sprint-1-task-1.1-prompt.md) | 新增 `tenant_members` 表 + 更新关系  |
| 2    | [sprint-1-task-1.2-prompt.md](./sprint-1-task-1.2-prompt.md) | 给 `users` 表加 `lastActiveTenantId` |
| 3    | [sprint-1-task-1.3-prompt.md](./sprint-1-task-1.3-prompt.md) | 数据迁移 SQL 脚本                    |

### Sprint 2 — 认证层改造（预估 1h）

| 顺序 | 提示词文件                                                   | 说明                    |
| ---- | ------------------------------------------------------------ | ----------------------- |
| 4    | [sprint-2-task-2.1-prompt.md](./sprint-2-task-2.1-prompt.md) | PC 端 NextAuth 认证改造 |
| 5    | [sprint-2-task-2.2-prompt.md](./sprint-2-task-2.2-prompt.md) | 新增切换租户 API        |
| 6    | [sprint-2-task-2.3-prompt.md](./sprint-2-task-2.3-prompt.md) | 小程序端微信登录改造    |
| 7    | [sprint-2-task-2.4-prompt.md](./sprint-2-task-2.4-prompt.md) | 邀请注册改造            |

### Sprint 3 — 前端适配（预估 30min）

| 顺序 | 提示词文件                                                   | 说明                  |
| ---- | ------------------------------------------------------------ | --------------------- |
| 8    | [sprint-3-task-3.1-prompt.md](./sprint-3-task-3.1-prompt.md) | PC 端切换企业组件     |
| 9    | [sprint-3-task-3.2-prompt.md](./sprint-3-task-3.2-prompt.md) | 超管防串入 Middleware |

### Sprint 4 — 测试与清理（预估 30min）

| 顺序 | 提示词文件                                                   | 说明                |
| ---- | ------------------------------------------------------------ | ------------------- |
| 10   | [sprint-4-task-4.1-prompt.md](./sprint-4-task-4.1-prompt.md) | 新增测试 + 全量回归 |

---

## 使用方法

1. 打开对应的任务提示词文件
2. 将全部内容复制给新的 subagent
3. 等待 subagent 完成并报告
4. 检查报告中的 TypeScript 编译结果
5. 确认无误后进入下一个任务

## 回滚方案

如果某个 Sprint 执行后系统不稳定：

- Sprint 1 的 SQL 迁移脚本是幂等的且保留了旧 users 列
- Sprint 2 的 auth.ts 改动可以 git revert
- 所有改动都基于「双写策略」—— 旧代码路径同时在工作
