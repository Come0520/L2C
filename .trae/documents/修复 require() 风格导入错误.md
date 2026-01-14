# 修复 require() 风格导入错误

## 问题
在两个测试文件中发现了 9 处 `require()` 风格的导入错误，违反了 ESLint 规则 `@typescript-eslint/no-require-imports`。

## 受影响的文件
1. `src/features/leads/__tests__/leads-filter-bar.test.tsx` (5 处)
2. `src/features/leads/__tests__/leads-advanced-filter.test.tsx` (4 处)

## 修复方案
将 `require()` 改为 `import`，并使用 `vi.mocked()` 来类型化 mock 函数：

**修改前：**
```typescript
vi.mocked(require('next/navigation').useRouter).mockReturnValue({
    replace,
});
```

**修改后：**
```typescript
import { useRouter, useSearchParams } from 'next/navigation';

const mockUseRouter = vi.mocked(useRouter);
const mockUseSearchParams = vi.mocked(useSearchParams);

// 在测试中使用
mockUseRouter.mockReturnValue({
    replace,
});
```

## 具体修改
1. 在两个文件顶部添加 `import { useRouter, useSearchParams } from 'next/navigation'`
2. 创建 `mockUseRouter` 和 `mockUseSearchParams` 常量
3. 将所有 `vi.mocked(require('next/navigation').useRouter)` 替换为 `mockUseRouter`
4. 将所有 `vi.mocked(require('next/navigation').useSearchParams)` 替换为 `mockUseSearchParams`