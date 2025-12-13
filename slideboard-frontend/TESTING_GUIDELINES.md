# 测试编写指南

## 1. 测试框架与工具

### 1.1 主要测试框架
- **Vitest**：主要的测试运行器，用于单元测试和组件测试
- **React Testing Library**：用于React组件测试，遵循用户行为导向原则
- **Playwright**：用于端到端(E2E)测试

### 1.2 辅助工具
- **jsdom**：模拟浏览器环境，用于组件测试
- **@testing-library/jest-dom**：提供DOM断言扩展
- **vi.mock()**：Vitest的内置mock功能

## 2. 测试文件结构与命名

### 2.1 目录结构
```
src/
├── services/
│   └── __tests__/         # 服务层测试
├── features/
│   └── [feature]/
│       ├── components/
│       │   └── __tests__/ # 组件测试
│       └── hooks/
│           └── __tests__/  # Hook测试
├── utils/
│   └── __tests__/          # 工具函数测试
└── test-utils/             # 测试工具和辅助函数
    ├── mockSupabase.ts     # Supabase mock客户端
    ├── testHelpers.ts      # 测试辅助函数
    └── testFixtures.ts     # 测试数据
```

### 2.2 文件命名
- 单元测试：`[filename].test.ts`
- 组件测试：`[ComponentName].test.tsx`
- 服务测试：`[service-name].[client/server].test.ts`
- E2E测试：`[feature-flow].spec.ts`

## 3. 测试类型与编写规范

### 3.1 单元测试

**测试目标**：测试独立的函数、方法或组件

**编写规范**：
- 测试函数名：`should [expected behavior] when [condition]`
- 每个测试只测试一个功能点
- 避免测试实现细节，测试行为而非实现
- 使用描述性的断言消息

**示例**：
```typescript
describe('getUserById', () => {
  it('should return user when user exists', async () => {
    // Arrange
    const userId = 'user-123';
    
    // Act
    const user = await userService.getUserById(userId);
    
    // Assert
    expect(user).toBeDefined();
    expect(user?.id).toBe(userId);
  });
  
  it('should return null when user does not exist', async () => {
    // Act
    const user = await userService.getUserById('non-existent-id');
    
    // Assert
    expect(user).toBeNull();
  });
});
```

### 3.2 组件测试

**测试目标**：测试React组件的渲染和交互

**编写规范**：
- 使用`render()`渲染组件
- 使用`screen`查询元素，遵循可访问性原则
- 模拟用户交互使用`fireEvent`或`userEvent`
- 避免测试内部状态，测试用户可见的行为

**示例**：
```typescript
describe('Button', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

### 3.3 服务测试

**测试目标**：测试与外部服务的交互

**编写规范**：
- 使用`vi.mock()`模拟外部依赖
- 测试成功和失败场景
- 验证调用参数和返回值

**示例**：
```typescript
vi.mock('@/lib/supabase/client');

describe('productsService', () => {
  it('should fetch products successfully', async () => {
    // Setup mock
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: mockProducts, error: null })
    };
    (supabase.from as vi.Mock).mockReturnValue(mockQuery);
    
    // Act
    const products = await productsService.getAllProducts();
    
    // Assert
    expect(products).toEqual(mockProducts);
    expect(supabase.from).toHaveBeenCalledWith('products');
  });
});
```

## 4. Mock与Stub

### 4.1 全局Mock

在`vitest.setup.ts`中配置全局mock，避免重复设置：

- Supabase客户端
- Next.js路由
- 环境变量
- 常见hooks

### 4.2 局部Mock

在测试文件中使用`vi.mock()`模拟特定依赖：

```typescript
// 模拟整个模块
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue(mockQuery)
  }
}));

// 模拟单个函数
vi.mocked(supabase.from).mockReturnValue(mockQuery);
```

### 4.3 注意事项
- 避免过度mock，只mock必要的依赖
- 确保mock返回符合实际数据结构
- 测试完成后使用`vi.clearAllMocks()`清理

## 5. 测试数据管理

### 5.1 测试数据工厂
使用工厂模式生成测试数据：

```typescript
// src/test-utils/factories/leadFactory.ts
export const createLead = (overrides = {}) => ({
  id: `lead-${Date.now()}`,
  name: 'Test Lead',
  phone: '13800138000',
  ...overrides
});
```

### 5.2 测试夹具
在`testFixtures.ts`中定义共享测试数据：

```typescript
export const mockUsers = [
  {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com'
  }
];
```

## 6. 测试覆盖率

### 6.1 覆盖率目标
- 行覆盖率：≥80%
- 函数覆盖率：≥75%
- 分支覆盖率：≥70%

### 6.2 运行覆盖率报告
```bash
# 运行测试并生成覆盖率报告
npm run test:coverage

# 查看HTML覆盖率报告
open coverage/index.html
```

### 6.3 覆盖率排除
在`vitest.config.ts`中配置：
- 类型定义文件：`**/*.d.ts`
- 配置文件：`**/*.config.*`
- 测试工具：`src/test-utils/**/*`

## 7. 测试运行命令

### 7.1 基本命令
```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test src/services/__tests__/users.client.test.ts

# 运行特定目录的测试
npm test src/features/leads/

# 交互式运行测试
npm run test:watch

# 运行覆盖率测试
npm run test:coverage
```

### 7.2 E2E测试
```bash
# 安装依赖
npx playwright install

# 运行E2E测试
npm run test:e2e

# 查看测试报告
npx playwright show-report
```

## 8. CI/CD集成

### 8.1 GitHub Actions
测试在每次push和PR时自动运行：
- 单元测试和组件测试：在`test.yml`中配置
- E2E测试：在`e2e.yml`中配置

### 8.2 测试结果通知
- 测试失败时通过GitHub PR检查通知
- 覆盖率报告集成到PR检查中

## 9. 最佳实践

### 9.1 测试原则
- **AAA模式**：Arrange（准备）、Act（执行）、Assert（断言）
- **单一职责**：每个测试只测试一个功能点
- **隔离性**：测试之间相互独立，不共享状态
- **可读性**：使用描述性的测试名称和断言

### 9.2 测试顺序
- 先编写核心功能的测试
- 覆盖正面和负面场景
- 测试边界条件
- 测试错误处理

### 9.3 性能优化
- 避免在测试中使用真实API调用
- 合理使用`beforeEach`和`afterEach`
- 优化JSDOM配置，禁用不必要的功能
- 使用并行测试提高执行效率

## 10. 常见问题与解决方案

### 10.1 Mock相关问题
- **问题**：Mock不生效
  **解决方案**：检查mock路径是否正确，确保mock在导入前设置

- **问题**：Mock返回值不符合预期
  **解决方案**：验证mock的返回数据结构与实际一致

### 10.2 组件测试问题
- **问题**：找不到DOM元素
  **解决方案**：使用getByRole、getByText等可访问性查询

- **问题**：状态更新不触发重新渲染
  **解决方案**：使用`await waitFor()`等待异步更新

### 10.3 服务测试问题
- **问题**：查询链方法不返回预期结果
  **解决方案**：确保mock的查询链方法正确返回this

## 11. 测试维护

- 定期运行测试，确保测试通过
- 当代码重构时，同步更新测试
- 移除不再需要的测试
- 补充缺失的测试用例
- 优化慢测试

## 12. 参考资源

- [Vitest文档](https://vitest.dev/)
- [React Testing Library文档](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright文档](https://playwright.dev/)
- [Testing Library最佳实践](https://testing-library.com/docs/queries/about/)

---

**最后更新时间**：2025-12-13
**维护团队**：开发团队