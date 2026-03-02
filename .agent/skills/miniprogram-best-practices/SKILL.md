---
name: miniprogram-best-practices
description: 在处理任何微信小程序或 Taro 跨端应用相关问题之前必须阅读此文件。包含基于 Taro 4.x + React 的开发规范、微信小程序官方铁律、L2C 项目特有的四角色架构约束，严格遵守可避免常见的导航、分包、编译、性能等陷阱。
---

# L2C Taro + 微信小程序开发最佳实践

> **使用时机**：任何涉及小程序的问题（Taro 组件、导航、TabBar、分包、路由、样式、状态管理、性能优化等）都必须先阅读本文档，再开始操作。

---

## 一、技术栈概览

| 层次     | 技术                  | 版本   |
| -------- | --------------------- | ------ |
| 跨端框架 | Taro                  | 4.1.11 |
| UI 框架  | React                 | 18.3.x |
| 状态管理 | Zustand               | 5.x    |
| 样式方案 | SCSS Modules          | —      |
| 构建工具 | Webpack 5 (Taro 内置) | —      |
| 类型系统 | TypeScript            | 5.x    |
| 目标平台 | 微信小程序 (weapp)    | —      |

**项目路径**：`miniprogram-taro/`（Taro 新架构），原生代码在 `miniprogram/`（逐步废弃）。

---

## 二、Taro + React 编码铁律

### 2.1 文件组织规范

> [!CAUTION]
> **每个页面必须包含三个文件（缺一不可），且 import 路径必须精确！**

```
pages/workbench/
  ├── index.tsx         ← React 组件（页面本体）
  ├── index.config.ts   ← 页面配置（导航栏标题等）
  └── index.scss        ← 页面样式
```

**SCSS import 路径铁律**：

```tsx
// ✅ 正确：文件在当前目录，import 当前目录的 scss
import './index.scss';

// ❌ 错误：多嵌套一层目录名（最常见错误！）
import './create/index.scss'; // 如果文件已在 create/ 目录内
import './detail/index.scss'; // 如果文件已在 detail/ 目录内
```

### 2.2 Taro 组件使用规范

```tsx
// ✅ 正确：从 @tarojs/components 导入内置组件
import { View, Text, Image, Input, Button, ScrollView } from '@tarojs/components';

// ✅ 正确：从 @tarojs/taro 导入 API 和 Hooks
import Taro, { useDidShow, useLoad, usePullDownRefresh, useReachBottom } from '@tarojs/taro';

// ✅ 正确：React Hooks 从 react 导入
import { useState, useEffect, useCallback, useRef } from 'react';

// ❌ 错误：不要使用 HTML 标签
import { div, span } from 'react'; // 禁止！
```

### 2.3 事件处理差异（Taro vs 原生 React）

```tsx
// ✅ Taro 中 Input 事件用 onInput（不是 onChange）
<Input onInput={(e) => setKeyword(e.detail.value)} />

// ✅ Taro 中点击事件用 onClick
<View onClick={() => handleClick()}>

// ✅ 阻止事件冒泡（Taro 3.x 支持 stopPropagation）
onClick={(e) => { e.stopPropagation(); doSomething() }}

// ❌ 错误：不要用 onChange 处理 Input（Taro 小程序端不触发）
<Input onChange={(e) => setKeyword(e.target.value)} />  // 不会生效！
```

### 2.4 路径别名

```tsx
// ✅ 使用 @/ 别名引用 src/ 下的模块
import { useAuthStore } from '@/stores/auth';
import { api } from '@/services/api';
import TabBar from '@/components/TabBar/index';
```

对应 `tsconfig.json` 配置：

```json
{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }
```

### 2.5 页面生命周期（Taro Hooks vs 原生小程序）

| 原生小程序            | Taro React Hook                | 说明                     |
| --------------------- | ------------------------------ | ------------------------ |
| `onLoad(options)`     | `useLoad((params) => {})`      | 页面加载，获取路由参数   |
| `onShow()`            | `useDidShow(() => {})`         | 页面显示（含从后台切回） |
| `onPullDownRefresh()` | `usePullDownRefresh(() => {})` | 下拉刷新                 |
| `onReachBottom()`     | `useReachBottom(() => {})`     | 滚动触底                 |
| `Page.data`           | `useState()`                   | 状态管理                 |
| `this.setData({})`    | `setState()`                   | 更新状态                 |

---

## 三、四角色 TabBar 架构（2026-03-02 已审批）

### 3.1 TabBar 5 槽位配置

