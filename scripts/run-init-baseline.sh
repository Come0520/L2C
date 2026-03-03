#!/bin/bash
# 基线初始化脚本 - 在 ECS 上直接执行

# 1. 将 drizzle/ 目录复制到 l2c-app 容器
docker cp /root/L2C/drizzle l2c-app:/tmp/drizzle

# 2. 确认文件复制成功
echo "=== 容器内文件数量 ==="
docker exec l2c-app sh -c "ls /tmp/drizzle/*.sql | wc -l"

# 3. 执行基线初始化脚本
docker cp /root/L2C/init-migrations-baseline.js l2c-app:/tmp/
docker exec l2c-app node /tmp/init-migrations-baseline.js
