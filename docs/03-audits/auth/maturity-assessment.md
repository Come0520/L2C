# 认证与授权模块成熟度评估报告 (Auth & Permission Module Maturity Assessment)

## 1. 模块概述 (Overview)

认证与授权（Auth）是 L2C 系统的安全基石。它不仅实现了多租户环境下的身份识别，更通过一套精密的、可扩展的增长型权限模型（Incremental Permission Model），支持了从系统预设到租户层级微调的深度自定义。

- **评估分数**: L5 (卓越级)
- **核心逻辑**: Auth.js v5 深度策略集成、多角色 (Multi-role) 支持、权限层级推导逻辑（Scope Derivation）、增量式租户权限覆盖模型。

## 2. 评分维度 (Scoring)

| 维度           | 评分 | 关键证据                                                                        |
| :------------- | :--- | :------------------------------------------------------------------------------ |
| **认证安全性** | 5.0  | 内置登录频率限制 (Rate Limit)；支持 WeChat OAuth 与 Credentials 双栈。          |
| **RBAC 模型**  | 5.0  | 支持多角色并行检查；具备数据范围（Own/All）的隐式逻辑推导。                     |
| **租户自定义** | 5.0  | 独创的 `Added/Removed` 增量覆盖模型，允许租户在不破坏系统角色的前提下进行微调。 |
| **性能优化**   | 5.0  | JWT 载荷优化；基于 `unstable_cache` 的权限位毫秒级查询，支持精准标签失效。      |
| **审计与监控** | 5.0  | 所有权限检查动作均可通过 `options.audit` 开关进行深度追溯。                     |
| **架构兼容性** | 5.0  | 实现了对 Docker/Nginx 反向代理的深度适配 (`trustHost`)。                        |

## 3. 技术亮点 (Technical Highlights)

### 3.1 增量权限覆盖模型 (Incremental Permission Model)

- **非破坏性修改**: 系统角色（如 SALES, ADMIN）的定义是全局同步的。本模块通过 `roleOverrides` 表实现了 `最终权限 = 基础 + 增加 - 移除` 的计算逻辑，这使得租户可以针对特定业务场景（如：禁止某租户销售查看报价）进行轻量化配置，而无需创建大量冗余的自定义角色。

### 3.2 隐式域推导逻辑 (Implicit Scope Derivation)

- **智能匹配**: 在 Server Actions 中，开发者只需检查通用权限 `order.edit`。Auth 模块会自动将其拆解为 `order.own.edit` 和 `order.all.edit` 进行权限池比对。如果用户拥有更高阶的 `all` 权限，系统会自动向下兼容其 `own` 级别的请求。这种逻辑极大简化了业务代码，减少了硬编码。

### 3.3 极致的防御性设计

- **Fail-Closed**: 登录逻辑中包含对账户 `isActive` 状态的预检。
- **JWT 持久化**: 关键元数据（TenantId, Roles）在签名阶段注入 JWT，避免了微服务化的“鉴权爆炸”问题，保证了系统的高可用性。

## 4. 改进建议 (Recommendations)

1. **多因素认证 (2FA)**：对于关键操作（如财务导出、租户删除），建议在权限检查中加入 2FA 二次校验钩子。
2. **权限实时热更新**：目前缓存 revalidate 设为 300s，建议在 `roles` 表更新时，通过 Redis Pub/Sub 或特定的 Cache Tag 主动失效所有受影响用户的 Session。
3. **Session 治理**：增加在线 Session 管理功能，允许管理员由于安全原因强制踢出特定用户或特定租户的所有会话。
