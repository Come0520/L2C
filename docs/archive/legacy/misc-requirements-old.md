# 零星需求文档

> **创建时间**: 2026-01-13
> **最后更新**: 2026-01-13

---

## 需求一：公司官网模块

### 1. 需求背景

当前 L2C 系统直接跳转到后台工作台，缺少对外展示的公司官网。需要在项目中新增官网模块，作为系统的门户入口，向潜在客户（To B）展示产品价值，并提供登录入口进入后台系统。

### 2. 目标用户

- **主要用户**: 窗帘店、软装公司、家居建材商等 B 端客户
- **次要用户**: 已注册租户的员工（通过官网登录进入系统）

### 3. 功能需求

#### 3.1 官网首页

首页采用单页滚动设计，包含以下区块：

| 区块 | 内容 | 展示形式 |
|:---|:---|:---|
| **导航栏** | Logo、菜单、登录按钮 | 固定顶部，滚动时背景变化 |
| **Hero 轮播区** | 6-7张精选图片 + 核心话语 | 全屏轮播，自动播放 |
| **我们是做什么的** | L2C 系统介绍 | 图文并茂 |
| **核心优势** | 解决的难点、满足的需求 | 图标卡片 + 滚动动画 |
| **目标客户** | 我们的客户是谁 | 客户画像展示 |
| **SaaS 使用指南** | 如何使用系统 | B站视频嵌入 |
| **推荐商品** | 好看的窗帘展示 | 轮播卡片，支持一键加入商品库 |
| **CTA** | 立即体验/联系我们 | 按钮 + 联系表单 |
| **页脚** | 公司信息、联系方式 | 标准页脚 |

#### 3.2 视频培训中心

- 嵌入 B站视频（使用 iframe）
- 视频分类管理
- 支持后台配置视频 BV 号

#### 3.3 推荐商品展示

- 展示平台推荐的优质窗帘商品
- **一键加入商品库功能**：
  - 未登录用户：点击后跳转登录页
  - 已登录租户：一键复制商品到自己的商品库

#### 3.4 管理后台

在现有后台系统中新增官网内容管理模块：

| 管理项 | 功能 |
|:---|:---|
| 轮播图管理 | 增删改查，排序，启用/禁用 |
| 核心话语管理 | 编辑展示的 Slogan |
| 视频管理 | 配置 B站视频 BV 号 |
| 推荐商品管理 | 选择商品加入推荐列表 |

### 4. 页面结构

```
官网路由结构:
/                     # 官网首页
/training             # 视频培训中心
/about                # 关于我们
/contact              # 联系我们
/login                # 登录页 (已有)
/workbench            # 后台工作台 (已有，需登录)

管理后台路由:
/settings/website     # 官网内容管理
  ├── /banners        # 轮播图管理
  ├── /slogans        # 话语管理
  ├── /videos         # 视频管理
  └── /featured       # 推荐商品管理
```

### 5. 数据库设计

#### 5.1 轮播图表 (website_banners)

```sql
CREATE TABLE website_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,           -- 标题
  subtitle VARCHAR(200),                  -- 副标题
  image_url VARCHAR(500) NOT NULL,        -- 图片地址
  link_url VARCHAR(500),                  -- 点击跳转链接
  sort_order INTEGER DEFAULT 0,           -- 排序
  is_active BOOLEAN DEFAULT true,         -- 是否启用
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 5.2 核心话语表 (website_slogans)

```sql
CREATE TABLE website_slogans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,                  -- 话语内容
  description TEXT,                       -- 描述说明
  icon VARCHAR(50),                       -- 图标名称
  sort_order INTEGER DEFAULT 0,           -- 排序
  is_active BOOLEAN DEFAULT true,         -- 是否启用
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 5.3 培训视频表 (website_videos)

```sql
CREATE TABLE website_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,            -- 视频标题
  description TEXT,                       -- 视频描述
  bilibili_bvid VARCHAR(20) NOT NULL,     -- B站视频 BV 号
  category VARCHAR(50),                   -- 分类
  thumbnail_url VARCHAR(500),             -- 缩略图
  duration INTEGER,                       -- 时长(秒)
  sort_order INTEGER DEFAULT 0,           -- 排序
  is_active BOOLEAN DEFAULT true,         -- 是否启用
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 5.4 推荐商品表 (website_featured_products)

```sql
CREATE TABLE website_featured_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id), -- 关联商品
  description TEXT,                       -- 推荐理由
  sort_order INTEGER DEFAULT 0,           -- 排序
  is_active BOOLEAN DEFAULT true,         -- 是否启用
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 6. 核心交互流程

