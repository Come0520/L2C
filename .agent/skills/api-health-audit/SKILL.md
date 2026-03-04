---
name: api-health-audit
description: 批量检查所有 API 路由的可用性和响应规范。在发布前验证无 500 错误，在发布后验证服务恢复正常。当 version-release-protocol 的 Step 0 Gate 0.4 调用时触发。
---

# API Health Audit: 全量 API 健康检查

## Overview

对 L2C 系统的所有 API 端点进行批量健康检查，验证可用性、响应格式和边界处理。

**核心价值**：确保每一个 API 端点在发布前都"能跑通、不崩溃、返回正确结构"。

## When to Use

- **发布门禁**：被 `version-release-protocol` Step 0 Gate 0.4 调用
- **部署后验证**：部署完成后验证所有 API 已恢复
- **日常巡检**：定期检查 API 可用性

## 通过标准 (Pass/Fail Criteria)

|  级别   | 条件                                           |        结果         |
| :-----: | :--------------------------------------------- | :-----------------: |
| 🚫 硬性 | 任何核心 API 返回 `5xx`                        | **FAIL — 阻断发布** |
| 🚫 硬性 | 响应 JSON 缺少关键字段（如 `data`、`success`） | **FAIL — 阻断发布** |
| ⚠️ 软性 | 非核心 API 返回 `4xx`                          |    记录，不阻断     |
| ⚠️ 软性 | 响应时间 > 5 秒                                |    记录，不阻断     |

---

## 1. API 全量清单

### Web 端 API（需管理者 Session）

| #   | 端点                               | 方法 | 预期状态码 | 核心？ |
| --- | ---------------------------------- | ---- | ---------- | :----: |
| W1  | `/api/health`                      | GET  | 200        |   ✅   |
| W2  | `/api/workbench/stats`             | GET  | 200        |   ✅   |
| W3  | `/api/workbench/recent-activities` | GET  | 200        |   ✅   |
| W4  | `/api/workbench/pipeline`          | GET  | 200        |   ✅   |
| W5  | `/api/workbench/reminders`         | GET  | 200        |   ✅   |

### 小程序端 API（需对应角色 Token）

#### 通用接口（所有角色）

| #   | 端点                          | 方法 | 预期状态码 | 核心？ |
| --- | ----------------------------- | ---- | ---------- | :----: |
| M1  | `/api/miniprogram/auth/login` | POST | 200        |   ✅   |
| M2  | `/api/miniprogram/config`     | GET  | 200        |   ✅   |
| M3  | `/api/miniprogram/dashboard`  | GET  | 200        |   ✅   |

#### 管理者/销售接口

| #   | 端点                           | 方法 | 预期状态码 | 核心？ |
| --- | ------------------------------ | ---- | ---------- | :----: |
| M4  | `/api/miniprogram/leads/list`  | GET  | 200        |   ✅   |
| M5  | `/api/miniprogram/customers`   | GET  | 200        |   ✅   |
| M6  | `/api/miniprogram/orders`      | GET  | 200        |   ✅   |
| M7  | `/api/miniprogram/quotes/list` | GET  | 200        |   ✅   |
| M8  | `/api/miniprogram/tasks/list`  | GET  | 200        |   ✅   |
| M9  | `/api/miniprogram/sales/list`  | GET  | 200        |   ⚠️   |
| M10 | `/api/miniprogram/products`    | GET  | 200        |   ⚠️   |
| M11 | `/api/miniprogram/channels`    | GET  | 200        |   ⚠️   |

#### 师傅接口

| #   | 端点                                 | 方法 | 预期状态码 | 核心？ |
| --- | ------------------------------------ | ---- | ---------- | :----: |
| M12 | `/api/miniprogram/engineer/tasks`    | GET  | 200        |   ✅   |
| M13 | `/api/miniprogram/engineer/schedule` | GET  | 200        |   ⚠️   |

#### 客户接口

| #   | 端点                            | 方法 | 预期状态码 | 核心？ |
| --- | ------------------------------- | ---- | ---------- | :----: |
| M14 | `/api/miniprogram/crm/projects` | GET  | 200        |   ✅   |
| M15 | `/api/miniprogram/crm/progress` | GET  | 200        |   ⚠️   |

### 移动端 API（需对应角色 Session）

| #   | 端点                          | 方法 | 预期状态码 | 核心？ |
| --- | ----------------------------- | ---- | ---------- | :----: |
| H1  | `/api/mobile/dashboard/stats` | GET  | 200        |   ✅   |
| H2  | `/api/mobile/leads/list`      | GET  | 200        |   ✅   |
| H3  | `/api/mobile/tasks/list`      | GET  | 200        |   ✅   |
| H4  | `/api/mobile/orders/list`     | GET  | 200        |   ✅   |
| H5  | `/api/mobile/quotes/list`     | GET  | 200        |   ✅   |
| H6  | `/api/mobile/earnings/stats`  | GET  | 200        |   ⚠️   |
| H7  | `/api/mobile/approvals/list`  | GET  | 200        |   ⚠️   |

---

## 2. 边界测试

除了基本可用性，还需验证以下边界场景：

| 测试项        | 验证方式                               | 通过标准                                     |
| ------------- | -------------------------------------- | -------------------------------------------- |
| 空数据响应    | 对列表 API 传 `?page=999` 或无数据租户 | 返回 `{ data: [], total: 0 }` 格式，不报 500 |
| 分页边界      | `?page=0` 或 `?pageSize=-1`            | 返回合理默认值或 400，不报 500               |
| 无 Token 访问 | 不携带认证信息访问受保护 API           | 返回 401/403，不报 500                       |
| 无效 Token    | 携带过期/伪造 Token                    | 返回 401，不报 500                           |

---

## 3. 检查流程

```
1. 启动开发服务器（或连接生产环境）
2. 获取各角色的有效认证凭证
3. 按清单逐一发送请求
4. 记录响应状态码和关键字段
5. 生成 ✅/❌ 矩阵报告
6. 返回 PASS/FAIL 给调用方
```

## 4. 报告模板

```markdown
# API Health Audit Report

> 审计时间：YYYY-MM-DD HH:mm
> 环境：开发 / 生产
> 总端点数：XX
> 通过数：XX ✅
> 失败数：XX ❌
> 警告数：XX ⚠️

## 结果矩阵

| #   | 端点                            | 状态码 | 结果 | 备注                      |
| --- | ------------------------------- | ------ | :--: | ------------------------- |
| W1  | /api/health                     | 200    |  ✅  |                           |
| M12 | /api/miniprogram/engineer/tasks | 500    |  ❌  | Error: relation not found |
| ... | ...                             | ...    | ...  | ...                       |

## 边界测试结果

| 测试项     | 结果 | 备注                |
| ---------- | :--: | ------------------- |
| 空数据响应 |  ✅  |                     |
| 分页边界   |  ⚠️  | page=0 返回全量数据 |
| ...        | ...  | ...                 |

## 门禁判定

**PASS** ✅ / **FAIL** ❌

失败原因（如有）：

- M12: `/api/miniprogram/engineer/tasks` 返回 500
```

## 5. 与其他 Skill 的关系

| 场景                                               | 关系                                             |
| :------------------------------------------------- | :----------------------------------------------- |
| 被 `version-release-protocol` Step 0 Gate 0.4 调用 | 返回 PASS/FAIL                                   |
| 发现 API 持续 500                                  | 建议用户调用 `systematic-debugging` 定位根因     |
| API 响应结构不一致                                 | 建议用户调用 `module-audit` 对相关模块做深度审计 |
