# L2C 阿里云ECS部署手册

> 版本: 2.0  
> 更新时间: 2025-12-04  
> 适用环境: 阿里云ECS + Supabase Self-hosted

## 📋 部署前准备清单

### 1. 阿里云资源

- [x] ECS实例（华东2-上海E）
  - 推荐配置：4核8GB + 100GB SSD
  - 已安装 Docker 和 Docker Compose
  - 已配置安全组（开放80、443端口）

- [x] 容器镜像服务（ACR）
  - 命名空间：`l2c-production`
  - 仓库：`l2c-frontend`

- [x] 对象存储（OSS）
  - Bucket：`l2c-backups`
  - 地域：cn-shanghai

- [x] 域名
  - 域名：`www.luolai-sd.xin`
  - SSL证书（需准备）

### 2. GitHub Secrets配置

在 GitHub 仓库设置 > Secrets and variables > Actions 中添加以下密钥：

```bash
# 阿里云容器镜像服务
ALIYUN_DOCKER_USERNAME=your-aliyun-account
ALIYUN_DOCKER_PASSWORD=your-aliyun-password

# ECS SSH 连接
ECS_HOST=your-ecs-public-ip
ECS_USERNAME=root
ECS_SSH_KEY=your-private-ssh-key

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://www.luolai-sd.xin/api
SUPABASE_ANON_KEY=your-generated-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-generated-service-role-key
```

## 🚀 初次部署步骤

### 步骤1：准备ECS环境

```bash
# SSH 登录到 ECS
ssh root@your-ecs-ip

# 安装 Docker
curl -fsSL https://get.docker.com | bash
systemctl start docker
systemctl enable docker

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 步骤2：创建项目目录

```bash
# 创建项目目录
mkdir -p /opt/l2c
cd /opt/l2c

# 创建数据目录
mkdir -p /data/l2c-backups
mkdir -p /data/postgres
mkdir -p /data/storage
```

### 步骤3：上传配置文件

从本地上传配置文件到ECS：

```bash
# 在本地执行
scp docker-compose.production.yml root@your-ecs-ip:/opt/l2c/
scp .env.production.example root@your-ecs-ip:/opt/l2c/.env.production
scp -r nginx root@your-ecs-ip:/opt/l2c/
scp -r scripts root@your-ecs-ip:/opt/l2c/
```

### 步骤4：配置环境变量

```bash
# 在 ECS 上编辑环境变量
cd /opt/l2c
vi .env.production

# 生成 JWT 密钥
openssl rand -base64 32

# 生成 Supabase API 密钥（使用官方工具）
# 访问：https://supabase.com/docs/guides/self-hosting/docker#generating-api-keys
```

### 步骤5：配置SSL证书

#### 方式A：使用 Let's Encrypt（推荐）

```bash
# 安装 Certbot
apt-get update
apt-get install certbot

# 获取证书
certbot certonly --standalone -d www.luolai-sd.xin

# 复制证书到nginx目录
cp /etc/letsencrypt/live/www.luolai-sd.xin/fullchain.pem /opt/l2c/nginx/ssl/
cp /etc/letsencrypt/live/www.luolai-sd.xin/privkey.pem /opt/l2c/nginx/ssl/

# 设置自动续期
echo "0 3 * * * /usr/bin/certbot renew --quiet && cp /etc/letsencrypt/live/www.luolai-sd.xin/*.pem /opt/l2c/nginx/ssl/" | crontab -
```

#### 方式B：上传自有证书

```bash
# 上传证书文件
scp fullchain.pem root@your-ecs-ip:/opt/l2c/nginx/ssl/
scp privkey.pem root@your-ecs-ip:/opt/l2c/nginx/ssl/
```

### 步骤6：启动服务

```bash
cd /opt/l2c

# 登录阿里云ACR
docker login --username=your-aliyun-account registry.cn-shanghai.aliyuncs.com

# 首次启动（会自动拉取镜像）
docker-compose -f docker-compose.production.yml up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 步骤7：初始化数据库

```bash
# 进入数据库容器
docker exec -it l2c-supabase-db psql -U postgres

# 执行迁移（如有）
\i /docker-entrypoint-initdb.d/your-migration.sql

# 退出
\q
```

### 步骤8：验证部署

```bash
# 检查应用健康
curl https://www.luolai-sd.xin/api/health

# 检查 Supabase API
curl https://www.luolai-sd.xin/api/rest/v1/

# 访问管理面板（仅内网）
curl http://localhost:3001
```

## 🔄 日常运维

