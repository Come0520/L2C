# 完善线索模块测试文件中的mock对象计划

## 问题分析

通过分析测试文件，发现当前mock对象存在以下主要问题：

1. **mock对象不完整**：缺少Drizzle ORM的链式API支持
2. **transaction内部mock对象为空**：transaction回调函数接收到的是空对象`{}`
3. **缺少必要的链式方法**：如`where`、`set`、`values`、`returning`等
4. **select方法模拟不正确**：应该返回可链式调用的对象，而非直接返回结果
5. **各测试文件mock实现不一致**：不同测试文件的mock实现差异较大

## 解决方案

创建统一的mock模板，完善所有测试文件中的mock对象，确保它们能正确模拟Drizzle ORM的链式API。

## 实施步骤

### 1. 创建统一的mock模板

设计一个完整的mock模板，包含Drizzle ORM的所有主要链式方法：

```javascript
vi.mock('@/shared/api/db', () => ({
  db: {
    query: {
      leads: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      users: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      // 其他可能需要的表
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'test-id' }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue({}),
    }),
    select: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        execute: vi.fn().mockResolvedValue([{ count: 0 }]),
      }),
    }),
    transaction: vi.fn().mockImplementation(async (callback) => callback({
      // 完整的transaction内部mock对象
      query: {
        leads: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        users: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
      },
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'test-id' }]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          execute: vi.fn().mockResolvedValue([{ count: 0 }]),
        }),
      }),
    })),
  },
}));
```

### 2. 更新所有测试文件

将以下测试文件中的mock对象替换为统一的模板：

1. `lead-boundary.test.tsx`
2. `lead-business-rules.test.tsx`
3. `lead-error-handling.test.tsx`
4. `lead-permissions.test.tsx`
5. 其他可能存在问题的测试文件

### 3. 确保各测试文件的mock对象适配

根据每个测试文件的具体需求，调整mock对象的返回值，确保测试能正确运行。

### 4. 测试验证

运行所有测试，验证mock对象的正确性：

```bash
pnpm test src/features/leads/__tests__/
```

## 预期结果

1. 所有测试文件中的mock对象能正确模拟Drizzle ORM的链式API
2. transaction内部的数据库操作能正确执行
3. 测试通过率显著提高
4. 各测试文件的mock实现保持一致

## 后续优化

1. 考虑创建一个共享的mock配置文件，供所有测试文件使用
2. 为不同的测试场景创建特定的mock辅助函数
3. 定期更新mock对象，以适应数据库schema的变化