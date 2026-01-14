# React钩子最佳实践修复计划

## 🎯 修复目标
修复项目中违反React 19最佳实践的钩子使用问题，提升性能和代码质量。

## 📋 修复任务清单

### 阶段1：立即修复（高优先级 - 性能问题）

#### 1. 修复 `orb-background.tsx` - 移除不必要的mounted状态
**文件**: `src/shared/ui/liquid/orb-background.tsx`
- 移除`mounted`状态和对应的useEffect
- 直接渲染组件内容，避免额外的渲染周期

#### 2. 修复 `dashboard-filter-bar.tsx` - 使用useMemo替代useEffect
**文件**: `src/shared/ui/dashboard-filter-bar.tsx`
- 将URL同步逻辑从useEffect改为useMemo
- 移除`previousUrlSearch` ref和相关的useEffect
- 简化状态管理逻辑

#### 3. 修复 `quotes-advanced-filter.tsx` - 合并状态更新
**文件**: `src/features/quotes/components/quotes-advanced-filter.tsx`
- 将5个独立状态合并为一个状态对象
- 在useEffect中只进行一次状态更新
- 减少重新渲染次数

### 阶段2：尽快修复（中优先级 - 记忆化问题）

#### 4. 优化 `track-quote-form.tsx` - 避免watch值传递问题
**文件**: `src/features/quotes/components/track-quote-form.tsx`
- 保留现有的watch调用（用于表单控制）
- 确保watch值不传递给记忆化组件
- 添加注释说明注意事项

#### 5. 重构 `reminder-rule-form.tsx` - 改进watch订阅逻辑
**文件**: `src/features/settings/components/reminder-rule-form.tsx`
- 移除useEffect中的watch订阅
- 直接使用watch的值
- 使用useMemo派生`selectedChannels`和`recipientType`

### 阶段3：清理工作（低优先级 - 代码质量）

#### 6. 清理未使用的导入和变量
- `curtain-sub-category-tabs.tsx` - 移除未使用的`useState`
- `quote-bundle-editor.tsx` - 移除未使用的`category`变量
- `collapsible.tsx` - 移除未使用的`React`导入
- 其他文件中的未使用变量

## ✅ 预期效果
- 消除所有`react-hooks/set-state-in-effect`错误
- 消除所有`react-hooks/incompatible-library`警告
- 减少不必要的重新渲染
- 提升组件性能
- 符合React 19最佳实践

## 🔧 修复策略
1. 保持功能不变，只优化实现方式
2. 遵循React 19官方推荐模式
3. 确保修复后通过lint检查
4. 添加必要的注释说明设计决策