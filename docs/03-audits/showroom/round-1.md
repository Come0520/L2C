# Showroom Module Audit Report - Round 1

## 1. Requirement Consistency (需求一致性)

| ID | Issue | Type | Location | Suggested Action | Decision |
|:---|:---|:---|:---|:---|:---|
| 1.1 | **删除逻辑不一致**<br>需求定义了 `ARCHIVED` (归档) 状态，但代码实现了硬删除 (`deleteShowroomItem`)。这会导致已分享给客户的链接中，若包含被删除商品，该商品会直接消失，破坏分享内容的完整性。 | Mismatch | `actions/items.ts`<br>`actions/shares.ts` | **改为软删除**：<br>1. `delete` 操作仅更新状态为 `ARCHIVED`。<br>2. 列表页过滤掉 `ARCHIVED`。<br>3. 分享详情页正常展示 `ARCHIVED` 项目（或提示失效）。 | **Fix** |
| 1.2 | **缺乏富文本清洗**<br>虽然前端使用了 `react-markdown` 防御 XSS，但后端未对 `content` 输入做任何清洗或长度限制（仅 `status` 校验），存在存储恶意脚本的风险。 | CodeMissing | `actions/items.ts`<br>`actions/schema.ts` | **增加后端清洗**：<br>引入 `sanitize-html` 或类似库，在保存前清洗 `content` 字段。 | **Fix** |

## 2. Business Logic Optimization (商业逻辑优化)

| ID | Observation | Suggestion | Value | Decision |
|:---|:---|:---|:---|:---|
| 2.1 | **高频写操作风险 (Write-on-Read)**<br>`getShareContent` 在每次**读取**分享链接时都直接 `update` 数据库的 `views` 计数。在高并发下会导致行锁竞争，影响读取性能。 | **优化计数逻辑**：<br>1. 方案A (简单): 仅在 `Math.random() < 0.1` 时采样更新，前端显示估算值。<br>2. 方案B (标准): 使用 Redis 缓存计数，定时回写 DB。<br>3. 方案C (折中): 独立 `access_logs` 表，异步写入。 | High | **Backlog** |
| 2.2 | **模糊搜索性能隐患**<br>`getShowroomItems` 使用 `%search%` (ilike) 进行全表扫描。随着素材增多，搜索会变慢。 | **引入全文检索**：<br>1. 为 `title` 字段添加 `gin` 索引 (需 `pg_trgm` 扩展)。<br>2. 或限制搜索频率/字符长度。 | Medium | **Backlog** |
| 2.3 | **评分算法过于简单**<br>目前的评分逻辑 (`calculateScore`) 是硬编码的魔法数字，难以适应业务变化（如不想强调“长文”而更看重“多图”）。 | **配置化评分**：<br>将权重提取为常量配置或系统设置 (`SETTINGS`)，允许运营调整权重。 | Low | **Ignore** |

## 3. Military-Grade Security (军工级安全)

| ID | Vulnerability | Severity | Location | Fix | Decision |
|:---|:---|:---|:---|:---|:---|
| 3.1 | **缺少公共访问频率限制 (Rate Limiting)**<br>分享链接 (`/share/[id]`) 是公开的，且包含数据库写操作 (`views` +1)。攻击者可脚本刷量，耗尽数据库连接或弄脏数据。 | High | `getShareContent` | **增加限流**：<br>1. 在 `middleware` 或 `actions` 层增加基于 IP 的限流 (Rate Limit)。<br>2. 限制单 IP 每日访问同一分享链接的次数。 | **Fix** |
| 3.2 | **潜在的越权访问 (IDOR) - 浏览量**<br>虽然 `shareId` 是 UUID 难以猜测，但若泄露，攻击者可无限增加其浏览量。 | Low | `getShareContent` | **无需修复**：UUID 具有足够熵值，且浏览量非敏感资产。重点在于防 DoS (见 3.1)。 | **Ignore** |
| 3.3 | **硬删除导致的数据丢失风险**<br>操作人员误删素材后无法找回，且没有任何操作日志记录此次删除行为（仅 `actions` 内部逻辑，无审计日志）。 | Medium | `deleteShowroomItem` | **增加审计日志**：<br>调用 `AuditService.log` 记录删除/归档操作。 | **Fix** |

## 4. 总结
本轮审计主要发现了 **数据完整性 (硬删除)** 和 **抗攻击能力 (无以限流)** 两个核心问题。建议优先修复这两个问题，并增加审计日志以满足后续合规要求。
