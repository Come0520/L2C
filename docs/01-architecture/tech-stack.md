# L2C 系统技术栈手册 (Enterprise 2026)

本手册定义了 **L2C (Lead-to-Cash) 系统** 的核心技术选型。基于 2026 年的企业级标准与**中国大陆部署**的稳定性需求，本项目全面拥抱 Next.js 生态与阿里云服务。

---

## 1. 核心选型矩阵

| 维度 | 建议方案 | 企业级选择理由 |
| :--- | :--- | :--- |
| **运行时** | **Node.js 22 (LTS)** | 2026 年主流生产环境版本，完美支持原生 ESM 和高性能异步上下文。 |
| **核心框架** | **Next.js 16.1.x (Stable)** | 采用 **Turbopack** 构建。Standalone 模式部署，极大优化容器镜像体积。 |
| **UI 引擎** | **React 19 (Stable)** | 深度利用 **Server Actions** 处理订单流转，**React Compiler** 实现零手动优化。 |
| **样式引擎** | **Tailwind CSS v4.0** | 全新原生 Oxide 引擎，抛弃 PostCSS，编译速度提升 10 倍，适合 ERP 复杂样式。 |
| **动画引擎** | **Framer Motion** | 生产级动画库，用于处理订单侧边栏抽屉、列表重排等微交互。 |
| **数据层** | **阿里云 RDS PostgreSQL + Drizzle ORM** | **Drizzle** 提供全链路类型安全，RDS 确保国内部署的低延迟与数据合规。 |
| **认证层** | **Auth.js (NextAuth v5)** | 支持手机验证码、微信扫码等国内主流认证方式，替代 Supabase Auth。 |
| **文件存储** | **阿里云 OSS** | 存储窗帘测量照片、完工凭证，支持 CDN 节点就近加速。 |
| **监控系统** | **Sentry v10.x** | 集成 Session Replay，AI 根因分析可直接定位报价计算逻辑的错误。 |
| **包管理器** | **pnpm** | 严格的依赖管理，解决大规模项目下的 node_modules 膨胀问题。 |

---

## 2. 详细配置与架构说明

### A. 数据持久层 (Drizzle ORM)
- **驱动适配**: 使用 `postgres.js` 作为底层的连接池管理。
- **类型流转**: 数据库 Schema 定义即类型，直接推导给 Server Actions 使用，杜绝 `any`。
- **自动化**: 利用 `drizzle-kit` 进行数据库迁移管理（Migration）。

### B. 认证与权限 (Auth.js)
- **策略**: 采用 JWT + Database Session 混合模式。
- **本地化**: 针对国内场景，主推“手机号 + 短信验证码”登录，集成微信开放平台扫码。
- **安全**: 内置 CSRF 保护、Rate Limiting 频率限制。

### C. 资源存储 (OSS)
- **上传策略**: 严禁服务端中转。采用 **STS 临时凭证 + 客户端直传**，节省 ECS Bandwidth。
- **安全性**: Bucket 设置为“私有读写”，通过签名 URL 访问敏感单据图片。

### D. 部署逻辑 (阿里云 ECS)
- **构建输出**: `output: 'standalone'` 模式，镜像体积控制在 100MB 左右。
- **网关**: Nginx 反向代理，开启 HTTP/3 (QUIC) 支持，优化弱网下的移动端访问。

---

## 3. 环境变量标准 (Environment Variables)

```env
# 核心环境
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://l2c.yourdomain.com

# 数据库 (阿里云 RDS)
DATABASE_URL=postgresql://user:password@rds-endpoint.aliyuncs.com:5432/l2c_db

# 阿里云服务凭证
ALIYUN_ACCESS_KEY_ID=LTAI...
ALIYUN_ACCESS_KEY_SECRET=...

# OSS 配置
OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=l2c-assets

# Auth.js
AUTH_SECRET=your_super_secret_key
AUTH_URL=https://l2c.yourdomain.com/api/auth

# 微信登录 (可选)
WECHAT_CLIENT_ID=...
WECHAT_CLIENT_SECRET=...
```

---

## 4. 技术决策记录 (ADR)

### ADR-001: 放弃 Supabase 转向阿里云全家桶

* **背景**: L2C 系统主要服务于国内装企，原 Supabase (海外) 访问延迟超过 300ms 且存在断连风险。
* **决策**: 使用阿里云 RDS + Auth.js + OSS 组合。
* **影响**:
  * 解决了数据合规与网络加速问题。
  * 权限系统需要基于 Auth.js 自行扩展 `checkPermission` 逻辑。
  * 放弃 Supabase Real-time，改用 React 19 的流式渲染 (Streaming) 与 `revalidatePath` 实现准实时感。

---

*最后更新: 2026-01-04 | L2C 项目架构组*