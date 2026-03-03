# 任务 4：前端输入校验加固

## 任务概述

为小程序所有表单页面添加前端输入校验，防止无效数据提交到后端。

## 项目上下文

- **项目路径**：`miniprogram-taro/`
- **技术栈**：Taro 4.x + React 18 + TypeScript + Zustand + SCSS Modules
- **Taro 组件**：`@tarojs/components` 中的 `View`, `Text`, `Input`, `Button` 等
- **UI 反馈**：使用 `Taro.showToast({ title, icon: 'none' })` 显示错误提示
- **现有 API 层**：`src/services/api.ts` — 统一请求封装
- **注释语言**：所有代码注释必须使用中文

## 交付物

### 1. 创建 `src/utils/validate.ts` — 统一校验工具

```typescript
/**
 * 前端表单校验工具
 */

/** 校验 11 位中国手机号 */
export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone.trim());
}

/** 非空校验（trim 后） */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/** 长度校验 */
export function isValidLength(value: string, min: number, max: number): boolean {
  const len = value.trim().length;
  return len >= min && len <= max;
}

/** 校验邮箱格式 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
```

### 2. 为 `validate.ts` 编写单元测试

创建 `src/utils/__tests__/validate.test.ts`，至少包含以下用例：

| 用例                  | 输入             | 期望                 |
| :-------------------- | :--------------- | :------------------- |
| 有效手机号            | `'13800138000'`  | `true`               |
| 无效手机号（10位）    | `'1380013800'`   | `false`              |
| 无效手机号（非1开头） | `'23800138000'`  | `false`              |
| 空字符串              | `''`             | `false` (isNotEmpty) |
| 纯空格                | `'   '`          | `false` (isNotEmpty) |
| 正常文本              | `'张三'`         | `true` (isNotEmpty)  |
| 长度校验 - 在范围内   | `'hello', 1, 10` | `true`               |
| 长度校验 - 超出范围   | `'hi', 5, 10`    | `false`              |

### 3. 修改以下页面，在表单提交前添加校验

#### `src/pages/login/index.tsx`

- 手机号登录时：校验手机号格式（`isValidPhone`）
- 账号密码登录时：校验账号非空、密码长度 ≥ 6

#### `src/pages/register/index.tsx`

- 手机号格式校验
- 企业名称非空校验
- 联系人姓名非空校验

#### `src/pages/leads-sub/create/index.tsx`

- 客户名非空校验
- 手机号格式校验（如已填写）

#### `src/pages/crm/create/index.tsx`（如存在创建表单）

- 客户名非空校验
- 手机号格式校验

#### `src/pages/crm/followup/index.tsx`

- 跟进内容非空校验（`isNotEmpty`）

#### `src/pages/service/apply/index.tsx`

- 售后原因非空校验

### 校验失败时的处理逻辑

```typescript
// 统一模式：校验失败 → showToast → return（不发请求）
import Taro from '@tarojs/taro';
import { isValidPhone, isNotEmpty } from '@/utils/validate';

const handleSubmit = () => {
  if (!isNotEmpty(name)) {
    Taro.showToast({ title: '请填写客户姓名', icon: 'none' });
    return;
  }
  if (phone && !isValidPhone(phone)) {
    Taro.showToast({ title: '请输入正确的手机号码', icon: 'none' });
    return;
  }
  // 通过校验，发送请求...
};
```

## 约束

- **不修改** `validate.ts` 以外的工具文件
- **不修改** API 层（`services/api.ts`）
- 校验逻辑只在前端，不影响后端
- 所有提示文字使用中文第二人称（"请输入..."、"请填写..."）

## 验证标准

```bash
cd miniprogram-taro && npx jest src/utils/__tests__/validate.test.ts
# 输出：1 test suite, 8+ tests passed

cd miniprogram-taro && npx taro build --type weapp
# 编译无错误
```
