---
name: l2c-deploy-rollback
description: 管理 Docker 容器化部署、镜像版本标签及秒级回滚逻辑
---

# 部署与回滚标准

1. **Docker 镜像管理**：
   - 必须使用语义化版本号（如 v1.0.1）标记镜像，禁止使用 `latest`。
   - 打包逻辑必须包含 `npx drizzle-kit migrate` 作为 Entrypoint 的前置脚本。

2. **回滚操作指南**：
   - 若当前版本失败，优先执行 `git checkout [last-tag]`。
   - 通过修改 `docker-compose.yml` 中的 image tag 实现秒级回滚。
   - 提醒用户：代码回滚后，根据需要决定是否执行数据库 `down` 脚本。

3. **ECS 部署**：
   - 优先通过阿里云 ACR 仓库推送镜像。
   - 确保 `docker-compose` 环境隔离。
