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

### 3. 打包构建产物
// turbo
```bash
tar -czf next-build.tar.gz .next/standalone .next/static public
```

### 4. 上传到 ECS
```bash
scp next-build.tar.gz ecs:/root/L2C/
```

### 5. 在 ECS 上解压 + 同步配置 + 重建镜像 + 重启
```bash
ssh ecs "cd /root/L2C && \
  git fetch origin main && \
  git checkout FETCH_HEAD -- .dockerignore docker-compose.prod.yml Dockerfile.prebuilt nginx/ package.json && \
  rm -rf .next/standalone .next/static && \
  tar -xzf next-build.tar.gz && \
  sed -i '/^\.next$/d' .dockerignore && \
  docker-compose -f docker-compose.prod.yml build --no-cache app && \
  echo '.next' >> .dockerignore && \
  docker rm -f l2c-app l2c-db-migrate l2c-nginx 2>/dev/null; \
  docker-compose -f docker-compose.prod.yml up -d"
```

### 6. 验证部署
```bash
# 等待 2 分钟（健康检查 start_period=120s）
sleep 120
ssh ecs "docker ps --format 'table {{.Names}}\t{{.Status}}' && curl -s -o /dev/null -w 'HTTP %{http_code}' https://l2c.asia/"
```
> 预期: `l2c-app Up x minutes (healthy)` + `HTTP 200`

## 注意事项

- **ECS 只有 4GB 内存**，`pnpm build` 峰值需 6-8GB，所以**绝不能**在 ECS 上执行构建
- 一键脚本 `scripts/deploy.sh` 封装了上述全部步骤，但需要 SSH 免密登录
- 如果 `docker-compose up` 报 `ContainerConfig` 错误，先 `docker rm -f` 清理所有旧容器再重试
- 健康检查使用 Node.js http 请求（不是 curl/wget），2 分钟 start_period 后才开始计数
