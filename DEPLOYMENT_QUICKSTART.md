# L2C 阿里云ECS部署方案 - 快速开始

## 🎯 10分钟快速部署指南

### 前置条件

- ✅ 阿里云ECS实例（华东2上海，4核8GB）
- ✅ 域名 `www.luolai-sd.xin` 已解析到ECS公网IP
- ✅ GitHub 仓库已配置 Secrets

### Step 1: 准备ECS（5分钟）

```bash
# SSH登录ECS
ssh root@your-ecs-ip

# 一键安装Docker环境
curl -fsSL https://get.docker.com | bash && \
systemctl start docker && \
curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && \
chmod +x /usr/local/bin/docker-compose

# 创建目录
mkdir -p /opt/l2c /data/l2c-backups
```

### Step 2: 上传配置（2分钟）

```bash
# 在本地项目目录执行
cd L2C

# 上传所有配置文件
scp docker-compose.production.yml root@your-ecs-ip:/opt/l2c/
scp .env.production.example root@your-ecs-ip:/opt/l2c/.env.production
scp -r nginx scripts root@your-ecs-ip:/opt/l2c/
```

### Step 3: 配置SSL（2分钟）

```bash
# 在ECS上执行
apt-get install -y certbot
certbot certonly --standalone -d www.luolai-sd.xin
cp /etc/letsencrypt/live/www.luolai-sd.xin/*.pem /opt/l2c/nginx/ssl/
```

### Step 4: 启动服务（1分钟）

```bash
cd /opt/l2c

# 编辑环境变量（填写真实密钥）
vi .env.production

# 启动所有服务
docker-compose -f docker-compose.production.yml up -d

# 查看状态
docker-compose ps
```

### Step 5: 验证部署（30秒）

```bash
# 健康检查
curl https://www.luolai-sd.xin/api/health

# 访问应用
echo "请在浏览器访问: https://www.luolai-sd.xin"
```

## 🔄 自动化部署

配置完成后，每次 Git push 到 main 分支会自动部署！

```bash
git add .
git commit -m "update: 新功能"
git push origin main
# GitHub Actions 会自动构建、推送镜像并部署到ECS
```

## 📦 核心文件清单

```
L2C/
├── docker-compose.production.yml    # Docker编排配置
├── .env.production.example           # 环境变量模板  
├── slideboard-frontend/
│   ├── Dockerfile                    # Next.js镜像构建
│   └── .dockerignore                 # Docker忽略文件
├── nginx/
│   ├── nginx.conf                    # Nginx配置
│   └── ssl/                          # SSL证书目录
├── scripts/
│   ├── backup/
│   │   ├── full-backup.sh           # 完整备份脚本
│   │   └── restore.sh               # 恢复脚本
│   └── deploy/                       # 部署脚本
└── .github/workflows/
    └── deploy-production.yml         # CI/CD配置
```

## 📚 详细文档

- [完整部署方案](docs/04-运维部署/implementation_plan.md)
- [ECS部署手册](docs/04-运维部署/04-ECS部署手册.md)
- [Docker配置说明](slideboard-frontend/DOCKER_README.md)

## ⚡ 关键命令速查

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f web-app

# 重启应用
docker-compose restart web-app

# 完整备份
/opt/l2c/scripts/backup/full-backup.sh

# 恢复数据
/opt/l2c/scripts/backup/restore.sh /data/l2c-backups/20250104_020000.tar.gz
```

## 🆘 常见问题

**Q: 如何修改配置？**
```bash
vi /opt/l2c/.env.production
docker-compose restart
```

**Q: 如何查看备份？**
```bash
ls -lh /data/l2c-backups/
```

**Q: SSL证书如何续期？**
```bash
certbot renew
cp /etc/letsencrypt/live/www.luolai-sd.xin/*.pem /opt/l2c/nginx/ssl/
docker-compose restart nginx
```

## 📞 获取帮助

- 📖 查看详细文档：`docs/04-运维部署/`
- 🐛 提交Issue：GitHub Issues
- 💬 技术支持：tech@luolai-sd.xin
