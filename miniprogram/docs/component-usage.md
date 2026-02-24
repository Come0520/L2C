# 小程序组件使用指南 (Component Usage Guide)

> 最后更新：2026-02-23

---

## 第三方组件库：Vant Weapp

项目使用 [Vant Weapp](https://vant-ui.github.io/vant-weapp/) 作为基础 UI 组件库，通过 `miniprogram_npm` 方式引入。

### 常用组件一览

| 组件 | 用途 | 使用页面示例 |
|:---|:---|:---|
| `van-button` | 按钮操作 | 登录、提交表单、确认操作 |
| `van-field` | 表单输入 | 登录表单、创建客户/线索 |
| `van-cell` / `van-cell-group` | 列表单元格 | 客户详情、任务列表 |
| `van-icon` | 图标 | 导航、状态标记 |
| `van-toast` | 轻提示 | 操作成功/失败反馈 |
| `van-dialog` | 对话框 | 确认删除、二次确认 |
| `van-loading` | 加载指示 | 数据加载中 |
| `van-empty` | 空状态 | 列表无数据 |
| `van-tab` / `van-tabs` | 标签切换 | 工作台角色切换、任务筛选 |
| `van-popup` | 弹出层 | 筛选面板、操作菜单 |
| `van-picker` | 选择器 | 日期选择、状态筛选 |
| `van-uploader` | 文件上传 | 现场照片上传 |
| `van-swipe-cell` | 滑动操作 | 列表项左滑删除/编辑 |
| `van-tag` | 标签 | 状态标识（待处理/已完成） |
| `van-steps` | 步骤条 | 审批流程、订单进度 |

### 使用规范

```json
// 在页面 .json 中声明组件
{
  "usingComponents": {
    "van-button": "@vant/weapp/button/index",
    "van-field": "@vant/weapp/field/index",
    "van-cell": "@vant/weapp/cell/index"
  }
}
```

### 主题定制

通过 CSS 变量覆盖 Vant 默认主题，保持与品牌色一致：

```css
/* app.wxss 中全局定制 */
page {
  --button-primary-background-color: #E6B450;    /* 品牌金色 */
  --button-primary-border-color: #E6B450;
  --tabs-bottom-bar-color: #E6B450;
  --tag-primary-color: #E6B450;
}
```

---

## 自定义组件

### `signature` — 电子签名组件

| 属性 | 说明 |
|:---|:---|
| **路径** | `components/signature/` |
| **功能** | 客户在报价确认时手写签名 |
| **使用页面** | 报价详情确认流程 |
| **事件** | `bind:confirm` 返回签名图片 Base64 |

### `custom-tab-bar` — 自定义底部导航栏

| 属性 | 说明 |
|:---|:---|
| **路径** | `custom-tab-bar/` |
| **功能** | 5 个 Tab 导航（首页/工作台/客户/报价/我的） |
| **特性** | 支持角色控制显隐、未读消息角标 |

---

## 数据管理

### `stores/auth-store.ts` — 全局认证状态

```typescript
// 使用方式
import { authStore } from '../../stores/auth-store';

// 检查登录状态
if (!authStore.isLoggedIn) {
    wx.reLaunch({ url: '/pages/landing/landing' });
}

// 获取当前用户
const user = authStore.userInfo;
const token = authStore.token;
```

---

## 工具类

| 文件 | 功能 | 说明 |
|:---|:---|:---|
| `utils/error-reporter.ts` | 错误上报 | 自动捕获 JS/Promise/API 异常并批量上报 |
| `utils/performance-monitor.ts` | 性能监控 | 追踪页面加载、setData 大小和内存警告 |
| `utils/navigation-guard.ts` | 路由守卫 | 统一拦截未登录状态的页面访问 |
| `utils/logger.ts` | 日志工具 | 开发环境控制台日志增强 |
| `utils/util.ts` | 通用工具 | 日期格式化、金额处理等通用函数 |