#### 6.1 用户访问流程

```
用户访问 / (官网首页)
    ↓
浏览产品介绍、视频培训、推荐商品
    ↓
点击"登录"按钮
    ↓
跳转 /login 登录页
    ↓
登录成功
    ↓
自动跳转 /workbench (后台工作台)
```

#### 6.2 一键加入商品库流程

```
用户浏览推荐商品
    ↓
点击"加入我的商品库"
    ↓
检查登录状态
    ├─ 未登录 → 弹出登录提示，跳转登录页
    └─ 已登录 → 执行复制操作
                    ↓
              复制商品信息到租户的 products 表
                    ↓
              提示"添加成功"
```

### 7. 技术方案

#### 7.1 前端技术

- **框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS
- **轮播**: Embla Carousel (项目已有)
- **动画**: Framer Motion
- **视频**: B站 iframe 嵌入

#### 7.2 后端技术

- **数据库**: PostgreSQL + Drizzle ORM
- **API**: Server Actions
- **认证**: 复用现有认证系统

#### 7.3 目录结构

```
src/app/
├── (website)/                    # 官网路由组
│   ├── layout.tsx                # 官网布局
│   ├── page.tsx                  # 首页
│   ├── training/page.tsx         # 视频培训
│   ├── about/page.tsx            # 关于我们
│   └── contact/page.tsx          # 联系我们
├── (dashboard)/
│   └── settings/
│       └── website/              # 官网管理后台
│           ├── page.tsx
│           ├── banners/page.tsx
│           ├── videos/page.tsx
│           └── featured/page.tsx

src/features/website/             # 官网功能模块
├── actions.ts                    # Server Actions
├── components/
│   ├── hero-carousel.tsx         # Hero 轮播
│   ├── bilibili-player.tsx       # B站播放器
│   ├── featured-products.tsx     # 推荐商品
│   └── website-navbar.tsx        # 官网导航
└── schemas.ts                    # 数据验证
```

### 8. 工作量估算

| 任务 | 预计时间 | 优先级 |
|:---|:---|:---|
| 数据库表设计与迁移 | 0.5 天 | P0 |
| 官网布局和导航组件 | 0.5 天 | P0 |
| 首页开发 (Hero轮播 + 各区块) | 1.5 天 | P0 |
| B站视频嵌入组件 | 0.5 天 | P1 |
| 推荐商品展示 + 一键加入功能 | 1 天 | P1 |
| 管理后台 (内容管理) | 1.5 天 | P1 |
| **总计** | **约 5.5 天** | |

### 9. 验收标准

- [ ] 官网首页可正常访问，各区块展示正确
- [ ] 轮播图自动播放，支持手动切换
- [ ] B站视频可正常播放
- [ ] 推荐商品展示正确，一键加入功能可用
- [ ] 管理后台可正常管理所有内容
- [ ] 登录按钮可正常跳转，登录后进入工作台
- [ ] 响应式适配（桌面端 + 移动端）

### 10. 后续扩展

- [ ] SEO 优化（metadata、sitemap）
- [ ] 新闻/公告模块
- [ ] 在线客服集成
- [ ] 数据统计（访问量、转化率）

---

## 需求二：（待补充）
我需要有角色管理，有预设的角色也有自定义角色
要有流程配置能力，暂时不是全域的流程设置，而是预设一些流程，租户可以在系统设置中通过点选的方式或者开关的方式进行选择
需要有审批流程，也是预设的，租户可以在系统设置中通过点选的方式或者开关的方式进行选择
需要有具体参数配置选择的功能，有的需要租户级别的选择，有的需要用户级别的选择




---

## 变更记录

| 日期 | 变更内容 | 操作人 |
|:---|:---|:---|
| 2026-01-13 | 创建文档，新增官网模块需求 | - |
