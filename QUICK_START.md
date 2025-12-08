# L2C 快速开始指南（本地构建版）

> **部署方案**：直接在 ECS 上构建 Docker 镜像  
> **优势**：无需 ACR，完全免费，配置简单  
> **预计时间**：首次部署约 30-40 分钟

---

## 📋 前置条件

### 已确认 ✅
- [x] ECS 服务器：101.132.152.132
- [x] SSH 密钥：/Users/laichangcheng/Downloads/罗莱-圣都.pem
- [x] 域名：www.luolai-sd.xin
- [x] DNS 提供商：阿里云

### 待完成 ⏳
- [ ] 配置域名 A 记录指向 ECS IP
- [ ] 确认 SSH 可以连接到 ECS
- [ ] （可选）填写 GITHUB_REPO 用于 CI/CD
- [ ] （可选）配置 SMTP 邮件服务

---

## 🚀 部署方式

### 方式一：一键部署（推荐）⭐

**适合**：快速部署，自动化配置

```bash
# 1. 进入项目目录
cd "/Users/laichangcheng/Documents/文稿 - 来长城的MacBook Air/trae/L2C"

# 2. 确保域名 DNS 已配置
ping www.luolai-sd.xin
# 应该能 ping 通 101.132.152.132

# 3. 执行一键部署脚本
./deploy-local-build.sh
```

**脚本会自动完成**：
- ✅ 测试 SSH 连接
- ✅ 安装 Docker 和 Docker Compose
- ✅ 创建目录结构
- ✅ 生成所有密钥和环境变量
- ✅ 上传项目文件
- ✅ 配置 SSL 证书
- ✅ 构建 Docker 镜像
- ✅ 启动所有服务

**预计时间**：30-40 分钟（镜像构建需要 5-10 分钟）

---

### 方式二：手动部署

**适合**：需要逐步验证每个环节

#### Step 1: 配置域名 DNS

在阿里云 DNS 控制台添加 A 记录：
```
主机记录: www
记录类型: A
记录值: 101.132.152.132
TTL: 10分钟
```

等待 DNS 生效（5-10 分钟）：
```bash
ping www.luolai-sd.xin
```

#### Step 2: 测试 SSH 连接

```bash
ssh -i "/Users/laichangcheng/Downloads/罗莱-圣都.pem" root@101.132.152.132
```

#### Step 3: 在 ECS 上安装 Docker

```bash
# SSH 登录后执行
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

#### Step 4: 创建目录

```bash
mkdir -p /opt/l2c
mkdir -p /opt/l2c/nginx/ssl
mkdir -p /data/l2c-backups
```

#### Step 5: 上传项目文件

在本地执行：
```bash
cd "/Users/laichangcheng/Documents/文稿 - 来长城的MacBook Air/trae/L2C"

# 压缩项目（排除不必要的文件）
tar --exclude='node_modules' --exclude='.git' --exclude='.next' -czf l2c.tar.gz .

# 上传到 ECS
scp -i "/Users/laichangcheng/Downloads/罗莱-圣都.pem" l2c.tar.gz root@101.132.152.132:/opt/l2c/

# SSH 到 ECS 解压
ssh -i "/Users/laichangcheng/Downloads/罗莱-圣都.pem" root@101.132.152.132
cd /opt/l2c
tar -xzf l2c.tar.gz
rm l2c.tar.gz
```

#### Step 6: 生成环境变量

```bash
# 在 ECS 上执行
cd /opt/l2c

# 生成密钥
POSTGRES_PASSWORD=$(openssl rand -base64 24)
JWT_SECRET=$(openssl rand -base64 32)

# 安装 Supabase CLI（用于生成 JWT tokens）
npm install -g supabase

# 生成 JWT tokens
ANON_KEY=$(supabase gen keys jwt --role anon --secret "$JWT_SECRET")
SERVICE_ROLE_KEY=$(supabase gen keys jwt --role service_role --secret "$JWT_SECRET")

# 创建 .env.production 文件
cat > .env.production <<EOF
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
JWT_SECRET=$JWT_SECRET
SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
SMTP_HOST=smtp.exmail.qq.com
SMTP_PORT=465
SMTP_USER=noreply@luolai-sd.xin
SMTP_PASS=
SMTP_ADMIN_EMAIL=admin@luolai-sd.xin
NEXT_PUBLIC_APP_URL=https://www.luolai-sd.xin
TZ=Asia/Shanghai
EOF

