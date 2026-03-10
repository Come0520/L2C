# 小程序动态首页落地页设计方案

> 日期：2026-03-02  
> 状态：待审阅

## 1. 背景与目标

L2C 小程序当前首页（`pages/landing/index`）仅展示 L2C 平台推广内容。本方案要实现**「两张脸」动态首页**：

| 场景                            | 展示内容           | 目的                           |
| ------------------------------- | ------------------ | ------------------------------ |
| 自然流量（无参数）              | L2C 官方推广页     | 吸引行业内人员注册成为租户     |
| 被分享/扫码打开（有 `tc` 参数） | 租户品牌专属落地页 | 商家对外获客工具，L2C 完全隐形 |

---

## 2. 核心架构

```
用户打开小程序
      ↓
  pages/landing/index 解析启动参数
      ↓
  有 tenantCode (tc) 参数？
  /              \
是                 否
↓                  ↓
调 API 获取租户品牌信息    渲染 L2C 官方推广页
↓                  ↓
渲染租户专属落地页     「立即登录」/「申请入驻」
（品牌 Logo、名称、      展示功能亮点
  地址、电话、标语）
↓
「预约上门量窗」+「联系销售」
```

### 2.1 参数传递机制（已确认微信官方支持）

| 入口方式         | 机制                                      | 参数格式                       | 限制              |
| ---------------- | ----------------------------------------- | ------------------------------ | ----------------- |
| 微信聊天卡片分享 | `onShareAppMessage` 的 `path` 携带 query  | `/pages/landing/index?tc=CODE` | 基本无限制        |
| 线下小程序码     | `wxacode.getUnlimited` 的 `scene`         | `tc=CODE`                      | ≤ 32 字符（够用） |
| 页面内获取       | `Taro.getCurrentInstance().router.params` | 标准 Taro 方式                 | —                 |

---

## 3. 两张脸的内容设计

### 3.1 L2C 官方落地页（无参数时）

- **Hero 区域**：L2C Logo + 「窗帘全流程管理大师」 + 说明文字
- **功能亮点**：线索管理、快速报价、量尺调度、云展厅（现有内容保留）
- **CTA 按钮**：「立即登录」「申请入驻」（现有逻辑保留）

### 3.2 租户专属落地页（有 `tc` 参数时）

> **设计原则**：固定模板 + 内容填充。布局和样式由系统统一控制，租户只需在 Web 后台「系统设置 → 公司信息」中填写内容素材，系统自动套入模板渲染。

**固定模板布局（从上到下）**：

```
┌─────────────────────────────┐
│  [封面背景图]                │ ← landingCoverUrl（可选，无则渐变底色）
│                             │
│      [ 公司 Logo ]          │ ← logoUrl
│    「阳光窗帘装饰」           │ ← name
│   「专业窗帘定制专家」        │ ← slogan
│                             │
├─────────────────────────────┤
│  📍 杭州市西湖区XX路XX号     │ ← region + detailAddress
│  📞 138-0013-8000           │ ← applicantPhone
├─────────────────────────────┤
│                             │
│  [📐 预约上门量窗]  主按钮    │ → 跳转预约表单页（带 tenantCode）
│  [📞 立即拨打]    次按钮      │ → wx.makePhoneCall()
│  [💬 微信联系销售] 次按钮     │ → button open-type="contact"
│                             │
└─────────────────────────────┘
  L2C 品牌标识：完全不显示
```

**租户在系统设置中填写的字段**：

| 字段       | 是否必填 | 说明                                 |
| ---------- | -------- | ------------------------------------ |
| 公司 Logo  | ✅ 必填  | 在模板顶部居中展示                   |
| 公司名称   | ✅ 必填  | 已有字段，直接复用                   |
| 品牌标语   | 选填     | 如「专业窗帘定制专家」，不填则不展示 |
| 门店地址   | 选填     | 不填则地址行隐藏                     |
| 联系电话   | ✅ 必填  | 用于「立即拨打」按钮                 |
| 客服微信号 | 选填     | 不填则隐藏微信联系按钮               |
| 封面背景图 | 选填     | 不上传则使用系统默认渐变底色         |

---

## 4. 数据层变更

### 4.1 数据库：`tenants` 表新增字段

现有可复用字段：`name`、`logoUrl`、`region`、`applicantPhone`