### 查看服务状态

```bash
cd /opt/l2c
docker-compose ps
docker-compose logs -f web-app
```

### 重启服务

```bash
# 重启单个服务
docker-compose restart web-app

# 重启所有服务
docker-compose restart

# 停止所有服务
docker-compose down

# 启动所有服务
docker-compose up -d
```

###更新应用

```bash
# 方式1：通过 GitHub Actions 自动部署（推荐）
# Git push 到 main 分支即可自动部署

# 方式2：手动更新
docker pull registry.cn-shanghai.aliyuncs.com/l2c-production/l2c-frontend:latest
docker-compose up -d web-app
```

### 备份数据 (3-2-1 策略)

我们采用 **本地快照 + 本地文件 + 异地 OSS** 的多级备份策略。

#### 1. 配置 OSS 自动备份
确保 `docker-compose.production.yml` 中 `db-backup` 服务已配置以下变量：
```yaml
environment:
  WALA_S3_BUCKET: l2c-backups
  WALA_S3_ACCESS_KEY: <your-access-key>
  WALA_S3_SECRET_KEY: <your-secret-key>
  WALA_S3_ENDPOINT: oss-cn-shanghai.aliyuncs.com
  SCHEDULE: "@daily"
```

#### 2. 手动触发备份验证
```bash
# 触发备份脚本
docker exec l2c-db-backup /backup.sh

# 验证本地文件
ls -lh /data/l2c-backups/

# 验证 OSS 文件
# (需安装 ossutil 或登录阿里云控制台查看)
```

#### 3. 阿里云 ECS 快照
建议在阿里云控制台为系统盘和数据盘设置 "自动快照策略"，频率建议为 **每天凌晨 3:00**，保留周期 7 天。

## 📊 监控与日志

### 查看容器资源使用

```bash
docker stats
```

### 查看磁盘使用

```bash
df -h
du -sh /data/*
```

### 查看 Nginx 日志

```bash
tail -f /opt/l2c/nginx/logs/access.log
tail -f /opt/l2c/nginx/logs/error.log
```

### 查看应用日志

```bash
docker logs -f l2c-web-app
docker logs -f l2c-supabase-db
```

## 🚨 故障排查

### 问题1：应用无法访问

```bash
# 检查 Nginx 状态
docker logs l2c-nginx

# 检查应用状态
docker exec l2c-web-app node -e "require('http').get('http://localhost:3000/api/health', (r) => console.log(r.statusCode))"

# 检查端口监听
netstat -tlnp | grep -E '80|443'
```

### 问题2：数据库连接失败

```bash
# 检查数据库状态
docker exec l2c-supabase-db pg_isready -U postgres

# 查看数据库日志
docker logs l2c-supabase-db

# 测试连接
docker exec l2c-supabase-db psql -U postgres -c "SELECT 1"
```

### 问题3：磁盘空间不足

```bash
# 清理 Docker 镜像
docker system prune -a

# 清理旧备份
find /data/l2c-backups -name "*.tar.gz" -mtime +30 -delete

# 清理 Docker 日志
truncate -s 0 /var/lib/docker/containers/*/*-json.log
```

### 问题4：SSL 证书过期

```bash
# 手动续期
certbot renew

# 复制新证书
cp /etc/letsencrypt/live/www.luolai-sd.xin/*.pem /opt/l2c/nginx/ssl/

# 重启 Nginx
docker-compose restart nginx
```

## 🔐 安全加固

### 修改默认密码

```bash
# 修改数据库密码
docker exec -it l2c-supabase-db psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'new-strong-password';"

# 更新 .env.production 中的密码
vi /opt/l2c/.env.production

# 重启服务
docker-compose restart
```

### 配置防火墙

```bash
# 安装 ufw
apt-get install ufw

# 配置规则
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable

# 查看状态
ufw status
```

### 限制 SSH 访问

```bash
# 编辑 SSH 配置
vi /etc/ssh/sshd_config

# 修改以下配置
PermitRootLogin no
PasswordAuthentication no
AllowUsers your-user

# 重启 SSH
systemctl restart sshd
```

## 📞 紧急联系

- **技术支持**: tech@luolai-sd.xin
- **运维团队**: ops@luolai-sd.xin
- **备用联系**: 阿里云工单系统

## 📚 相关文档

- [部署方案](../implementation_plan.md)
- [Docker配置说明](../docker-compose.production.yml)
- [备份策略](../scripts/backup/README.md)
- [CI/CD流程](../.github/workflows/deploy-production.yml)
