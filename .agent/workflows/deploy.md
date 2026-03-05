---
description: 标准化部署流程 - 本地构建 → 上传 → ECS 远程部署
---

# 标准化部署流程

> **适用场景**: 每次需要将本地代码变更发布到线上 ECS 时执行此流程。
> **前提**: ECS 只有 4GB 内存，无法在服务器上构建，必须本地构建后上传产物。

## 流程步骤

### 1. 确保代码已提交并推送

// turbo

```bash
git add -A && git commit -m "deploy: <描述>" && git push origin main && git push codeup main
```

### 2. 本地构建生产环境产物

```bash
pnpm run build
```

> 这一步会在 `.next/` 目录下生成 standalone 模式的产物。

### 3. 检查数据库 Schema 变更（必须执行）

```bash
# 检查最近5次提交是否有 schema 文件改动
git diff --name-only HEAD~5 -- src/shared/api/schema/
```

- **如果有输出**（说明 schema 有变更）：必须确认 `drizzle/` 目录下已有对应的 `.sql` 迁移文件（即已执行过 `pnpm db:generate` 并提交）
- **如果没有生成**：先执行 `pnpm db:generate`，检查生成的 `.sql` 文件，再提交后继续
- ❌ **铁律**：严禁跳过此步或通过数据库工具手动加字段/建表，否则会导致 db-migrate 与真实 schema 不同步，重演 2026-03 生产事故

### 4. 打包构建产物

// turbo

```bash
tar -czf next-build.tar.gz .next/standalone .next/static public
```

### 5. 上传到 ECS

```bash
scp next-build.tar.gz ecs:/root/L2C/
```

### 6. 在 ECS 上备份旧产物 + 解压 + 同步配置 + 重建镜像 + 重启

```bash
ssh ecs "cd /root/L2C && \
  git fetch origin main && \
  git checkout FETCH_HEAD -- .dockerignore docker-compose.prod.yml Dockerfile.prebuilt nginx/ package.json pnpm-lock.yaml drizzle/ drizzle.config.ts src/shared/api/schema.ts src/shared/api/schema/ tsconfig.json && \
  [ -f next-build.tar.gz ] && cp next-build.tar.gz next-build-backup-\$(date +%Y%m%d-%H%M%S).tar.gz || true && \
  rm -rf .next/standalone .next/static && \
  tar -xzf next-build.tar.gz && \
  sed -i '/^\.next$/d' .dockerignore && \
  docker compose -f docker-compose.prod.yml build --no-cache && \
  echo '.next' >> .dockerignore && \
  docker rm -f l2c-app l2c-db-migrate l2c-nginx 2>/dev/null || true; \
  docker compose -f docker-compose.prod.yml up -d"
```

> 备份文件命名为 `next-build-backup-YYYYMMDD-HHMMSS.tar.gz`，支持紧急回滚。

> 注意：`drizzle/` 目录从 Git 同步是关键。db-migrate 容器执行 `migrate` 时需要读取 `drizzle/*.sql` 文件，必须确保最新的迁移文件已在 ECS 上。

### 7. 验证部署

```bash
# 等待 2 分钟（健康检查 start_period=120s）
sleep 120
ssh ecs "docker ps --format 'table {{.Names}}\t{{.Status}}' && curl -s -o /dev/null -w 'HTTP %{http_code}' https://l2c.asia/"
```

> 预期: `l2c-app Up x minutes (healthy)` + `HTTP 200`

## 注意事项

- **ECS 只有 4GB 内存**，`pnpm build` 峰值需 6-8GB，所以**绝不能**在 ECS 上执行构建
- ❌ **禁止通过 Navicat、DataGrip 等 GUI 工具手动修改线上数据库表结构**，会导致 Drizzle 迁移系统断层（见 Step 3）
- 一键脚本 `scripts/deploy.sh` 封装了上述全部步骤，但需要 SSH 免密登录
- 如果 `docker-compose up` 报 `ContainerConfig` 错误，先 `docker rm -f` 清理所有旧容器再重试
- 健康检查使用 Node.js http 请求（不是 curl/wget），2 分钟 start_period 后才开始计数
- 紧急回滚：ECS 上执行 `ls -t next-build-backup-*.tar.gz | head -1` 找到最新备份，解压后重启即可

### 7. 部署后冒烟测试（必须执行）

```bash
# 检查健康 API（确认 DB 连接 + 认证子系统就绪）
curl -s https://l2c.asia/api/health | python3 -m json.tool
# 预期: { "status": "healthy", "dbStatus": "connected", "authReady": true }
# 如果 authReady 为 false，说明部署产物有问题，需要重新构建并部署
```

> ⚠️ **关键**：如果 `authReady` 为 `false`，**禁止宣告部署完成**。此标志表示认证子系统（users 表查询）不可用，用户登录会失败并误报"密码错误"。
