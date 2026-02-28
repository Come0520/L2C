---
name: miniprogram-best-practices
description: 在处理任何微信小程序或多端应用(App)相关问题之前必须阅读此文件。包含基于微信官方文档的铁律、L2C 项目特有的开发规范以及多端应用 API 兼容限制，严格遵守可避免常见的导航、分包、编译、性能等陷阱。
---

# L2C 微信小程序开发最佳实践

> **使用时机**：任何涉及小程序的问题（导航、TabBar、分包、页面跳转、组件、性能优化等）都必须先阅读本文档，再开始操作。

---

## 一、TypeScript 编译铁律

> [!CAUTION]
> **永远只修改 `.ts` 源文件，绝不直接修改 `.js` 编译产物！**

微信开发者工具的"重新编译"会将 `.ts` 文件重新编译为 `.js`，覆盖对 `.js` 的任何手动修改。

```
✅ 正确：修改 miniprogram/custom-tab-bar/index.ts
❌ 错误：修改 miniprogram/custom-tab-bar/index.js
```

**项目 TypeScript 文件列表（只改这些）：**
- `custom-tab-bar/index.ts`
- `pages/*/index.ts` 或 `pages/*/*/index.ts`
- `stores/auth-store.ts`
- `app.ts`

---

## 二、自定义 TabBar（custom-tab-bar）官方规范

### 2.1 核心约束（来自官方文档）

> [!IMPORTANT]
> **tabBar.list 中的页面 path 必须且只能是主包（main package）页面，分包页面不能进入 tabBar.list。**

| 规则 | 说明 |
|------|------|
| tabBar.list 最多 5 个 | 超过5个会报错 |
| **只能是主包页面** | 分包页面不得出现在 tabBar.list 中 |
| custom-tab-bar 自动注入 | 框架只在 tabBar.list 的页面上自动注入，非 tabBar 页面无自动注入 |
| 导航只用 wx.switchTab | tabBar.list 内的页面跳转必须用 wx.switchTab，navigateTo 无效 |
| app.json 须声明 custom: true | 同时必须保留 color/selectedColor/backgroundColor/list 配置 |

### 2.2 当前 L2C tabBar.list 配置（主包 5 个）

```json
"list": [
  { "pagePath": "pages/index/index",     "text": "首页" },
  { "pagePath": "pages/workbench/index", "text": "工作台" },
  { "pagePath": "pages/leads/index",     "text": "线索" },
  { "pagePath": "pages/quotes/index",    "text": "报价" },
  { "pagePath": "pages/users/profile",   "text": "我的" }
]
```

> `pages/leads/index` 是**主包**页面（已通过重构从分包提升）。

### 2.3 custom-tab-bar 官方最简实现（switchTab）

```typescript
// custom-tab-bar/index.ts
methods: {
    switchTab(e: any) {
        const data = e.currentTarget.dataset;
        const url = data.path;
        // 官方推荐：所有 tab 页均在 tabBar.list 中，直接用 switchTab
        wx.switchTab({ url });
        this.setData({ selected: data.index });
    }
}
```

### 2.4 WXML 必须用普通 view，不用 cover-view

```xml
<!-- ✅ 正确 -->
<view bindtap="switchTab" data-path="..." data-index="...">
  <image src="..." />
  <view>文字</view>
</view>

<!-- ❌ 错误：cover-view 的 bindtap 不可靠，会导致点击失效 -->
<cover-view bindtap="switchTab">...</cover-view>
```

> `cover-view` 仅用于遮盖 map/video 原生组件，在普通 TabBar 场景会导致事件失效。

### 2.5 每个 tabBar 页的 onShow 高亮设置

**关键**：`selected` 的值是**当前角色 tab 列表中的索引**，不是 tabBar.list 的槽位索引。

```typescript
// pages/workbench/index.ts
onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({ selected: 0 }); // workbench 是 adminTabs[0]
    }
}
```

**L2C 各角色 tab 列表与对应 selected 索引：**