需要新增的字段：

| 字段名              | 类型           | 说明                                     |
| ------------------- | -------------- | ---------------------------------------- |
| `slogan`            | `varchar(200)` | 品牌标语，如「专业窗帘定制专家」         |
| `detail_address`    | `text`         | 门店详细地址（区别于 region 的省市级别） |
| `contact_wechat`    | `varchar(100)` | 客服微信号（用于引导添加微信）           |
| `landing_cover_url` | `text`         | 落地页封面图/背景图 URL                  |

### 4.2 后端新增 API

#### `GET /api/miniprogram/tenant/public-profile?code=XX`

- **无需鉴权**（公开接口，任何人打开小程序都能调用）
- 入参：`code` = 租户的 `tenants.code`
- 返回：

```ts
interface TenantPublicProfile {
  name: string; // 公司名称
  logoUrl: string | null; // 品牌 Logo
  slogan: string | null; // 标语
  region: string | null; // 地区
  detailAddress: string | null; // 详细地址
  phone: string | null; // 联系电话
  contactWechat: string | null; // 客服微信号
  landingCoverUrl: string | null; // 封面图
}
```

- **安全要求**：仅返回以上公开字段，绝不暴露 tenantId、内部配置等敏感信息

### 4.3 后台管理端（Web）

在「系统设置 → 公司信息」页面新增以下配置项（已有 `logoUrl`、`name`、`region`、`applicantPhone`）：

- 品牌标语（`slogan`）
- 门店详细地址（`detailAddress`）
- 客服微信号（`contactWechat`）
- 落地页封面图上传（`landingCoverUrl`）

---

## 5. 小程序端变更

### 5.1 新增 Store：`stores/tenant-landing.ts`

```ts
interface TenantLandingState {
  tenantCode: string | null; // 从 URL 解析的租户码
  profile: TenantPublicProfile | null;
  loading: boolean;
  error: string | null;
  fetchProfile: (code: string) => Promise<void>;
}
```

### 5.2 改造 `pages/landing/index.tsx`

```
LandingPage
├── 解析 router.params.tc 或 router.params.scene
├── if (有 tenantCode)
│   ├── 调用 fetchProfile(tenantCode)
│   ├── loading → 骨架屏
│   └── 渲染 TenantLandingView 组件
└── else
    └── 渲染 L2COfficialView 组件（现有内容）
```

### 5.3 分享功能

在租户落地页中配置 `useShareAppMessage`：

```ts
useShareAppMessage(() => ({
  title: `${profile.name} — ${profile.slogan || '专业窗帘定制'}`,
  path: `/pages/landing/index?tc=${tenantCode}`,
  imageUrl: profile.landingCoverUrl || profile.logoUrl,
}));
```

### 5.4 预约功能

「预约上门量窗」按钮跳转到一个轻量预约表单页，客户填写：

- 姓名、手机号、小区地址
- 提交后在对应租户下创建一条线索（Lead）

---

## 6. 安全与性能考虑

1. **公开 API 限流**：`/api/miniprogram/tenant/public-profile` 需要加限流（如 60次/分钟/IP）
2. **信息隔离**：公开接口只返回展示字段，不返回 tenantId、settings 等内部数据
3. **缓存策略**：租户公开信息变化低频，可在小程序端做 5 分钟本地缓存
4. **无效租户码**：`code` 不存在时，优雅降级为 L2C 官方页面

---

## 7. 租户侧生成小程序码（后续可做）

在 Web 后台增加「生成专属小程序码」功能：

- 调用微信 `wxacode.getUnlimited` API
- `scene` = `tc=TENANTCODE`
- `page` = `pages/landing/index`
- 生成的小程序码图片可下载，用于印刷到：名片、桌牌、宣传册、门头

---

## 8. 实施优先级

| 阶段         | 内容                                                | 工作量估算 |
| ------------ | --------------------------------------------------- | ---------- |
| **P0 — MVP** | 数据库加字段 + 公开 API + 落地页两态切换 + 分享卡片 | 2-3 天     |
| **P1**       | 预约表单 + 线索自动创建 + 一键拨打电话              | 1-2 天     |
| **P2**       | Web 后台配置页 + 小程序码生成 + 客服微信对接        | 2-3 天     |
