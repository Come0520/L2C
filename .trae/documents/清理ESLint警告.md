# 清理ESLint警告计划

## 问题分析

经过检查，我发现项目的ESLint配置和依赖基本正常，但在`lead-filters.tsx`文件中存在一些潜在的ESLint警告：

1. **React导入警告**：在Next.js 17+中，React导入是可选的，但文件中仍然包含`import React from 'react'`
2. **类型不匹配**：`debouncedSetTag`函数的参数类型定义与`LeadTag`类型不完全匹配
3. **属性换行格式**：JSX中的属性换行格式可能不符合ESLint的prettier规则

## 解决方案

### 1. 移除不必要的React导入

**文件**：`src/features/leads/components/list/lead-filters.tsx`
**修改**：移除第1行的`import React from 'react'`

### 2. 修复类型不匹配问题

**文件**：`src/features/leads/components/list/lead-filters.tsx`
**修改**：将`debouncedSetTag`函数的参数类型从硬编码的字符串联合类型改为使用`LeadTag`类型

### 3. 统一JSX属性换行格式

**文件**：`src/features/leads/components/list/lead-filters.tsx`
**修改**：调整JSX元素的属性换行格式，使其符合ESLint的prettier规则

## 实施步骤

1. 使用ESLint的自动修复功能修复大部分警告：`npx eslint . --ext .ts,.tsx --fix`
2. 手动修复剩余的警告，特别是类型相关的问题
3. 运行`npm run lint`验证所有警告已被清理
4. 运行`npm run typecheck`验证类型问题已被解决

## 预期结果

- 项目中不再有ESLint警告
- 代码符合项目的ESLint和prettier配置
- 类型定义更加准确和一致

## 额外检查

在清理过程中，我还将检查其他可能存在ESLint警告的文件，特别是与leads功能相关的组件和测试文件，确保整个项目的代码质量保持一致。