| 角色 | tab 列表 | selected 值 |
|------|---------|------------|
| admin/boss | 工作台(0), 线索(1), 报价(2), 我的(3) | 对应 0/1/2/3 |
| sales | 工作台(0), 线索(1), 报价(2), 我的(3) | 对应 0/1/2/3 |
| installer | 任务(0), 我的(1) | 对应 0/1 |
| customer | 首页(0), 报价(1), 我的(2) | 对应 0/1/2 |

---

## 三、分包（Subpackage）规范

### 3.1 官方分包打包原则

- `subPackages` 配置路径外的目录自动打包到**主包**
- `subPackages` 的根目录不能是另一个 `subPackages` 内的子目录
- **tabBar 页面必须在主包内**（官方原文）
- 分包之间不能互相引用 JS/template/资源，只能引用主包内容

### 3.2 官方分包引用原则

- packageA 无法 require packageB 的 JS，只能 require 主包或自身的
- packageA 无法使用 packageB 的资源（图片/WXSS），只能用主包或自身的
- 如需跨分包复用，使用[分包异步化](https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/async.html)

### 3.3 L2C 当前分包结构（10个分包）

```
主包 pages/        ← 所有 tabBar 页面和高频页面
├── index/         ← ✅ tabBar（首页）
├── workbench/     ← ✅ tabBar（工作台）
├── leads/index    ← ✅ tabBar（线索列表，已提升到主包）
├── quotes/        ← ✅ tabBar（报价）
├── users/profile  ← ✅ tabBar（我的）
├── crm/           ← 主包（高频）
└── login/register/landing/status/

分包 pages/leads-sub/   ← 线索的 create/detail
分包 pages/tasks/       ← 任务列表/详情/量房
分包 pages/showroom/    ← 云展厅
分包 pages/service/     ← 服务申请/列表
分包 pages/projects/    ← 项目任务详情
分包 pages/invite/      ← 邀请
分包 pages/manager/     ← 销售目标管理
分包 pages/tenant/      ← 租户支付设置
分包 pages/reports/     ← 数据报表
分包 pages/orders/      ← 订单列表/详情
```

### 3.4 分包页面导航

分包页面用 `wx.navigateTo` 或 `wx.reLaunch`（不能用 `wx.switchTab`）：

```typescript
// 正确：跳转到分包页面
wx.navigateTo({ url: '/pages/leads-sub/create/index' });
wx.navigateTo({ url: '/pages/leads-sub/detail/index?id=xxx' });
wx.navigateTo({ url: '/pages/orders/detail/index?id=xxx' });
wx.navigateTo({ url: '/pages/tasks/index' });
```

---

## 四、性能优化规范（官方最佳实践）

### 4.1 按需注入（lazyCodeLoading）⚠️ L2C 特殊限制

> [!WARNING]
> **官方强烈推荐开启 `lazyCodeLoading: "requiredComponents"`，但 L2C 项目暂时禁用！**

**官方建议**：按需注入可显著降低启动时间和内存占用（基础库 2.11.1+，**推荐所有小程序使用**）。

**L2C 项目限制**：在 Windows 开发者工具中，`lazyCodeLoading` 与 `WAAccelerateWorker` 存在兼容性问题，会导致：
- `worker.js 500 Internal Server Error`
- 所有组件 tap 事件完全失效

```json
// ❌ L2C 项目当前禁止使用（Windows 开发环境兼容性问题）
"lazyCodeLoading": "requiredComponents"
```

> 待微信开发者工具修复此兼容性问题后，应第一时间重新开启。

### 4.2 初始渲染缓存（initialRenderingCache）✅ L2C 已启用

官方推荐（基础库 2.11.1+）：非首次启动时，视图层直接展示缓存的渲染结果，不等待逻辑层初始化，大幅提前首屏可见时间。

```json
// ✅ L2C 已在 app.json window 中配置
"window": {
  "initialRenderingCache": "static"
}
```

### 4.3 启动过程减少同步 API 调用（官方重要建议）

在 `App.onLaunch`、`App.onShow`、`Page.onLoad`、`Page.onShow` 及初始化代码中：

