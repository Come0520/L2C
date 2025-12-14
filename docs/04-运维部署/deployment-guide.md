# L2C 系统部署指南

> **本文档整合了所有部署相关内容，提供完整的部署流程和最佳实践。**

---

## 📋 目录

1. [部署架构方案](#部署架构方案)
2. [环境准备](#环境准备)
3. [快速部署（10分钟）](#快速部署10分钟)
4. [完整全新部署](#完整全新部署)
5. [版本更新部署](#版本更新部署)
6. [故障排查](#故障排查)
7. [维护与监控](#维护与监控)

---

## 部署架构方案

### 推荐架构：全栈自托管（阿里云ECS）

**核心结论**：基于国内网络环境，强烈推荐使用阿里云ECS自托管方案。

#### 为什么选择自托管？

1. **网络稳定性** 🇨🇳
   - 前后端都在国内阿里云，用户访问快速稳定
   - 避免 Supabase Cloud (境外) 的连接不稳定问题
   - 数据不出境，符合《数据安全法》

2. **数据安全性** 🔐
   - 数据完全存储在自有的阿里云ECS服务器
   - 数据盘：高效云盘/SSD (`/var/lib/postgresql/data`)
   - 100% 物理所有权和管理权

3. **备份策略** 💾
   - **3份备份** (3-2-1 原则)：
     1. ECS 本地快照（每周自动）
     2. 本地文件备份（每日 SQL 备份）
     3. 异地OSS备份（自动上传阿里云OSS）

#### 环境要求

- **服务器**：阿里云ECS（华东2-上海）
- **配置**：4核8GB 起步，推荐8核16GB
- **域名**：已备案域名并完成DNS解析
- **网络**：BGP多线接入，确保国内访问速度

---

## 环境准备

### 1. 阿里云ECS配置

#### 基本信息
```yaml
实例规格: ecs.c7.xlarge (4核8GB) 或更高
操作系统: Ubuntu 22.04 LTS
地域: 华东2（上海）
网络: 专有网络VPC + 弹性公网IP
安全组: 开放 22, 80, 443, 3000 端口
```

#### 域名配置
```yaml
域名: www.luolai-sd.xin
DNS: 阿里云DNS
A记录: 指向 ECS 公网IP
状态: 已备案并解析生效
```

### 2. 软件环境准备

```bash
# SSH登录ECS
ssh root@your-ecs-ip

# 一键安装Docker环境
curl -fsSL https://get.docker.com | bash && \
systemctl start docker && \
systemctl enable docker

# 安装Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && \
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 3. 创建项目目录

```bash
# 创建必要目录
mkdir -p /opt/l2c
mkdir -p /data/l2c-backups
```

---

## 快速部署（10分钟）

> **适用场景**：已配置好环境，需要快速部署或重新部署

### Step 1: 上传配置（2分钟）

```bash
# 在本地项目目录执行
cd L2C

# 上传配置文件到服务器
scp docker-compose.production.yml root@your-ecs-ip:/opt/l2c/
scp .env.production.example root@your-ecs-ip:/opt/l2c/.env.production
scp -r nginx scripts root@your-ecs-ip:/opt/l2c/
```

### Step 2: 配置SSL证书（2分钟）

```bash
# 在ECS上执行
apt-get install -y certbot

# 申请SSL证书（确保80端口未被占用）
certbot certonly --standalone -d www.luolai-sd.xin

# 复制证书到nginx目录
cp /etc/letsencrypt/live/www.luolai-sd.xin/*.pem /opt/l2c/nginx/ssl/
```

### Step 3: 配置环境变量（3分钟）

```bash
cd /opt/l2c

# 编辑环境变量文件
vi .env.production
```

**必须配置的环境变量：**
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://www.luolai-sd.xin
NEXT_PUBLIC_SUPABASE_URL=https://rdpiajialjnmngnaokix.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_url
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://www.luolai-sd.xin
```

### Step 4: 启动服务（2分钟）

```bash
cd /opt/l2c

# 拉取镜像并启动所有服务
docker-compose -f docker-compose.production.yml up -d

# 查看服务状态
docker-compose ps
```

### Step 5: 验证部署（1分钟）

```bash
# 等待服务启动
sleep 30

# 健康检查
curl https://www.luolai-sd.xin/api/health

# 浏览器访问
echo "请访问: https://www.luolai-sd.xin"
```

✅ **部署完成！** 如果看到登录页面，说明部署成功。

---

## 完整全新部署

> **适用场景**：首次部署、切换服务器、完全重新开始

### 方案1：使用脚本（推荐）⭐

```bash
# 1. 上传 fresh-deploy.sh 到服务器
scp fresh-deploy.sh root@your-ecs-ip:/root/

# 2. 赋予执行权限
ssh root@your-ecs-ip
chmod +x /root/fresh-deploy.sh

# 3. 执行脚本（15-25分钟）
/root/fresh-deploy.sh
```

### 方案2：手动分步执行

#### 第1步：停止旧应用（如有）

```bash
# 停止Docker服务
cd /opt/l2c
docker-compose down

# 或停止PM2应用
pm2 stop l2c 2>/dev/null
pm2 delete l2c 2>/dev/null
```

#### 第2步：清理旧代码

```bash
# 完全删除旧代码
rm -rf /opt/l2c/L2C
```

#### 第3步：克隆代码

```bash
mkdir -p /opt/l2c
cd /opt/l2c
git clone https://github.com/Come0520/L2C.git
cd /opt/l2c/L2C/slideboard-frontend
```

#### 第4步：创建环境变量

```bash
cat > .env.production << 'EOF'
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://www.luolai-sd.xin
NEXT_PUBLIC_SUPABASE_URL=https://rdpiajialjnmngnaokix.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key
DATABASE_URL=your_database_url
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://www.luolai-sd.xin
NEXT_TELEMETRY_DISABLED=1
EOF
```

#### 第5步：安装依赖

```bash
npm install --ignore-scripts
```

#### 第6步：构建应用

```bash
export NODE_OPTIONS="--max-old-space-size=6144"
NODE_ENV=production npm run build
```

⏳ **等待10-20分钟完成构建**

#### 第7步：验证构建

```bash
ls -la .next/BUILD_ID
cat .next/BUILD_ID
```

✅ **如果文件存在且有内容，构建成功！**

#### 第8步：启动应用

使用Docker方式（推荐）：
```bash
cd /opt/l2c
docker-compose -f docker-compose.production.yml up -d
```

或使用PM2方式：
```bash
pm2 start npm --name "l2c" \
  --cwd /opt/l2c/L2C/slideboard-frontend \
  --node-args="--max-old-space-size=4096" \
  -- start

pm2 save
pm2 startup systemd -u root --hp /root
```

#### 第9步：验证部署

```bash
sleep 20

# 检查Docker服务
docker-compose ps

# 或检查PM2状态
pm2 list

# 测试访问
curl -I http://localhost:3000
```

---

## 版本更新部署

### 使用脚本更新（推荐）

```bash
# 使用 deploy-v1.1.0.sh 或其他版本脚本
./deploy-v1.1.0.sh
```

### 手动更新流程

```bash
cd /opt/l2c/L2C

# 1. 拉取最新代码
git pull origin main

# 2. 切换到前端目录
cd slideboard-frontend

# 3. 安装新依赖
npm install

# 4. 重新构建
export NODE_OPTIONS="--max-old-space-size=6144"
NODE_ENV=production npm run build

# 5. 重启服务
cd /opt/l2c
docker-compose restart web-app

# 或使用PM2
pm2 restart l2c
```

---

## 故障排查

### 问题1：BUILD_ID 文件不存在

**症状**：构建后 `.next/BUILD_ID` 文件不存在

**原因**：构建失败或未完成

**解决方案**：
```bash
cd /opt/l2c/L2C/slideboard-frontend
rm -rf .next
export NODE_OPTIONS="--max-old-space-size=6144"
NODE_ENV=production npm run build 2>&1 | tee build-error.log
# 查看 build-error.log 找出具体错误
```

### 问题2：应用持续重启

**症状**：PM2/Docker 显示应用不断重启

**原因**：运行时错误

**解决方案**：
```bash
# Docker方式查看日志
docker-compose logs -f web-app

# PM2方式查看日志
pm2 logs l2c --err --lines 100
```

### 问题3：内存不足

**症状**：构建过程中killed或中断

**解决方案**：
```bash
# 检查内存
free -h

# 如果可用内存 < 4GB：
# 1. 关闭其他服务
# 2. 升级服务器配置
# 3. 添加交换空间
dd if=/dev/zero of=/swapfile bs=1G count=4
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

### 问题4：端口被占用

**症状**：无法监听3000端口

**解决方案**：
```bash
# 查看占用端口的进程
lsof -i:3000

# 杀死进程
kill -9 <PID>
```

### 问题5：Docker镜像拉取失败

**症状**：拉取 `public.ecr.aws` 或 `docker.io` 镜像超时

**解决方案**：使用阿里云镜像加速
```bash
#修改 /etc/docker/daemon.json
{
  "registry-mirrors": [
    "https://your-id.mirror.aliyuncs.com"
  ]
}

systemctl restart docker
```

### 问题6：SSL证书续期

**操作**：每3个月续期一次
```bash
certbot renew
cp /etc/letsencrypt/live/www.luolai-sd.xin/*.pem /opt/l2c/nginx/ssl/
docker-compose restart nginx
```

---

## 维护与监控

### 日常维护命令

```bash
# 查看服务状态
docker-compose ps

# 查看实时日志
docker-compose logs -f web-app

# 重启特定服务
docker-compose restart web-app

# 重启所有服务
docker-compose restart

# 停止所有服务
docker-compose down

# 查看资源使用
docker stats
```

### PM2维护命令（如使用PM2）

```bash
# 查看应用状态
pm2 list

# 查看实时日志
pm2 logs l2c

# 查看错误日志
pm2 logs l2c --err

# 重启应用
pm2 restart l2c

# 监控资源使用
pm2 monit
```

### 定期备份

```bash
# 执行完整备份
/opt/l2c/scripts/backup/full-backup.sh

# 查看备份文件
ls -lh /data/l2c-backups/

# 恢复数据（如需要）
/opt/l2c/scripts/backup/restore.sh /data/l2c-backups/backup_file.tar.gz
```

### 监控检查清单

- [ ] 每天检查应用状态 (`docker-compose ps` 或 `pm2 list`)
- [ ] 每周检查磁盘空间 (`df -h`)
- [ ] 每周检查备份是否正常 (`ls /data/l2c-backups/`)
- [ ] 每月检查SSL证书有效期 (`certbot certificates`)
- [ ] 每月查看系统资源使用 (`free -h`, `docker stats`)

---

## 核心文件清单

```
L2C/
├── docker-compose.production.yml    # Docker编排配置
├── .env.production.example           # 环境变量模板  
├── slideboard-frontend/
│   ├── Dockerfile                    # Next.js镜像构建
│   └── .dockerignore                 # Docker忽略文件
├── nginx/
│  ├── nginx.conf                    # Nginx配置
│   └── ssl/                          # SSL证书目录
├── scripts/
│   ├── backup/
│   │   ├── full-backup.sh           # 完整备份脚本
│   │   └── restore.sh               # 恢复脚本
│   └── deploy/                       # 部署脚本
└── .github/workflows/
    └── deploy-production.yml         # CI/CD配置
```

---

## 下一步建议

部署成功后建议：

1. **配置自动备份** - 设置cron定时任务执行备份脚本
2. **配置OSS异地备份** - 将备份自动上传到阿里云OSS
3. **配置监控告警** - 使用阿里云云监控或其他监控工具
4. **性能优化** - 根据实际使用情况调整资源配置
5. **安全加固** - 配置防火墙、修改SSH端口、禁用root密码登录

---

## 获取帮助

- 📖 查看详细文档：`docs/04-运维部署/`
- 🔧 故障排查：`docs/04-运维部署/troubleshooting/`
- ☁️ 阿里云配置：`docs/04-运维部署/aliyun/`
- 📝 历史部署文档：`docs/04-运维部署/archive/`

---

**文档维护**: 2025-12-14  
**服务器IP**: 101.132.152.132  
**应用目录**: /opt/l2c