| 槽位 | Tab 名称 | 页面路径                    | 可见角色        |
| ---- | -------- | --------------------------- | --------------- |
| 0    | 工作台   | `pages/workbench/index`     | Manager, Sales  |
| 1    | 线索     | `pages/leads/index`         | Sales           |
| 2    | 展厅     | `pages/showroom/index`      | Sales, Customer |
| 3    | 任务     | `pages/tasks/index`         | Worker          |
| 4    | 我的     | `pages/users/profile/index` | 全部角色        |

### 3.2 角色可见 Tab 索引（ROLE_TABS 常量）

```typescript
// src/stores/auth.ts
export const ROLE_TABS: Record<UserRole, number[]> = {
  manager: [0, 4], // 工作台、我的
  admin: [0, 4], // 同 manager
  sales: [0, 1, 2, 4], // 工作台、线索、展厅、我的
  worker: [3, 4], // 任务、我的
  customer: [2, 4], // 展厅、我的
  guest: [], // 未登录
};
```

### 3.3 角色落地页（ROLE_HOME 常量）

```typescript
export const ROLE_HOME: Record<UserRole, string> = {
  manager: '/pages/workbench/index',
  sales: '/pages/workbench/index',
  worker: '/pages/tasks/index',
  customer: '/pages/showroom/index',
  guest: '/pages/login/index',
};
```

> [!IMPORTANT]
> **`installer` 角色已废弃！** 统一使用 `worker`，与数据库 `userRoleEnum` 一致。

### 3.4 自定义 TabBar 实现

Taro 中自定义 TabBar 是一个普通 React 组件，在每个 TabBar 页面手动引入：

```tsx
// 每个 TabBar 页面底部添加
import TabBar from '@/components/TabBar/index';

<TabBar selected="/pages/workbench/index" />;
```

**不同于原生小程序**：原生小程序的 `custom-tab-bar` 由框架自动注入，Taro 中必须手动引用。

---

## 四、微信小程序官方规范（在 Taro 中依然生效）

### 4.1 tabBar.list 核心约束

| 规则                                | 说明                              |
| ----------------------------------- | --------------------------------- |
| tabBar.list 最多 5 个               | 超过5个报错                       |
| **只能是主包页面**                  | 分包页面不得出现在 tabBar.list    |
| 导航用 `Taro.switchTab`             | tabBar 页面间跳转必须用 switchTab |
| app.config.ts 须声明 `custom: true` | 同时保留 list 配置                |

### 4.2 分包规范

- `subPackages` 配置路径外的目录自动打包到**主包**
- tabBar 页面必须在主包内
- 分包之间不能互相引用 JS/资源，只能引用主包内容
- 跳转分包页面用 `Taro.navigateTo`（不用 switchTab）

```tsx
// ✅ 正确：跳转分包页面用 navigateTo
Taro.navigateTo({ url: '/pages/leads-sub/detail/index?id=xxx' });

// ❌ 错误：分包页面不能用 switchTab
Taro.switchTab({ url: '/pages/leads-sub/detail/index' });
```

### 4.3 路径冲突检测

> [!CAUTION]
> **主包 pages 和分包 root 的路径前缀不能重复，否则模拟器 crash！**

```typescript
// ❌ 会 crash
pages: ['pages/leads/index'],
subPackages: [{ root: 'pages/leads', ... }]

// ✅ 正确：分包用不同路径
pages: ['pages/leads/index'],
subPackages: [{ root: 'pages/leads-sub', ... }]
```

---

## 五、Taro 性能优化规范

### 5.1 初始渲染缓存 ✅ 已启用

```typescript
// app.config.ts window 配置
window: {
  initialRenderingCache: 'static',
}
```

### 5.2 分包预下载 ✅ 已配置

```typescript
preloadRule: {
  'pages/workbench/index': {
    network: 'all',
    packages: ['orders', 'manager'],
  },
  'pages/tasks/index': {
    network: 'all',
    packages: ['tasks'],
  },
}
```

### 5.3 长列表优化

```tsx
// ✅ 使用 ScrollView + 分页加载代替一次性渲染全部数据
const [list, setList] = useState<Item[]>([]);
const pageRef = useRef(1);

useReachBottom(() => {
  if (hasMore && !loading) fetchNextPage();
});
```

### 5.4 避免启动阶段同步 API

```tsx
// ❌ 错误：启动时同步调用阻塞线程
const token = Taro.getStorageSync('token')

// ✅ 正确：尽量使用异步 API
Taro.getStorage({ key: 'token' }).then((res) => { ... })
```

> **例外**：auth store 的 `restore()` 方法中可以使用 Sync API（在 App 入口只调用一次，影响可控）。

