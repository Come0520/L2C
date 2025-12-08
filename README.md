# L2C 线索管理系统

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 项目简介

L2C (Lead to Customer) 线索管理系统是一个现代化的销售线索管理平台，专注于从线索获取到客户转化的全流程管理。系统采用全栈TypeScript开发，提供高效的线索管理、智能分配、状态跟踪等核心功能。

### 🎯 核心特性

- **📊 线索管理**: 完整的线索生命周期管理
- **🔄 状态跟踪**: 实时的线索状态流转
- **👥 智能分配**: 基于规则的线索自动分配
- **📱 响应式设计**: 完美适配桌面和移动端
- **🔐 权限控制**: 基于角色的访问控制
- **📈 数据分析**: 丰富的报表和统计功能
- **🎮 积分激励**: 创新的销售积分激励体系

### 🚀 快速开始

```bash
# 克隆项目
git clone <repository-url>
cd L2C

# 安装依赖
cd slideboard-frontend && npm install

# 安装Supabase CLI
npm install -g supabase

# 启动Supabase本地开发环境
cd ..
supabase start

# 启动前端开发服务 (Port: 3000)
cd slideboard-frontend && npm run dev
```

访问 http://localhost:3000 开始使用！

> 💡 开发模式下已配置跳过登录，可直接进入系统

## 技术架构

### 前端技术栈
- **框架**: Next.js 15 (App Router) + TypeScript
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **UI组件**: Shadcn UI / Custom Components
- **状态管理**: React Context + Hooks
- **数据请求**: React Query + Supabase SDK
- **表单处理**: React Hook Form + Zod

### BaaS技术栈
- **认证**: Supabase Auth
- **数据库**: Supabase PostgreSQL
- **实时数据**: Supabase Realtime
- **对象存储**: Supabase Storage
- **边缘函数**: Supabase Edge Functions
- **API**: Supabase PostgREST

### 基础设施
- **容器化**: Docker + Docker Compose (仅用于本地开发)
- **代码质量**: ESLint + Prettier
- **版本控制**: Git

## 项目结构

```
L2C/
├── slideboard-frontend/      # 前端应用 (Next.js)
│   ├── src/
│   │   ├── app/             # App Router 页面
│   │   ├── components/      # 通用组件
│   │   ├── contexts/        # React Context
│   │   ├── lib/             # 工具库
│   │   │   └── supabase/    # Supabase客户端配置
│   │   └── types/           # TypeScript类型
│   ├── public/              # 静态资源
│   └── package.json
├── supabase/                # Supabase配置和迁移
│   ├── functions/           # Edge Functions
│   ├── migrations/          # 数据库迁移
│   ├── config.toml          # Supabase配置
│   └── .branches/           # 分支配置
├── docker-compose.yml       # Docker编排文件
└── docs/                    # 项目文档
```

## 快速开始

### 环境要求

- Node.js 18.0+
- Docker & Docker Compose (仅用于本地开发)
- Supabase CLI

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd L2C
   ```

2. **安装Supabase CLI**
   ```bash
   npm install -g supabase
   ```

3. **配置环境变量**
   ```bash
   # 复制环境配置文件
   cp .env.example .env
   cp slideboard-frontend/.env.example slideboard-frontend/.env
   
   # 根据实际情况修改配置 (特别是Supabase连接信息)
   ```

4. **使用Docker启动Supabase本地开发环境**
   ```bash
   # 启动Supabase服务
   supabase start
   
   # 查看Supabase服务状态
   supabase status
   ```

5. **本地开发启动**
  ```bash
  # 安装前端依赖
  cd slideboard-frontend
  npm install
  
  # 启动前端开发服务器
  npm run dev
  ```

### 访问地址

- **前端应用**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323
- **Supabase API**: http://localhost:54321

### 默认账号

- **管理员**: admin@luolai.com / password123
- **销售经理**: manager@luolai.com / password123
- **销售人员**: sales1@luolai.com / password123

## 开发指南

### 代码规范

项目使用ESLint和Prettier进行代码格式化和质量检查：

```bash
# 检查代码规范
npm run lint

# 自动修复代码格式
npm run lint:fix

# 格式化代码
npm run format
```

### 提交信息规范

项目采用[Conventional Commits](https://www.conventionalcommits.org/)规范，提交信息格式如下：

```bash
<type>(<scope>): <subject>

<body>

<footer>
```

#### 支持的提交类型
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `ci`: 持续集成相关
- `build`: 构建系统或外部依赖的变动
- `revert`: 回滚之前的提交

#### 提交示例
```bash
# 新功能
feat(user): add user profile management

# Bug修复
fix(payment): resolve gateway timeout issue

# 文档更新
docs(api): update authentication documentation
```

#### 规范文档
- **提交规范详细说明**: [docs/COMMIT_CONVENTION.md](docs/COMMIT_CONVENTION.md)
- **分支管理策略**: [docs/BRANCH_STRATEGY.md](docs/BRANCH_STRATEGY.md)

详细规范请参考 [Git工作流与代码提交规范](docs/03-开发实施/_规范合集/15-Git工作流代码提交规范.md)

### Supabase操作

```bash
# 启动Supabase服务
supabase start

# 停止Supabase服务
supabase stop

# 重置Supabase服务
supabase db reset

# 创建新的迁移
supabase migration new migration_name

# 运行迁移
supabase migration up

# 回滚迁移
supabase migration down

# 生成TypeScript类型
supabase gen types typescript --local > src/types/supabase.ts

# 查看Supabase日志
supabase logs
```

### 测试

```bash
# 运行所有测试
npm test

# 运行测试并监听文件变化
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage
```

## 部署指南

### 生产环境部署

1. **构建前端应用**
   ```bash
   # 构建前端
   cd slideboard-frontend
   npm run build
   ```

2. **部署前端到Vercel或其他托管平台**
   ```bash
   # 使用Vercel CLI部署
   npm install -g vercel
   vercel deploy
   ```

3. **部署Supabase**
   ```bash
   # 登录Supabase
   supabase login
   
   # 链接到远程Supabase项目
   supabase link --project-ref <project-ref>
   
   # 推送迁移到远程Supabase项目
   supabase db push
   
   # 部署Edge Functions
   supabase functions deploy
   ```

### 环境变量配置

生产环境需要配置以下关键环境变量：

- `NODE_ENV=production`
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase生产环境URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase生产环境Anon Key
- `NEXT_PUBLIC_API_URL`: API URL
- `NEXT_PUBLIC_APP_URL`: 应用URL

## 功能模块

### 核心功能

- **用户管理**: 用户注册、登录、权限管理
- **线索管理**: 线索录入、分配、跟进、转化
- **订单管理**: 订单创建、状态跟踪、支付管理
- **产品管理**: 产品信息、库存管理、价格配置
- **客户管理**: 客户信息、沟通记录、关系维护

### 高级功能

- **数据分析**: 销售报表、业绩统计、趋势分析
- **工作流**: 审批流程、状态流转、通知提醒
- **权限控制**: 角色管理、功能权限、数据权限
- **积分系统**: 销售积分激励、积分商城、规则引擎

## 联系方式

- 项目负责人: 来长城
- 邮箱: bigeyecome@gmail.com
- 项目地址: [GitHub Repository](https://github.com/luolai/l2c)

## 更新日志

### v1.0.0 (2025-11-24)
- 初始版本发布
- 实现核心功能模块
- 完成基础架构搭建
