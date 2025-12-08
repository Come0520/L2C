# 配置 Vitest 测试框架

## 选择理由

考虑到项目使用 Next.js 15 + React 19 + TypeScript，我选择 **Vitest** 作为测试框架，原因如下：

1. **与 Vite 生态兼容**：Next.js 15 内置 Vite 支持，Vitest 作为 Vite 的原生测试框架，兼容性更好
2. **速度快**：Vitest 采用了与 Vite 相同的预编译策略，测试运行速度更快
3. **现代特性**：支持 ESM、TypeScript、JSX 等现代特性
4. **API 友好**：API 设计与 Jest 兼容，学习曲线低
5. **与现有工具链集成**：可以与 ESLint、Prettier 等工具无缝集成

## 实施步骤

### 1. 安装依赖

```bash
npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### 2. 配置 Vitest

创建 `vitest.config.ts` 文件，配置 Vitest 以支持 React 和 TypeScript：

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./setupTests.ts'],
    globals: true,
    alias: {
      '@': './src',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*'],
      exclude: ['src/types/**/*', 'src/app/**/*'],
    },
  },
});
```

### 3. 创建测试设置文件

创建 `setupTests.ts` 文件，配置测试环境：

```typescript
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// 模拟 Next.js 导航
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// 模拟 Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  })),
}));
```

### 4. 配置 package.json 脚本

在 `package.json` 中添加测试相关脚本：

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ci": "vitest run --coverage --reporter=json"
  }
}
```

### 5. 更新 TypeScript 配置

在 `tsconfig.json` 中添加 Vitest 类型支持：

```json
{
  "compilerOptions": {
    // 现有配置...
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

### 6. 创建测试示例

创建一个简单的测试示例来验证配置是否正确：

```typescript
// src/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click Me</Button>);
    fireEvent.click(screen.getByText('Click Me'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

## 预期结果

配置完成后，您将能够：

1. 运行所有测试：`npm run test`
2. 运行测试并生成覆盖率报告：`npm run test:coverage`
3. 在监视模式下运行测试：`npm run test:watch`
4. 在 CI 环境中运行测试：`npm run test:ci`

## 兼容性考虑

- Vitest 与 Next.js 15 兼容
- Vitest 与 React 19 兼容
- Vitest 与 TypeScript 5 兼容
- Vitest 与 Tailwind CSS v4 兼容

## 后续建议

1. 为现有组件编写测试用例
2. 为自定义 hooks 编写测试用例
3. 为工具函数编写测试用例
4. 配置 CI/CD 流水线，在每次提交时自动运行测试
5. 设置测试覆盖率阈值，确保代码质量