```typescript
// ❌ 错误：启动时同步调用，阻塞 JS 线程
const info = wx.getSystemInfoSync();
const token = wx.getStorageSync('token');

// ✅ 正确：使用异步 API
wx.getSystemInfo({ success: (info) => { ... } });
wx.getStorage({ key: 'token', success: (res) => { ... } });
```

**特别注意**：`getSystemInfo` 是同步 API（名字没有 Sync 后缀，但实际上是同步阻塞）。

### 4.4 分包预下载（preloadRule）—— L2C 待实现

官方建议：分包加载后进入分包页面需要等待下载，影响体验。使用 `preloadRule` 可在指定页面加载时预先下载分包。

```json
// app.json 示例：在工作台页面预下载 tasks 分包
"preloadRule": {
  "pages/workbench/index": {
    "network": "all",
    "packages": ["tasks", "orders"]
  }
}
```

> L2C 目前有 10 个分包，建议为高频跳转路径添加预下载规则以提升用户体验。

### 4.5 精简首屏数据（官方最佳实践）

- 与视图层渲染无关的数据**不要放在 `data` 中**，避免影响渲染时间
- 首屏优先展示关键部分，非关键内容延迟更新（渐进式渲染）
- 及时从 `usingComponents` 移除未使用的自定义组件

---

## 五、常见陷阱与解决方案

### 5.1 lazyCodeLoading 与 WAAccelerateWorker 冲突（L2C 历史 Bug）

**症状**：启动时 `worker.js 500 Internal Server Error`，所有组件的 tap 事件完全失效。

**原因**：`"lazyCodeLoading": "requiredComponents"` 与 Windows 开发者工具存在兼容性问题。

**解决方案**：移除 `app.json` 中的 `lazyCodeLoading` 字段。

### 5.2 preloadRule 与 lazyCodeLoading 叠加冲突

**症状**：模拟器启动失败，`fd argument must be a file descriptor`。

**解决方案**：`preloadRule` 和 `lazyCodeLoading` 不要同时使用（绝对禁止叠加）。

### 5.3 路径冲突导致模拟器 crash

**症状**：模拟器无法启动，无明显错误信息。

**原因**：同一路径前缀既出现在主包 `pages` 数组中，又用作分包 `root`。

```json
// ❌ 会 crash 的配置
"pages": ["pages/leads/index"],    // 主包
"subpackages": [{ "root": "pages/leads", ... }]  // 分包

// ✅ 正确做法：重命名分包 root
"pages": ["pages/leads/index"],
"subpackages": [{ "root": "pages/leads-sub", ... }]
```

### 5.4 non-tabBar 页面无 custom-tab-bar 显示

**症状**：navigateTo 跳转到分包页面后，底部 TabBar 消失。

**说明**：框架只在 tabBar.list 中的页面自动注入 custom-tab-bar，分包页面需要手动添加。

**解决方案**：
1. 在分包页面的 `.json` 中注册 `custom-tab-bar` 组件
2. 在 `.wxml` 中添加 `<custom-tab-bar />`
3. 在 `.ts` 的 `onShow` 中手动调用 `this.getTabBar().setData({ selected: N })`

> 注意：这种手动注入要通过 `wx.switchTab` 而非 `wx.navigateTo` 返回 tabBar 页，否则视觉图标会错乱。

---

## 六、操作检查清单

每次修改小程序代码后，按以下顺序操作：

1. **只修改 `.ts` 文件**，绝不改 `.js`
2. 微信开发者工具 → **工具** → **清除全部缓存**
3. **重新编译**（让 TypeScript 重新编译 .ts → .js）
4. 在模拟器中测试各角色的 Tab 切换
5. 验证分包页面跳转不使用 switchTab

---

## 七、参考链接（官方文档）

