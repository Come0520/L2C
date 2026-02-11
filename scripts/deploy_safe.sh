#!/bin/bash
# ==========================================
# L2C 安全自动部署脚本 (CI/CD 专用)
# 依赖环境变量: SSH_PRIVATE_KEY
# 可选环境变量: ECS_HOST (默认为 106.15.43.218)
# ==========================================
set -e

# 1. 检查环境变量
if [ -z "$SSH_PRIVATE_KEY" ]; then
  echo "Error: SSH_PRIVATE_KEY environment variable is not set."
  echo "请在流水线设置的 '环境变量' 中添加 SSH_PRIVATE_KEY"
  exit 1
fi

ECS_HOST=${ECS_HOST:-"106.15.43.218"}
echo "=== 启动 L2C 自动部署 (Target: $ECS_HOST) ==="

# 2. 配置 SSH
mkdir -p ~/.ssh
# 将环境变量中的私钥写入文件
echo "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa
chmod 600 ~/.ssh/id_rsa
# 配置免密登录
echo -e "Host $ECS_HOST\n\tStrictHostKeyChecking no\n" >> ~/.ssh/config

# 3. 构建
# 注意: 这里假设仓库中的 Dockerfile 已经修正为 --no-frozen-lockfile
echo "正在构建 Next.js 应用..."
if ! command -v pnpm &> /dev/null; then npm install -g pnpm; fi
pnpm install --no-frozen-lockfile
pnpm build

# 4. 打包
echo "打包部署文件..."
# 包含 standalone, static, public 以及必要的配置文件的脚本
tar -czf release.tar.gz .next/standalone .next/static public docker-compose.prod.yml package.json pnpm-lock.yaml scripts/ Dockerfile nginx/

# 5. 上传与部署
echo "上传至服务器..."
scp release.tar.gz root@$ECS_HOST:/root/L2C/

echo "执行远程重启..."
ssh root@$ECS_HOST << 'EOF'
  cd /root/L2C
  tar -xzf release.tar.gz
  docker compose -f docker-compose.prod.yml down
  docker compose -f docker-compose.prod.yml up -d --build
  docker system prune -f
EOF

echo "=== 部署成功！ ==="
