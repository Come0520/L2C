# 环境变量配置指南

## 快速开始

### 1. 启动本地数据库

本项目强制依赖 Docker 环境运行 PostgreSQL 数据库。

```bash
# 启动 Docker 容器
docker compose up -d

# 验证容器状态
docker ps
```

### 2. 创建环境变量文件

```bash
# 复制模板
cp .env.local.template .env.local
```

### 3. 配置 .env.local

```env
# 数据库连接 (Docker Postgres)
DATABASE_URL=postgresql://l2c_user:l2c_dev_password@localhost:5433/l2c_dev

# Auth.js
AUTH_SECRET=your_random_secret_at_least_32_characters
AUTH_URL=http://localhost:3000
```

---

## 生产环境配置 (阿里云)

部署到阿里云 ECS 时使用以下配置：

### 数据库 (阿里云 RDS PostgreSQL)

| 变量 | 说明 | 获取方式 |
|:---|:---|:---|
| `DATABASE_URL` | 数据库连接字符串 | 阿里云 RDS 控制台 → 连接地址 |

**格式**: `postgresql://用户名:密码@地址:5432/数据库名`

### 阿里云 OSS

| 变量 | 说明 | 获取方式 |
|:---|:---|:---|
| `OSS_REGION` | OSS 区域 | 如 `oss-cn-hangzhou` |
| `OSS_BUCKET` | Bucket 名称 | 阿里云 OSS 控制台 |
| `OSS_ACCESS_KEY_ID` | AccessKey ID | 阿里云 RAM 控制台 |
| `OSS_ACCESS_KEY_SECRET` | AccessKey Secret | 阿里云 RAM 控制台 |

### 阿里云 SMS

| 变量 | 说明 | 获取方式 |
|:---|:---|:---|
| `SMS_ACCESS_KEY_ID` | AccessKey ID | 阿里云 RAM 控制台 |
| `SMS_ACCESS_KEY_SECRET` | AccessKey Secret | 阿里云 RAM 控制台 |
| `SMS_SIGN_NAME` | 短信签名 | 阿里云短信控制台 |

### Auth.js

| 变量 | 说明 |
|:---|:---|
| `AUTH_SECRET` | 随机密钥 (可用 `openssl rand -base64 32` 生成) |
| `AUTH_URL` | 应用 URL |

### 微信登录 (可选)

| 变量 | 说明 |
|:---|:---|
| `WECHAT_APP_ID` | 微信开放平台 AppID |
| `WECHAT_APP_SECRET` | 微信开放平台 AppSecret |

---

## 完整生产配置示例

```env
# .env.production

# 数据库 (阿里云 RDS PostgreSQL)
DATABASE_URL=postgresql://l2c_user:your_password@rm-xxx.pg.rds.aliyuncs.com:5432/l2c_db

# 阿里云 OSS
OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=l2c-uploads
OSS_ACCESS_KEY_ID=LTAIxxxxxx
OSS_ACCESS_KEY_SECRET=xxxxxxxx

# 阿里云 SMS
SMS_ACCESS_KEY_ID=LTAIxxxxxx
SMS_ACCESS_KEY_SECRET=xxxxxxxx
SMS_SIGN_NAME=L2C系统

# Auth.js
AUTH_SECRET=your_random_secret_at_least_32_characters
AUTH_URL=https://l2c.your-domain.com

# 微信登录 (可选)
WECHAT_APP_ID=wxxxxxxxc
WECHAT_APP_SECRET=xxxxxxxx

# 应用配置
NEXT_PUBLIC_ENABLE_OFFLINE=false
```