### 5.5 样式变量复用（Design Tokens）

所有颜色、间距、字号使用 `app.scss` 中定义的 CSS 变量，不要硬编码：

```scss
// ✅ 正确
color: var(--color-primary);
padding: var(--spacing-md);

// ❌ 错误
color: #e6b450;
padding: 24px;
```

---

## 六、Taro 特有陷阱与解决方案

### 6.1 SCSS import 路径嵌套错误

**症状**：`Module not found: Can't resolve './create/index.scss'`

**原因**：文件已在 `pages/quotes/create/` 目录内，import 路径应为 `./index.scss` 而非 `./create/index.scss`。

**规则**：所有 `.tsx` 文件的 SCSS import 统一使用 `import './index.scss'`。

### 6.2 React + Taro 版本兼容

**Taro 4.x 要求 React 18**。安装依赖时如遇 peer dependency 冲突，使用：

```bash
npm install --legacy-peer-deps
```

### 6.3 `defineAppConfig` 和 `definePageConfig` 不需要 import

这两个函数是 Taro 的编译时宏，无需 import：

```typescript
// ✅ 正确：直接使用，不用 import
export default definePageConfig({
  navigationBarTitleText: '工作台',
});
```

### 6.4 自定义组件传递函数属性名以 on 开头

```tsx
// ✅ 正确：事件处理函数 prop 以 on 开头
<MyComponent onItemClick={handleClick} />

// ❌ 错误（小程序端可能不触发）
<MyComponent handleClick={handleClick} />
```

### 6.5 不要将模板中用到的数据设置为 undefined

```tsx
// ❌ 小程序端会导致渲染异常
const [title, setTitle] = useState(undefined);

// ✅ 使用空字符串或 null
const [title, setTitle] = useState('');
```

---

## 七、项目文件结构

```
miniprogram-taro/
  ├── config/               ← Taro 构建配置
  │   ├── index.ts          ← 通用配置
  │   ├── dev.ts            ← 开发环境
  │   └── prod.ts           ← 生产环境
  ├── src/
  │   ├── app.ts            ← 应用入口
  │   ├── app.config.ts     ← 全局路由和 TabBar 配置
  │   ├── app.scss           ← 全局样式 + Design Tokens
  │   ├── components/       ← 可复用组件
  │   │   └── TabBar/       ← 自定义 TabBar（核心）
  │   ├── stores/           ← Zustand 状态管理
  │   │   └── auth.ts       ← 认证 + ROLE_TABS + ROLE_HOME
  │   ├── services/         ← API 请求层
  │   │   └── api.ts        ← 统一请求封装
  │   ├── pages/            ← 主包页面
  │   │   ├── workbench/    ← 槽位 0 — 工作台
  │   │   ├── leads/        ← 槽位 1 — 线索
  │   │   ├── showroom/     ← 槽位 2 — 展厅
  │   │   ├── tasks/        ← 槽位 3 — 任务
  │   │   ├── users/profile/← 槽位 4 — 我的
  │   │   ├── login/        ← 登录
  │   │   ├── register/     ← 注册/入驻
  │   │   ├── landing/      ← 引导页
  │   │   └── ...           ← 其他主包页面
  │   └── pages/xxx-sub/    ← 分包页面
  └── types/                ← TypeScript 声明
```

---

## 八、操作检查清单

每次修改 Taro 小程序代码后，按以下顺序验证：

1. ✅ SCSS import 路径使用 `./index.scss`（不附加子目录名）
2. ✅ 事件处理使用 `onClick` 而非 `onTap`，Input 使用 `onInput` 而非 `onChange`
3. ✅ 函数组件 prop 中事件属性以 `on` 开头
4. ✅ 执行 `npx taro build --type weapp` 确认编译成功
5. ✅ 在微信开发者工具中导入 `dist/` 目录测试

---

## 九、参考链接

| 主题                | 链接                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| Taro 官方文档       | https://docs.taro.zone                                                                           |
| Taro React 开发概述 | https://docs.taro.zone/docs/react-overall                                                        |
| Taro 最佳实践       | https://docs.taro.zone/docs/best-practice                                                        |
| Taro 路由功能       | https://docs.taro.zone/docs/router                                                               |
| Taro 路径别名       | https://docs.taro.zone/docs/config-detail#alias                                                  |
| 微信自定义 tabBar   | https://developers.weixin.qq.com/miniprogram/dev/framework/ability/custom-tabbar.html            |
| 微信分包加载        | https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/basic.html                |
| 微信性能优化        | https://developers.weixin.qq.com/miniprogram/dev/framework/performance/tips/start_optimizeA.html |
