---
description: 新版部署流程 - 本地 build → scp 上传产物 → ECS 解压 + docker build + 重启（无 Windows 打包痛点）
---

# deploy-pull 部署流程

> **适用场景**: 替代旧版 deploy.md，解决 Windows tar 卡死和 docker build 超时问题。
> **核心原理**: 本地构建，上传 tar，ECS 只负责解压 + docker compose build（Dockerfile.prebuilt 仅复制文件，约 30-60 秒）+ 重启。

---

## 前置：ECS 磁盘检查（每次部署前）

// turbo

```bash
ssh ecs "df -h /root | tail -1 && docker system df"
```

> 如磁盘使用率 >90%，先执行清理：
>
> ```bash
> ssh ecs "docker system prune -f"
> ```

---

## Step 1：本地构建

```powershell
# 清除旧产物（cmd rmdir 避免 EBUSY）
cmd /c "if exist .next rmdir /s /q .next" 2>$null
# 构建（约 5-10 分钟）
pnpm run build
```

---

## Step 2：打包（关闭 Defender 后再 tar，速度正常）

```powershell
# 暂停 Defender（需管理员终端），打包后自动恢复
Set-MpPreference -DisableRealtimeMonitoring $true
C:\Windows\System32\tar.exe -czf next-build.tar.gz .next/standalone .next/static public
Set-MpPreference -DisableRealtimeMonitoring $false
# 校验完整性
C:\Windows\System32\tar.exe -tzf next-build.tar.gz | Select-Object -Last 5
```

---

## Step 3：上传到 ECS

// turbo

```bash
scp -o StrictHostKeyChecking=no next-build.tar.gz ecs:/root/next-build.tar.gz
```

> 42MB 文件约需 1-2 分钟。

---

## Step 4：ECS 解压 + 重建镜像 + 启动

```bash
ssh ecs "
  # ⚠️ 关键：必须解压到临时目录，再 cp -f 覆盖，否则旧的 0 字节文件无法被正确覆盖
  mkdir -p /tmp/deploy &&
  tar -xzf /root/next-build.tar.gz -C /tmp/deploy &&
  ls -la /tmp/deploy/.next/standalone/server.js &&
  cp -rf /tmp/deploy/.next /root/L2C/ &&
  cp -rf /tmp/deploy/public /root/L2C/ &&
  rm -rf /tmp/deploy &&
  echo 'server.js:' && ls -la /root/L2C/.next/standalone/server.js &&
  cd /root/L2C &&
  docker compose -f docker-compose.prod.yml build --no-cache app &&
  docker compose -f docker-compose.prod.yml down &&
  docker compose -f docker-compose.prod.yml up -d &&
  sleep 20 &&
  docker ps --format 'table {{.Names}}\t{{.Status}}'
"
```

> **说明**：
>
> - 解压到 `/tmp/deploy` 再 `cp -rf` 是因为直接 `tar -xzf -C /root/L2C` 时 0 字节文件无法被覆盖（已在生产验证）
> - `--no-cache` 确保 Dockerfile.prebuilt 的 `COPY` 步骤不走 BuildKit 缓存
> - `build app` 只构建 runner 阶段，约 30-60 秒

---

## Step 5：健康检查

// turbo

```bash
ssh ecs "curl -sf http://localhost:3000/api/health && echo '✅ 部署成功' || (echo '❌ 健康检查失败，查看日志：' && docker logs l2c-app --tail 30)"
```

---

## 常见问题

| 问题              | 解决                                                              |
| ----------------- | ----------------------------------------------------------------- |
| tar 打包卡死      | 确认 Defender 已暂停，或改用 Git Bash                             |
| ECS 磁盘满        | `ssh ecs "docker system prune -f"`                                |
| l2c-app unhealthy | 查看 `docker logs l2c-app`，通常是数据库连接问题                  |
| build 镜像 OOM    | ECS 不直接跑 pnpm build，Dockerfile.prebuilt 仅复制文件，不会 OOM |
