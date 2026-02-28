# Permissions Module Audit Report - Round 1

**模块 (Module):** Permissions & Auth (RBAC体系)
**审计日期:** 2026-02-28
**执行标准:** Military-Grade Verification (基于 module-audit)

## 1. Requirement Consistency (需求一致性)
| ID | Issue | Type | Location | Suggested Action |
|:---|:---|:---|:---|:---|
| 1.1 | 缺少 RBAC 专属的需求文档 | DocMissing | `docs/02-requirements/modules/权限.md` | 创建专门的权限与角色梳理需求文档，记录目前 `PERMISSIONS` 中已实现的三态权限和数据隔离设计。 |
| 1.2 | 历史脏权限已在代码侧完全移除 | Code | `src/shared/config/permissions.ts` | **状态良好**。已确认 `*.create/edit/manage` 旧权限声明均已彻底删除，不再污染代码库与类型推导。 |

## 2. Business Logic & Code Quality (业务逻辑与代码质量)
| ID | Issue | Category | Location | Suggested Action |
|:---|:---|:---|:---|:---|
| 2.1 | 创新的通配与降级匹配机制极大地优化了鉴权逻辑 | Architecture | `src/shared/lib/auth.ts` (`checkRolePermission`) | **状态良好**。代码中巧妙实现了 `*.own.edit` / `*.all.edit` 的层级降级匹配，使得 Server Actions 中只需传入通用的 `order.edit` 即可被成功兼容拦截，架构设计非常精妙！ |
| 2.2 | 角色覆盖(`roleOverrides`)的合并拆分逻辑独立且清晰 | Quality | `src/shared/lib/role-permission-service.ts` | **状态良好**。 |

## 3. Security (安全审计)
| ID | Vulnerability | Severity | Location | Fix |
|:---|:---|:---|:---|:---|
| 3.1 | IDOR (越权访问) 的隐患提示 | High | 全局 Server Actions | `auth.ts` 中的权限校验仅校验了**操作资格**，并未自动校验**数据归属权** (Ownership)。如果某用户仅拥有 `order.own.edit` 权限，开发人员在编写具体的 API/Server Action 时，必须在数据库查询条件中增加类似 `eq(orders.userId, session.user.id)` 的限制。 |
| 3.2 | 异常授权的审计追踪 | Med | `src/shared/lib/auth.ts` | 目前 `options.audit = true` 时会自动写入 `audit_log`，且 `logger.warn` 会拦截所有越权行为并打印，安保措施强壮。 |

## 4. Database & Performance (数据库与性能审计)
| ID | Issue | Category | Location | Fix |
|:---|:---|:---|:---|:---|
| 4.1 | 字段类型不一致: `role_overrides` 使用 `text` 存储 JSON | Schema | `src/shared/api/schema/role-overrides.ts` | 预设表 `roles.permissions` 是 `jsonb`，而 `role_overrides` 中的 `addedPermissions` 和 `removedPermissions` 是 `text`。虽然功能上通过 JSON.stringify/parse 能工作，但缺乏针对 JSON 类型的完整性验证，建议统一改为 `jsonb` 提高查询性能与数据规范。 |
| 4.2 | 完美的缓存策略 | Cache | `src/shared/lib/auth.ts` (`unstable_cache`) | `getRolePermissions` 应用了有效期 300 秒与 Tag 重置，有效防止每次鉴权打满数据库连接池，性能过关。 |

## 5. UI/UX (界面与体验审计)
| ID | Issue | Category | Location | Fix |
|:---|:---|:---|:---|:---|
| 5.1 | 权限冒泡说明极度完善 | InfoArch | `src/shared/config/permissions.ts` (`PERMISSION_DESCRIPTIONS`) | 对极其专业的权限矩阵配备了直白、通俗的业务解读词条，很大程度减轻了管理者(店长)在分配角色时的认知成本，用户体验极佳。 |

## 6. Test Coverage (测试覆盖审计)
| ID | Issue | Category | Location | Fix |
|:---|:---|:---|:---|:---|
| 6.1 | 授权模块拥有完善的单元测试 | Unit | `src/shared/lib/__tests__/auth-rbac.test.ts` | 已包含最新的 `.own` / `.all` 降级校验测试，测试质量稳定。 |

## 7. Documentation (文档完整性审计)
| ID | Issue | Category | Location | Fix |
|:---|:---|:---|:---|:---|
| 7.1 | JSDoc 和代码注释完全覆写且规范 | Comments | 全局 | 注释清晰，且已将已废弃的常量(`CREATE`, `MANAGE`)标注并删除处理。 |

## 8. Observability & Operations (可运维性审计)
| ID | Issue | Category | Location | Fix |
|:---|:---|:---|:---|:---|
| 8.1 | Rate Limit 机制限制暴力破解 | Security/Ops | `src/shared/lib/auth.ts` | 登录限流以及操作越权的日志 (`logger.info`/`warn`) 以及统一路由处理保证了故障溯源的可操作性，日志上下文非常丰富。 |

## 综合建议
1. 优先建立配套的 `docs/02-requirements/modules/权限.md` 文档。
2. 建议将 `role_overrides.ts` 中的存量 `text` 类型字段迭代升级为原生 `jsonb`。
3. 加在开发指引/架构公理中声明: “只要验证涉及 `OWN` 权限，服务端对应的 SQL Query 必须携带 userId 验证条件。” 避免未来开发产生的水平越权漏洞 (IDOR)。
