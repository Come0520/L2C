# 批量操作UI实施方案（基于现有组件库）

> **重要发现**: 项目已有完整的 Paper UI 组件库，无需安装 shadcn/ui！  
> **更新时间**: 2025-12-12 23:45  
> **技术栈**: 现有 Paper 组件 + Framer Motion

---

## ✅ 现有技术栈评估

### 已有UI组件 (`@/components/ui/`)
- ✅ `PaperModal` - 模态框组件
- ✅ `PaperButton` - 按钮组件
- ✅ `PaperCard` - 卡片组件
- ✅ `PaperTable` - 表格组件
- ✅ `PaperInput` - 输入框组件
- ✅ `toast` - 提示组件
- ✅ `Skeleton` - 骨架屏
- ✅ `VirtualList` - 虚拟列表

### 已安装依赖
```json
{
  "framer-motion": "^12.23.26",  // ✅ 已安装，用于动画
  "class-variance-authority": "^0.7.1",  // ✅ CSS工具
  "clsx": "^2.1.1"  // ✅ 类名工具
}
```

---

## 🎯 最佳实施方案

### 方案决策：使用现有 Paper 组件库

**为什么不用 shadcn/ui？**
1. ❌ 项目已有完整UI库，避免冗余
2. ❌ 保持设计风格一致性
3. ❌ 减少打包体积
4. ❌ 降低维护成本

**使用 Paper 组件的优势**
1. ✅ 零额外依赖
2. ✅ 团队已熟悉
3. ✅ 风格统一
4. ✅ 维护简单

---

## 📦 组件实现方案

### BulkOperationProgress 组件

```typescript
// src/components/ui/bulk-operation-progress.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { PaperModal } from '@/components/ui/paper-modal'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard } from '@/components/ui/paper-card'

interface BulkOperationProgressProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  total: number
  current: number
  successCount: number
  failedCount: number
  failedItems?: Array<{
    id: string
    name?: string
    reason: string
  }>
  onCancel?: () => void
  onRetry?: (failedIds: string[]) => void
  onClose?: () => void
}

export function BulkOperationProgress({
  open,
  onOpenChange,
  title,
  total,
  current,
  successCount,
  failedCount,
  failedItems = [],
  onCancel,
  onRetry,
  onClose,
}: BulkOperationProgressProps) {
  const progress = total > 0 ? (current / total) * 100 : 0
  const isComplete = current >= total
  const hasErrors = failedCount > 0

  return (
    <PaperModal open={open} onOpenChange={onOpenChange}>
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-6">{title}</h2>

        {/* 进度条 */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>进度</span>
            <span>{current} / {total}</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <motion.div
              className="h-full bg-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <PaperCard className="text-center p-4">
            <div className="text-2xl font-bold text-blue-600">{current}</div>
            <div className="text-xs text-gray-500 mt-1">已处理</div>
          </PaperCard>
          <PaperCard className="text-center p-4">
            <div className="text-2xl font-bold text-green-600">{successCount}</div>
            <div className="text-xs text-gray-500 mt-1">成功</div>
          </PaperCard>
          <PaperCard className="text-center p-4">
            <div className="text-2xl font-bold text-red-600">{failedCount}</div>
            <div className="text-xs text-gray-500 mt-1">失败</div>
          </PaperCard>
        </div>

        {/* 失败列表 */}
        <AnimatePresence>
          {hasErrors && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <div className="text-sm font-medium text-red-600 mb-2">
                失败详情 ({failedCount})
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2 p-3 bg-red-50 rounded">
                {failedItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-2 bg-white rounded shadow-sm"
                  >
                    {item.name && <div className="font-medium text-sm">{item.name}</div>}
                    <div className="text-xs text-gray-600 mt-1">{item.reason}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          {!isComplete && onCancel && (
            <PaperButton variant="outline" onClick={onCancel} className="flex-1">
              取消操作
            </PaperButton>
          )}
          {isComplete && hasErrors && onRetry && (
            <PaperButton variant="outline" onClick={() => onRetry(failedItems.map(i => i.id))} className="flex-1">
              重试失败项
            </PaperButton>
          )}
          {isComplete && (
            <PaperButton onClick={onClose || (() => onOpenChange(false))} className="flex-1">
              {hasErrors ? '关闭' : '完成'}
            </PaperButton>
          )}
        </div>
      </div>
    </PaperModal>
  )
}
```

---

## 🚀 实施步骤

### Step 1: 创建组件 (0.5小时)
```bash
# 无需安装任何依赖！
# framer-motion 已安装

# 创建组件文件
touch src/components/ui/bulk-operation-progress.tsx
```

### Step 2: 集成到订单列表 (0.5小时)
```typescript
// 在订单列表中使用
import { BulkOperationProgress } from '@/components/ui/bulk-operation-progress'
import { salesOrderService } from '@/services/salesOrders.client'

// ... 使用示例
```

### Step 3: 测试验证 (0.5小时)
- 测试进度显示
- 测试失败列表
- 测试重试功能

---

## ✅ 验收标准

### 功能验收
- ✅ 进度条平滑动画
- ✅ 统计数据实时更新
- ✅ 失败列表正确显示
- ✅ 重试功能正常工作

### 视觉验收
- ✅ 符合 Paper UI 设计风格
- ✅ 动画效果流畅
- ✅ 移动端响应式

---

## 📊 对比分析

| 方案 | shadcn/ui | Paper组件库 (推荐) |
|------|-----------|-------------------|
| 额外依赖 | 需安装多个包 | ✅ 零依赖 |
| 打包体积 | +150KB | ✅ 0KB |
| 风格一致性 | 需调整 | ✅ 原生一致 |
| 学习成本 | 高 | ✅ 低 |
| 维护成本 | 高 | ✅ 低 |
| 开发时间 | 2小时 | ✅ 1.5小时 |

---

**方案决定**: 使用现有 Paper 组件库  
**预计开发时间**: 1.5小时（比安装新库快30%）  
**开始时间**: 立即