# 验证文件
cat .env.production
```

#### Step 7: 配置 SSL 证书

```bash
# 安装 certbot
apt-get update
apt-get install -y certbot

# 申请 SSL 证书
certbot certonly --standalone -d www.luolai-sd.xin

# 复制证书到 nginx 目录
cp /etc/letsencrypt/live/www.luolai-sd.xin/fullchain.pem /opt/l2c/nginx/ssl/
cp /etc/letsencrypt/live/www.luolai-sd.xin/privkey.pem /opt/l2c/nginx/ssl/
chmod 644 /opt/l2c/nginx/ssl/*.pem
```

#### Step 8: 构建和启动服务

```bash
cd /opt/l2c

# 使用本地构建版配置
cp docker-compose.production-local.yml docker-compose.yml

# 构建镜像（首次约 5-10 分钟）
docker-compose build

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

---

## ✅ 验证部署

### 1. 检查服务状态

```bash
cd /opt/l2c
docker-compose ps

# 所有服务应该显示 "Up" 或 "Up (healthy)"
```

### 2. 访问应用

在浏览器访问：
- **主应用**：https://www.luolai-sd.xin
- **Supabase Studio**：http://101.132.152.132:3001

### 3. 健康检查

```bash
curl https://www.luolai-sd.xin/api/health

# 应返回：{"status":"ok"}
```

### 4. 查看日志

```bash
# 所有服务日志
docker-compose logs

# 查看特定服务
docker-compose logs web-app
docker-compose logs supabase-db

# 实时跟踪日志
docker-compose logs -f web-app
```

---

## 🔧 常用命令

```bash
# 进入项目目录
cd /opt/l2c

# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart web-app

# 停止所有服务
docker-compose down

# 重新构建并启动
docker-compose up -d --build

# 查看资源使用情况
docker stats

# 清理未使用的镜像
docker system prune -a
```

---

## 🐛 常见问题

### Q1: SSH 连接失败
```bash
# 检查密钥权限
chmod 600 "/Users/laichangcheng/Downloads/罗莱-圣都.pem"

# 测试连接
ssh -v -i "/Users/laichangcheng/Downloads/罗莱-圣都.pem" root@101.132.152.132
```

### Q2: 域名无法访问
```bash
# 验证 DNS 解析
ping www.luolai-sd.xin
nslookup www.luolai-sd.xin

# 检查防火墙
firewall-cmd --list-all
ufw status
```

### Q3: SSL 证书申请失败
```bash
# 检查 80 端口是否被占用
netstat -tulpn | grep :80

# 停止可能占用 80 端口的服务
docker-compose down

# 重新申请证书
certbot certonly --standalone -d www.luolai-sd.xin --force-renew
```

### Q4: Docker 构建很慢
这是正常的！首次构建需要：
- 下载 Node.js 基础镜像
- 安装 npm 依赖
- 构建 Next.js 应用

**解决方案**：
- 等待完成（5-10 分钟）
- 使用国内 Docker 镜像加速器

### Q5: 服务启动失败
```bash
# 查看详细错误信息
docker-compose logs 服务名称

# 常见原因：
# 1. 环境变量配置错误
# 2. 端口冲突
# 3. 数据库连接失败

# 检查环境变量
docker-compose config

# 检查端口占用
netstat -tulpn | grep LISTEN
```

---

## 📊 部署后检查清单

- [ ] 所有 Docker 容器状态为 "Up"
- [ ] 可以访问 https://www.luolai-sd.xin
- [ ] 健康检查接口返回正常
- [ ] 可以注册和登录用户
- [ ] Supabase Studio 可以访问
- [ ] 数据库备份服务运行正常
- [ ] 日志没有严重错误

---

## 🎯 下一步

部署成功后：

1. **功能测试**
   - 测试用户注册、登录
   - 测试核心业务功能
   - 测试数据库CRUD操作

2. **性能优化**
   - 监控服务器资源使用
   - 根据需要调整配置

3. **安全加固**
   - 配置防火墙规则
   - 定期更新 SSL 证书
   - 设置定时备份

4. **监控配置**
   - 配置 Sentry 错误监控（如需要）
   - 设置日志监控和告警

---

## 📞 需要帮助？

遇到问题请：
1. 查看日志：`docker-compose logs -f`
2. 检查服务状态：`docker-compose ps`
3. 联系我并提供错误日志

**祝部署顺利！** 🚀