| 主题 | 链接 |
|------|------|
| 自定义 tabBar | https://developers.weixin.qq.com/miniprogram/dev/framework/ability/custom-tabbar.html |
| 分包加载 | https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/basic.html |
| 分包预下载 | https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/preload.html |
| 独立分包 | https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/independent.html |
| 分包异步化 | https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/async.html |
| 页面路由 | https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/route.html |
| 代码包体积优化 | https://developers.weixin.qq.com/miniprogram/dev/framework/performance/tips/start_optimizeA.html |
| 代码注入优化（按需注入）| https://developers.weixin.qq.com/miniprogram/dev/framework/performance/tips/start_optimizeB.html |
| 首屏渲染优化 | https://developers.weixin.qq.com/miniprogram/dev/framework/performance/tips/start_optimizeC.html |
| 初始渲染缓存 | https://developers.weixin.qq.com/miniprogram/dev/framework/view/initial-rendering-cache.html |
| app.json 全局配置 | https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html |

---

## 八、多端应用（App）开发兼容性铁律

因项目启用“多端应用模式”（将小程序编译为 Android/iOS App），底层环境脱离了微信客户端，因此在进行 API 调用时必须遵守以下铁律：

### 8.1 核心 API 替换与条件编译

在开发**登录、支付、分享、关联跳转**等涉及微信生态能力的功能时，**必须**进行环境判断或使用 `wx.miniapp` 系的新接口，否则在 App 端会直接抛错甚至崩溃：

| 原生小程序 API | 多端应用 (App) 替代方案 | 重要限制与说明 |
|--------------|-------------------------|--------------|
| `wx.login` | APP端无此概念，须走统一手机号验证，或由 App 原生接入微信 SDK 授权登录。 | 未绑定开放平台移动应用账号前，App 端无法拉起微信登录。 |
| `wx.requestPayment` | `wx.miniapp.requestPayment` | iOS 端涉及虚拟物品支付必须高度注意，有可能被 Apple 要求走 IAP (内购) 机制。 |
| `wx.showShareMenu` / `<button open-type="share">` | `wx.miniapp.shareToWechat` (分享到微信) | 需要集成相关 SDK，且只能将内容分享**回**微信对话或朋友圈。 |
| 跳转其他小程序 | `wx.miniapp.launchMiniProgram` | 接口签名和逻辑均发生变化。 |
| `wx.openCustomerServiceChat` | `wx.miniapp.openCustomerServiceChat` | 用于在 App 中唤起微信客服组件。 |

### 8.2 完全不可用的废弃能力

> [!CAUTION]
> 绝对禁止在 App 端强依赖以下能力处理核心业务，因为它们在非微信客户端环境下根本不存在！

1. **消息订阅 (`wx.requestSubscribeMessage`)**：小程序内的订阅模板消息在 App 中完全无效。若需在 App 侧推送通知，必须自行集成 Android/iOS 的第三方 Push 推送服务（如极光推送等）。
2. **特定私有接口**：脱离微信环境后，单纯依赖 open-type 获取的用户私有信息可能会失效。

### 8.3 网络请求与基础能力

- `wx.getSystemInfo` 及其衍生接口的返回值结构会发生改变。处理安全区 (Safe Area) 时需考虑 App 层的异形屏及设备特定高度适配（不能无脑假定微信顶部的 NavigationBar 高度）。
- 自定义 TabBar (custom-tab-bar) 的限制在多端模式下依然完全生效（见第二章）。这不仅为了小程序，更是保证在 App 编译时不产生路由与渲染树崩溃的核心依据。

### 8.4 兼容性处理范例

在所有涉及上述受促 API 的业务逻辑层（如 `src/features` 等）调用微信 API 时，请严格预判运行环境：

```typescript
// 检查业务是否处于 App 端环境 (建议在项目中封装集中式的判断工具，而不是散落在各处)
const sysInfo = wx.getSystemInfoSync();
// 注意：依据所使用的多端框架不同，environment 判断条件可能是 'miniapp' 或包含 'App' 字样
const isApp = sysInfo.environment === 'miniapp' || sysInfo.platform === 'android' || sysInfo.platform === 'ios';

if (isApp) {
  // 👉 走 App 端的原生微信 SDK 能力
  // wx.miniapp.requestPayment({ ... });
} else {
  // 👉 走标准原生小程序能力
  // wx.requestPayment({ ... });
}
```
