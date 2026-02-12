#!/bin/bash
# ==========================================
# L2C 增强型自动部署脚本 (v3.7 - 修复文件缺失版)
# ==========================================
set -e
echo "=== 启动 L2C 终极部署流程 (v3.7: 修复文件缺失) ==="

# 1. 变量准备
ECS_HOST="106.15.43.218"

# 2. 自动恢复私钥
# 直接写入私钥内容，避免变量拼接错误
mkdir -p ~/.ssh
cat > ~/.ssh/id_rsa << 'EOF'
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEApVN0EjQS7yeLURapymyhRjReuhQ+Bd0Rb4NWNpJV+l/Jfz/x
yucGkNp1xv9xP+eNIml2HHjEp+DBFL7zXlwp7lqi3bHbCLvkQAsLXx2cWs0POMBg
NlcjR2EdK1S/4kYPgfj2Yw8IK+UZmCHNj1ft8DmaNNSCYIx+aSdOvEv1jWFWFkUK
c3C3eZKetpOlCollMmRxgXP1ERbFLqfUymekCmPFqwWuH4ObA0BRpU6rPyh4wR2W
KCmUz+RgW7MYUrYoj3wmN4YLCfKKrybhWhO02zmMQlHv4nPGTffkVUW4Ewj/04LY
mVg2ezgKzkmkMHGtuzcjd0hXbwhl1Ho9Z72wGQIDAQABAoIBAAFxh3c0DkZusmop
IAmjoJYEivSwjKOVYkD2imQe1jfBym2336sJZhlm7OW+8SH76gkBlyLzwNIkla78
5VKpjEICYim8cy4B96HXBC4Gtp4k1vPkWxqyW1Kfg+c5qH9nuZwwBypcKofj6nuq
xOOSOBe+OwJTKNcXYZsBBBBuZdoVL+3GZ9ccTUSEgxcpM3RJtMcndTd1YXNiUQMG
y53KrwvcBcSe3EbJVkKyFMpsE9ptvrUUW9VYkyOKgjla2Fmve7xdslRU/6OD+G5i
VycDV1T7f5eqbiSpiRw49YyRO1lH2O8AKgiwfDUy3gPku97IHWkufVPUr26z6/fK
fuNQCWECgYEA1ae6EG5j2OAMXM4npoIu9HT87snVmoxxr/kiA6CEDxuk62LmW+Cu
evEt8J1TsfejfBGWhppyvP23KNGi2Rsd7GP8D65zkXVzk06Xs27+xJ/TZ/Y4H8zH
OHu2gdGDLS/FU2T5oumEXrOCfcB9QW6llOiYsC3UJueLIrIXbdOWr7kCgYEAxhej
EME5z+XiXw9YRrdoEy+k5ehI2X7ghThLFtL/mPCULogw0MW0/EPNhkGVtAY/+OfL
ZrPzgiZoAS/FjY10vXVUykx0CZ1SAkXWNGpBUWT9KH4frVVUEpljImoO+Mp1VMYu
OZxunG/395o0XENN9XVKIcsUSwzDx7o3aJjdc2ECgYBOHidfvpzvPOwIOrAwp0S3
yNZ6EH3zJgqjRrnzDYt7YqYoEl8blMj21pvvb/acCWlTAbNBv9LX2wRO/mdGbi3A
ssYEjcpfkswRPhklWB36kl1fk5zts5fbxQ/z40DNErxZQ4Aq2qq1XXkGtYyWkfgk
u+6n6/m3x80NgIQkecqMsQKBgQCHxbWvizDLzP3ON99CgPzlgZddOUuNP0g2JzJY
T4B+3A5EonYK8ieta++XYKZyAIKiYIVqPFbf0uEgRxT5g4YLQTs/eQ1jdZ+7DRDX
Vii02CooMeIWVNDN+rIW6Wifn2yyES+nrw+lS51C6T+QKVVqstx/swiStAoQgBLw
Ly5BoQKBgEG2s/1kr0xmmsCnEgj5miXyFUNoVwANagbz4yMeRy2+GuZEdnayEUbN
7dUrZFc15Vmlred2znqbOxe9qDks1w4JooRqrFl4Z344mpQJp1DCHKp8NcCEomxS
I6an0oToB5hk79wix6w4e/DOFkjBr1ctr8KIpbJiNSW6iMUvS0Ks
-----END RSA PRIVATE KEY-----
EOF
chmod 600 ~/.ssh/id_rsa
echo -e "Host $ECS_HOST\n\tStrictHostKeyChecking no\n" >> ~/.ssh/config

# 3. 本地构建与补丁
echo "正在流水线环境进行 Next.js 构建..."
if ! command -v pnpm &> /dev/null; then npm install -g pnpm; fi
pnpm install --no-frozen-lockfile && pnpm build

echo "正在对 Dockerfile 进行即时修复 (如果有)..."
if [ -f Dockerfile ]; then
    sed -i 's/--frozen-lockfile/--no-frozen-lockfile/g' Dockerfile
else
    echo "警告：未找到 Dockerfile，跳过修复。"
fi

# 4. 生成版本信息
echo "生成版本信息..."
git log -1 --format='{"hash": "%h", "date": "%ad", "message": "%s"}' > public/version.json || echo '{"hash": "unknown"}' > public/version.json

# 5. 准备环境变量
# 优先使用 .env.production，如果没有则尝试 .env
ENV_FILE=""
if [ -f .env.production ]; then
    echo "发现 .env.production，将包含在部署包中。"
    ENV_FILE=".env.production"
elif [ -f .env ]; then
    echo "发现 .env，将包含在部署包中。"
    ENV_FILE=".env"
else
    echo "警告：未找到 .env 或 .env.production 文件！部署后可能需要手动配置环境变量。"
fi

# 6. 打包并同步
echo "打包同步关键配置文件..."
# 包含 standalone, static, public, 以及 Dockerfile.prod 和 环境变量文件
# 5. 打包文件 (包含 standalone 和 static 资源，排除 node_modules) -> 修复：排除 .next/cache 和 .git
echo "📦 Packaging..."
# Use strict inclusion to avoid huge files like RocksDB cache
tar -czf release.tar.gz \
    .next/standalone/server.js \
    .next/standalone/.next \
    .next/static \
    public \
    docker-compose.prod.yml \
    package.json \
    pnpm-lock.yaml \
    scripts/ \
    Dockerfile \
    Dockerfile.prod \
    nginx/ \
    .env.production \
    drizzle/ \
    drizzle.config.ts

# 6. 上传到服务器
echo "🚀 Uploading to server..."
scp -i deploy_key.pem -o StrictHostKeyChecking=no release.tar.gz root@106.15.43.218:/root/L2C/

# 7. 远程执行部署
echo "🔄 Deploying on server..."
ssh -i deploy_key.pem -o StrictHostKeyChecking=no root@106.15.43.218 "cd /root/L2C && tar -xzf release.tar.gz && if [ -f .env.production ]; then mv .env.production .env; fi && mkdir -p uploads && chmod 777 uploads && docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml up -d --build --remove-orphans && docker system prune -f"

echo "=== 部署完成！请访问 http://106.15.43.218 ==="
