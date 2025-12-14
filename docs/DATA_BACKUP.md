# 数据三备份策略说明 (Triple Data Backup Strategy)

本文档说明了 L2C 系统的数据备份策略，该策略采用 "阿里云 + 本地冷备 + Supabase 官方云" 的多重保险机制来确保数据绝对安全。

## 1. 架构概览

我们采用 **3-2-1 备份原则** 的变体：
*   **3 份数据副本**：一份生产环境，一份本地冷备，一份 Supabase 云（可选）。
*   **2 种介质**：云服务器磁盘 (ECS)，开发者机器 (Local)。
*   **1 份异地**：本地备份本质上就是异地备份。

### 拓扑图
```mermaid
graph TD
    ECS[阿里云 ECS (生产环境)] -->|postgres-backup-local| LocalDisk[ECS 本地磁盘备份]
    LocalDisk -->|scripts/backup/pull-from-ecs.sh| DevMachine[本地开发者电脑]
    DevMachine -->|scripts/backup/restore-to-local.sh| Docker[本地 Docker 开发环境]
    LocalDisk -.->|可选手动/自动| SupabaseCloud[Supabase 官方云 (灾备)]
```

## 2. 自动化脚本

位于 `scripts/backup/` 目录下的两个脚本是核心工具。

### 脚本 1: 拉取生产备份 (`pull-from-ecs.sh`)
此脚本通过 SSH 连接阿里云，找到最新的数据库备份文件，并安全下载到本地。

**使用方法**:
```bash
./scripts/backup/pull-from-ecs.sh
```
*   **输出目录**: `backups/ecs-production/`
*   **功能**: 自动下载最新备份，并清理本地旧文件（默认保留最近 15 个）。

### 脚本 2: 恢复到本地 (`restore-to-local.sh`)
此脚本将下载的 `.sql.gz` 备份文件导入到本地运行的 Docker Supabase 数据库中。

**使用方法**:
```bash
./scripts/backup/restore-to-local.sh
```
*   **前置条件**: 本地 Docker 必须正在运行 (`npm run supabase:start` 或 `docker compose up`)。
*   **注意**: 此操作会**覆盖**本地数据库及其数据，请谨慎操作。

## 3. 灾难恢复演练 (DR)

### 场景 A：误删数据
1.  **停止写入**: 暂时停止生产环境的应用服务。
2.  **查找备份**: 在 ECS 服务器 `/opt/l2c/L2C/backups` 找到误删前的备份。
3.  **恢复**: 使用 `docker exec` 命令或 pgAdmin 将该备份恢复。

### 场景 B：阿里云 ECS 彻底宕机
1.  **启用本地备份**: 找到本地 `backups/ecs-production` 中最新的备份文件。
2.  **恢复到新环境**: 启动一个新的 Supabase 实例（可以是新的 ECS，也可以是 Supabase Cloud）。
3.  **导入数据**: 使用 `pg_restore` 将本地备份导入新实例。
4.  **切换 DNS**: 将域名指向新实例 IP。

## 4. 定时任务建议
建议开发人员**每周**至少运行一次 `pull-from-ecs.sh`，确保本地拥有一份较新的全部数据冷备。
