---
name: version-release-protocol
description: Use when you are ready to release a new version, update the honor wall, deploy to production ECS, or when the user says "部署到ecs" / "上传版本" / "回滚至上一版" / "版本回滚".
---

# Version Release Protocol

## Overview

标准化的6步版本发布协议，覆盖从测试到 ECS 部署的全链路闭环。确保代码正确性、版本历史可追溯、以及安全的生产环境部署。

## When to Use

**部署新版本**，当用户说：

- "部署到ecs"、"上传版本"、"构建新版本"、"部署上线"

**回滚旧版本**，当用户说：

- "回滚至上一版"、"版本回滚"、"新版有问题"、"退回上一版"

→ 收到回滚口令时，**跳过6步协议，直接执行 [紧急回滚](#🚨-紧急回滚新版有问题时) 章节**。

## Red Flags - STOP and Start Over

- **跳过测试：** "改动很小，直接部署吧" → 不行。测试必须全部通过。
- **忽略构建报错：** "只有几个类型警告，可以强行打包" → 绝对不行。必须在本地完整运行 `pnpm run build` 且做到 0 报错，否则绝对禁止部署。
- **在 ECS 上构建：** "我在服务器上跑 `pnpm build`" → 绝对不行。ECS 只有 4GB 内存，会 OOM 崩溃。
- **跳过贡献墙更新：** "贡献墙回头再改" → 不行。UI 必须在 commit 之前更新。
- **忽略 .env 变更：** "环境变量没问题" → 不行。必须主动询问用户是否已同步 ECS 的 `.env` 文件。
- **不备份旧产物：** "直接覆盖 tar 包" → 不行。必须先重命名旧备份以支持秒级回滚。
- **跳过 Docker build：** "直接 `docker-compose up -d`" → 不行。必须先 `build --no-cache` 重建镜像，否则新代码不生效。
- **schema 改动未 generate：** "虽然改了 schema.ts，但没有执行 `pnpm db:generate`" → 绝对不行。每次修改 `src/shared/api/schema/` 下的任何文件，必须立即运行 `pnpm db:generate` 生成迁移 SQL 文件，并将生成的文件一并提交到 Git，否则 ECS 上的 db-migrate 容器将无法感知变更。

## The 6-Step Protocol

严格按顺序执行，禁止跳步。

### Step 1: 验证与预检 (Testing, Env, DB)

**测试**：运行测试套件。失败则修复后重跑，直至全部通过。

```bash
pnpm run test:run
```

**环境变量检查**：主动询问用户：

> "相公，是否有新增的环境变量需要同步到 ECS 的 `.env` 文件？如果有，请先更新。"

**数据库 Schema 检查**：检查 `drizzle/` 目录或 `src/shared/api/schema/` 是否有变更。

- 如果 `src/shared/api/schema/` 有变更，必须先执行迁移文件生成：
  ```bash
  pnpm db:generate
  ```
  确认生成了新的 `.sql` 文件后，将其一并纳入 Step 4 的 commit 中。
- `docker-compose.prod.yml` 中的 `db-migrate` 容器会在部署时自动执行 `drizzle-kit migrate`（生产级模式），按序应用所有未执行的迁移文件。
- `app` 服务在 `db-migrate` 的 `service_completed_successfully` 后才启动，顺序有保障。
- 对于**破坏性变更**（删列、改类型），必须向用户确认后才能继续，并在迁移文件中特别标注。

### Step 2: 版本号递增

根据用户指示确定范围（Major / Minor / Patch），未指定默认 **Patch**。

**重要**：先检查 `package.json` 中的 `version` 字段是否与 `src/constants/landing-data.ts` 中 `versionHistory` 的最新版本号一致。如果不一致，需要先手动校正 `package.json` 再执行版本递增。

```bash
npm version patch --no-git-tag-version
# 或 'minor', 'major'
```

### Step 3: 贡献墙与版本记录更新

必须在 commit 之前完成以下编辑：

**1. 版本历史数据** → 编辑 `src/constants/landing-data.ts`：

- 在 `versionHistory` 数组的**最前面**插入新的 `VersionRecord` 对象。
- 使用 `git log` 提取近期 commit 辅助填写 `updates` 字段：
  ```bash
  git log $(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)..HEAD --oneline
  ```
- `updates` 数组中每条记录需指定 `type`（`'feature'` | `'fix'` | `'optimize'`）和 `content`。

**2. 贡献者列表**（仅在有新贡献者时）→ 编辑 `src/app/(marketing)/components/contributors-wall.tsx`：

- 在 `contributors` 数组中添加新成员。

### Step 4: 提交与推送

```bash
git add -A
git commit -m "release: v[新版本号]"
git push origin main
git push codeup main
```

### Step 5: 本地构建与打包

ECS 只有 4GB 内存，必须在本地构建。并且必须保证本地构建 0 报错。

```bash
# 1. 构建生产产物（如果有任何 TypeScript/Turbopack 报错，必须停下来修复，严禁带错发布）
pnpm run build

# 2. 打包 standalone 产物
tar -czf next-build.tar.gz .next/standalone .next/static public package.json
```

### Step 6: 安全 ECS 部署 (含备份、镜像重建、清理)

```bash
# 1. 上传到 ECS
scp next-build.tar.gz ecs:/root/L2C/

# 2. SSH 远程：备份旧产物 → 解压新产物 → 重建镜像 → 重启服务
ssh ecs "cd /root/L2C && \
  git fetch origin main && \
  git checkout FETCH_HEAD -- .dockerignore docker-compose.prod.yml Dockerfile.prebuilt nginx/ package.json pnpm-lock.yaml drizzle/ drizzle.config.ts src/shared/api/schema.ts src/shared/api/schema/ tsconfig.json && \
  [ -f next-build.tar.gz ] && cp next-build.tar.gz next-build-backup-\$(date +%Y%m%d-%H%M%S).tar.gz || true && \
  rm -rf .next/standalone .next/static && \
  tar -xzf next-build.tar.gz && \
  sed -i '/^\.next$/d' .dockerignore && \
  docker-compose -f docker-compose.prod.yml build --no-cache && \
  echo '.next' >> .dockerignore && \
  docker rm -f l2c-app l2c-db-migrate l2c-nginx 2>/dev/null; \
  docker-compose -f docker-compose.prod.yml up -d"

# 3. 清理本地 tar 包
rm -f next-build.tar.gz
```

## 部署完成

1. 等待约 2 分钟（健康检查 `start_period=120s`）。
2. 验证：`ssh ecs "docker ps --format 'table {{.Names}}\t{{.Status}}' && curl -s -o /dev/null -w 'HTTP %{http_code}' https://l2c.asia/"`
3. 预期结果：`l2c-app Up (healthy)` + `HTTP 200`。
4. 向用户汇报：版本号、更新模块、部署状态。
5. 如果部署过程中出现了短暂停机，温馨提示用户未来可探索 Blue-Green 零停机部署方案。

---

## 🚨 紧急回滚（新版有问题时）

每次 Step 6 部署时，脚本会自动将**旧产物**重命名保存为：

```
next-build-backup-YYYYMMDD-HHMMSS.tar.gz
```

ECS 上按照时间戳保留多个版本快照，可随时回退到任意历史版本。

### 一键回滚命令

```bash
bash scripts/rollback.sh
```

脚本会自动：

1. 列出 ECS 上所有可用备份（最多 5 个，最新优先）
2. 用户选择目标版本（默认最近一个）
3. 二次确认后在 ECS 上解压旧产物 → 重建镜像 → 重启
4. 约 2 分钟后恢复服务

### 手动快速回滚（最紧急情况）

```bash
# 直接用最新备份回滚，无需交互
ssh ecs "cd /root/L2C && \
  BACKUP=\$(ls -t next-build-backup-*.tar.gz | head -1) && \
  rm -rf .next/standalone .next/static && \
  tar -xzf \"\$BACKUP\" && \
  sed -i '/^\.next$/d' .dockerignore && \
  docker-compose -f docker-compose.prod.yml build --no-cache app && \
  echo '.next' >> .dockerignore && \
  docker rm -f l2c-app 2>/dev/null; \
  docker-compose -f docker-compose.prod.yml up -d app"
```

### 备份清理（定期维护）

ECS 磁盘有限，建议每隔几个大版本手动清理旧备份：

```bash
# 仅保留最近 3 个备份
ssh ecs "cd /root/L2C && ls -t next-build-backup-*.tar.gz | tail -n +4 | xargs rm -f"
```
