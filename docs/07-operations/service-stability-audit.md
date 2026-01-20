# 服务稳定性隐患排查报告 (Service Stability Audit Report)

> **审计时间**: 2026-01-20
> **审计对象**: 代码库 (scripts, config, db), 运维文档
> **背景**: 基于 Atlassian, AWS 等历史大型事故进行的预防性排查。

---

## 1. 🚨 高危隐患 (High Severity)

### 1.1 维护脚本：备份恢复强依赖 Docker
**风险类型**: 维护脚本错误 (Maintenance Script Error)
**相关案例**: Atlassian (2022) - 脚本错误删除数据
**现状分析**:
- `scripts/db-backup.ts` 和 `scripts/db-restore.ts` 使用 `docker exec` 直接操作容器。
- **隐患**: 如果未来数据库迁移至云托管服务 (如 Aliyun RDS, AWS RDS) 或本地非 Docker 环境，**备份将立即失效**，且恢复脚本将无法执行。
- **推荐方案**:
  - 改造脚本：检测 `DATABASE_URL`，优先使用 `pg_dump` / `psql` 客户端工具通过网络连接数据库，而非依赖 `docker exec`。
  - 增加 CI/CD 每日自动备份验证 (Backup Verification)。

### 1.2 配置管理：环境变量缺乏严格校验
**风险类型**: 配置变更问题 (Configuration Change)
**相关案例**: Slack (2021) - 配置错误导致宕机
**现状分析**:
- `src/shared/config/env.ts` 中大量使用 `|| ''` 默认值（如 `OSS_ACCESS_KEY_ID`）。
- 虽然 `db.ts` 手动检查了 `DATABASE_URL`，但其他服务（如 OSS, SMS, Auth）可能在运行时因配置为空而静默失败或抛出难以调试的错误。
- **隐患**: 部署时遗漏环境变量，应用仍能启动，但在用户上传文件或发送短信时崩溃。
- **推荐方案**:
  - 引入 `zod` 或 `t3-env` 进行构建时/启动时环境变量严格校验 (Schema Validation)。
  - 缺少关键配置直接拒绝启动 (Fail Fast)。

---

## 2. 🟠 中度隐患 (Medium Severity)

### 2.1 数据库：单点与连接池配置
**风险类型**: 数据库故障 (Database Failure)
**相关案例**: Salesforce (2022)
**现状分析**:
- `src/shared/api/db.ts` 配置了 `max: 20` 的连接池。
- **隐患**:
  - 20 个连接在并发高峰期主要可能不足，导致请求阻塞 (Connection Timeout)。
  - 目前架构为单点数据库，无读写分离或主从切换配置。
- **推荐方案**:
  - 压测确定合理的连接池大小或使用 PgBouncer。
  - 云端部署建议开启 RDS 高可用版 (High Availability)。

### 2.2 基础设施：缺乏异地容灾
**风险类型**: 基础设施故障 (Infrastructure Failure)
**相关案例**: AWS us-east-1 (2025)
**现状分析**:
- 备份策略文档 (`backup-strategy.md`) 中 "跨区域复制" 标记为由 "[可选]" 或 "待实施"。
- `env.ts` 硬编码默认 `oss-cn-hangzhou`。
- **隐患**: 若杭州区域发生物理故障（光缆挖断/断电），服务将全线瘫痪。
- **推荐方案**:
  - 落地 OSS 跨区域复制策略。
  - 确保应用可配置 Region，不硬编码。

---

## 3. 🟡 预防性建议 (Low Severity / Improvements)

### 3.1 软件 Bug：缺乏集中式监控
**风险类型**: 软件 Bug (Software Bug)
**相关案例**: Twilio (2022)
**现状分析**:
- 项目依赖中包含 `openai` 但未见 `sentry`, `datadog` 等监控 SDK。
- `l2c-check.ts` 仅为本地检查脚本。
- **隐患**: 线上发生 JS 报错或 API 500 时，开发人员无法第一时间感知，需用户报障。
- **推荐方案**:
  - 集成 Sentry 或类似的 Error Tracking 系统。
  - 配置 API 失败率告警。

### 3.2 存储：OSS 密钥管理
**风险类型**: 存储设备/配置 (Storage)
**现状分析**:
- OSS 配置直接读取环境变量，无轮换机制。
- **隐患**: 密钥泄露可能导致数据被恶意删除或加密（勒索软件风险）。
- **推荐方案**:
  - 使用 RAM 角色 (STS Token) 而非长期 AccessKey。
  - `backup-strategy.md` 提到的 "WORM (防篡改)" 策略应尽快落地。

---

## 4. 立即执行计划 (Action Items)

| 优先级 | 任务 | 负责人 | 预计工时 |
|:---:|:---|:---:|:---:|
| 🔴 P0 | **改造备份脚本**: 支持非 Docker 环境 (RDS 兼容) | 后端 | 4h |
| 🔴 P0 | **环境变量强校验**: 引入 Zod Schema 校验 `env.ts` | 架构 | 2h |
| 🟠 P1 | **安装监控 SDK**: 集成 Sentry / 飞书告警 | 运维 | 3h |
| 🟠 P1 | **OSS 防勒索配置**: 开启版本控制与保留策略 | 运维 | 1h |
