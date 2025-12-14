# 生产环境配置检查清单

> **⚠️ 上线前必须完成**：所有占位符必须替换为真实值

---

## 📋 前端环境变量（slideboard-frontend/.env.production）

### 当前状态

```bash
# ❌ 当前使用占位符，需要替换
NEXT_PUBLIC_SUPABASE_URL=https://rdpiajialjnmngnaokix.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_0NzVI9zoIaiXxjyQ_4s08w_A4IyK8fL
NEXT_PUBLIC_API_URL=https://www.luolai-sd.xin/api
NEXT_PUBLIC_APP_NAME=Slideboard
NEXT_PUBLIC_APP_URL=https://www.luolai-sd.xin
```

### ✅ 需要配置的正确值

```bash
# Supabase 配置（从 Supabase 项目设置获取）
NEXT_PUBLIC_SUPABASE_URL=https://[你的项目ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[从 Supabase Dashboard > Settings > API 复制]

# API 配置
NEXT_PUBLIC_API_URL=https://www.luolai-sd.xin/api

# 应用配置
NEXT_PUBLIC_APP_NAME=Slideboard
NEXT_PUBLIC_APP_URL=https://www.luolai-sd.xin
```

---

## 📋 Docker 生产环境配置（/opt/l2c/.env.production）

### 必需配置项

根据 `.env.production.example` 模板，需要配置：

#### 1. 数据库配置 🔴 必填

```bash
POSTGRES_PASSWORD=I@postgresql2025
```

**生成命令**：
```bash
openssl rand -base64 24
```

#### 2. JWT 配置 🔴 必填

```bash
JWT_SECRET=你的JWT密钥至少32位
```

**生成命令**：
```bash
openssl rand -base64 32
```

#### 3. Supabase API 密钥 🔴 必填

```bash
SUPABASE_ANON_KEY=sb_publishable_0NzVI9zoIaiXxjyQ_4s08w_A4IyK8fL
SUPABASE_SERVICE_ROLE_KEY=sb_secret_5k6RlR3PqftG29R-yakSGg_z1w-JGHs
```

**获取方式**：
1. 登录 Supabase Dashboard
2. 进入 Settings > API
3. 复制 `anon` `public` key 和 `service_role` `secret` key

#### 4. SMTP 邮件配置 🟡 推荐

```bash
SMTP_HOST=smtp.exmail.qq.com
SMTP_PORT=465
SMTP_USER=noreply@luolai-sd.xin
SMTP_PASS=你的SMTP密码
SMTP_ADMIN_EMAIL=admin@luolai-sd.xin
```

#### 5. 阿里云 OSS 配置 🟡 推荐

```bash
ALIYUN_OSS_ENDPOINT=oss-cn-shanghai.aliyuncs.com
ALIYUN_OSS_BUCKET=l2c-backups
ALIYUN_ACCESS_KEY_ID=你的AccessKeyID
ALIYUN_ACCESS_KEY_SECRET=你的AccessKeySecret
```

#### 6. 应用配置 🔴 必填

```bash
NEXT_PUBLIC_APP_URL=https://www.luolai-sd.xin
TZ=Asia/Shanghai
```

---

## 🔐 Cookie 安全配置检查

### 检查项

- [ ] 生产环境强制 HTTPS（`Secure` 属性）
- [ ] 所有认证 Cookie 设置 `HttpOnly: true`
- [ ] 所有认证 Cookie 设置 `SameSite: 'lax'` 或 `'strict'`

### 验证方法

部署后在浏览器 DevTools > Application > Cookies 检查：
- `sb-access-token` 应有 `HttpOnly` 和 `Secure` 标记
- `sb-refresh-token` 应有 `HttpOnly` 和 `Secure` 标记

---

## ✅ 验证步骤

### Step 1: 本地验证

```bash
# 在 slideboard-frontend 目录
cd /Users/laichangcheng/Documents/文稿\ -\ 来长城的MacBook\ Air/trae/L2C/slideboard-frontend

# 检查 .env.production 是否包含真实值
cat .env.production | grep -v "^#" | grep "your"
# 如果有输出，说明还有占位符未替换

# 验证环境变量加载
npm run build
# 构建成功说明环境变量格式正确
```

### Step 2: ECS 服务器验证

```bash
# SSH 登录服务器
ssh root@你的ECS公网IP

# 检查生产环境配置
cd /opt/l2c
cat .env.production | grep -v "^#" | grep "your"
# 如果有输出，说明还有占位符未替换

# 验证 Docker 服务
docker-compose -f docker-compose.production.yml config
# 检查配置是否正确加载
```

### Step 3: 部署后验证

```bash
# 健康检查
curl https://www.luolai-sd.xin/api/health
# 应返回 200 状态码

# 检查服务日志
docker-compose -f docker-compose.production.yml logs -f web-app
# 不应有环境变量相关的错误
```

---

## 🚨 安全注意事项

### ⚠️ 绝对禁止

- ❌ **绝不提交** `.env.production` 到 Git
- ❌ **绝不在客户端** 暴露 `SUPABASE_SERVICE_ROLE_KEY`
- ❌ **绝不在日志** 中打印密钥

### ✅ 最佳实践

- ✅ 使用强密码（至少 16 位，包含大小写字母、数字和特殊字符）
- ✅ 定期轮换密钥（建议 3-6 个月）
- ✅ 限制 Supabase API Key 的权限范围
- ✅ 在 `.gitignore` 中添加 `.env.production`

---

## 📝 配置完成检查表

### 前端配置

- [ ] `NEXT_PUBLIC_SUPABASE_URL` 已配置真实值
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 已配置真实值
- [ ] `NEXT_PUBLIC_API_URL` 已配置为 `https://www.luolai-sd.xin/api`
- [ ] `NEXT_PUBLIC_APP_URL` 已配置为 `https://www.luolai-sd.xin`
- [ ] 本地构建成功（`npm run build`）

### 服务器配置

- [ ] `POSTGRES_PASSWORD` 已生成并配置
- [ ] `JWT_SECRET` 已生成并配置
- [ ] `SUPABASE_ANON_KEY` 已从 Dashboard 复制
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 已从 Dashboard 复制
- [ ] `SMTP_HOST` 等邮件配置已填写（如需要）
- [ ] `ALIYUN_OSS_*` 配置已填写（如需要）
- [ ] `NEXT_PUBLIC_APP_URL` 已配置

### 安全验证

- [ ] `.env.production` 已添加到 `.gitignore`
- [ ] 生产环境强制 HTTPS
- [ ] Cookie 安全属性已验证
- [ ] 健康检查通过

---

## 🆘 故障排查

### 问题：Supabase 连接失败

**可能原因**：
- Supabase URL 或 Anon Key 配置错误
- 网络无法访问 Supabase

**解决方法**：
```bash
# 测试 Supabase 连接
curl -H "apikey: 你的ANON_KEY" https://你的项目ID.supabase.co/rest/v1/
```

### 问题：环境变量未生效

**可能原因**：
- 服务未重启
- 环境变量格式错误

**解决方法**：
```bash
# 重启 Docker 服务
docker-compose restart web-app

# 检查容器内的环境变量
docker-compose exec web-app env | grep NEXT_PUBLIC
```

---

**完成时间目标**：**0.2 天**（主要是获取密钥和配置）

**责任人**：运维 + 开发负责人
