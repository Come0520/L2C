# 开发指南 - 报价模块

> **文档版本**: v1.0  
> **创建日期**: 2026-01-16  
> **优先级**: P2 (开发参考)  
> **预估工时**: 1天  
> **依赖**: 所有技术设计文档

---

## 📋 概述

本文档为开发人员提供报价模块的开发指南,包括开发环境搭建、代码规范、调试技巧和常见问题解答。

---

## 🛠️ 开发环境搭建

### 前置要求

- Node.js >= 18.x
- pnpm >= 8.x
- PostgreSQL >= 14.x
- Git >= 2.x

### 安装依赖

```bash
# 克隆仓库
git clone https://github.com/your-org/l2c.git
cd l2c

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 数据库设置

```bash
# 启动PostgreSQL容器
docker-compose up -d postgres

# 运行数据库迁移
pnpm db:push

# 填充测试数据
pnpm db:seed
```

---

## 📁 项目结构

### 目录结构

```
src/features/quotes/
├── actions/                    # Server Actions
│   ├── mutations.ts
│   ├── queries.ts
│   ├── calc-actions.ts
│   ├── version-actions.ts
│   ├── item-mutations.ts
│   ├── room-mutations.ts
│   ├── bundle-mutations.ts
│   ├── convert-to-order.ts
│   └── schema.ts
├── calc-strategies/            # 计算策略
│   ├── base-strategy.ts
│   ├── strategy-factory.ts
│   ├── curtain-strategy.ts
│   ├── wallpaper-strategy.ts
│   ├── wallcloth-strategy.ts
│   └── attachment-strategy.ts
├── components/                 # React组件
│   ├── quote-list.tsx
│   ├── quote-detail.tsx
│   ├── quote-items-table.tsx
│   ├── quote-version-tabs.tsx
│   ├── quote-version-compare.tsx
│   ├── curtain-fabric-quote-form.tsx
│   ├── wallpaper-quote-form.tsx
│   └── ...
├── config/                    # 配置
│   └── quote-mode-config.ts
├── hooks/                     # React Hooks
│   ├── use-quote-config.ts
│   ├── use-quote-bundle.ts
│   └── use-category-quote-form.ts
├── logic/                     # 业务逻辑
│   ├── calculator.ts
│   ├── curtain-calc-engine.ts
│   ├── attachment-calc.ts
│   └── compare-utils.ts
├── services/                  # 服务层
│   └── quote.service.ts
├── types/                     # TypeScript类型
│   ├── index.ts
│   ├── quote-item-attributes.ts
│   ├── calculation-params.ts
│   ├── quote-mode-config.ts
│   └── quote-snapshot.ts
└── __tests__/                 # 测试
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## 🎨 代码规范

### 命名规范

#### 文件命名

```
# 组件文件: kebab-case
quote-list.tsx
quote-detail.tsx

# 工具文件: kebab-case
quote-utils.ts
calc-utils.ts

# 类型文件: kebab-case
quote-types.ts
calc-types.ts

# 测试文件: *.test.ts
quote-list.test.ts
calc-engine.test.ts
```

#### 变量命名

```typescript
// 常量: UPPER_SNAKE_CASE
const MAX_WIDTH = 1000;
const DEFAULT_FOLD_RATIO = 2.0;

// 变量: camelCase
const quoteId = 'uuid';
const totalAmount = 1000;

// 类名: PascalCase
class QuoteService {}
class CurtainStrategy {}

// 接口: PascalCase
interface QuoteConfig {}
interface CalculationResult {}

// 类型别名: PascalCase
type QuoteStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
```

#### 函数命名

```typescript
// 动词开头,驼峰命名
async function createQuote(data: QuoteData) {}
async function updateQuote(id: string, data: Partial<QuoteData>) {}
async function deleteQuote(id: string) {}
function calculateQuantity(input: CalcInput): CalcResult {}
function validateQuoteData(data: any): boolean {}
```

### 代码格式化

```typescript
// 使用2空格缩进
function example() {
  if (condition) {
    doSomething();
  }
}

// 对象属性换行
const config = {
  defaultMode: 'SIMPLE',
  simpleModeFields: [
    'field1',
    'field2',
  ],
  allowUserCustomization: true,
};

// 数组元素换行
const items = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
];
```

### TypeScript规范

```typescript
// 明确类型,避免any
function calculateQuote(data: QuoteData): QuoteResult {
  // ...
}

// 使用接口定义对象结构
interface QuoteData {
  customerId: string;
  items: QuoteItem[];
}

// 使用类型别名定义联合类型
type QuoteStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

// 使用泛型增强类型复用
function findQuote<T extends Quote>(quotes: T[], id: string): T | undefined {
  return quotes.find(q => q.id === id);
}
```

### React组件规范

```typescript
// 使用函数组件
export function QuoteList({ quotes }: Props) {
  // ...
}

// 使用TypeScript定义Props
interface Props {
  quotes: Quote[];
  onQuoteClick: (quote: Quote) => void;
}

// 使用Hooks管理状态
export function QuoteForm() {
  const [formData, setFormData] = useState<FormData>({});
  const { data, isLoading } = useQuoteConfig();
  
  // ...
}

// 使用memo优化性能
export const QuoteItem = React.memo(function QuoteItem({ item }: Props) {
  // ...
});
```

---

## 🧪 测试规范

### 单元测试

```typescript
// 使用describe分组测试
describe('CurtainStrategy', () => {
  // 使用it定义测试用例
  it('应该正确计算定高面料用量', () => {
    // Arrange
    const strategy = new CurtainStrategy();
    const input = { /* ... */ };

    // Act
    const result = strategy.calculate(input);

    // Assert
    expect(result.quantity).toBe(4.2);
    expect(result.subtotal).toBe(420);
  });

  // 使用beforeEach/afterEach清理状态
  beforeEach(() => {
    // 初始化测试数据
  });

  afterEach(() => {
    // 清理测试数据
  });
});
```

### 集成测试

```typescript
// 使用真实数据库连接
describe('Quote CRUD Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it('应该成功创建报价单', async () => {
    const result = await createQuote({
      customerId: 'customer-id',
      title: 'Test Quote',
    });

    expect(result.success).toBe(true);
    expect(result.data.quote).toBeDefined();
  });
});
```

### E2E测试

```typescript
// 使用Playwright
test.describe('Quote Lifecycle E2E Tests', () => {
  test('完整报价单生命周期', async ({ page }) => {
    // 导航到页面
    await page.goto('/quotes/new');

    // 填写表单
    await page.fill('[name="customerName"]', 'John Doe');
    await page.fill('[name="title"]', 'Test Quote');

    // 提交表单
    await page.click('button[type="submit"]');

    // 验证结果
    await expect(page).toHaveURL(/\/quotes\/[a-f0-9-]+/);
    await expect(page.locator('text="Test Quote"')).toBeVisible();
  });
});
```

---

## 🐛 调试技巧

### Server Actions调试

```typescript
// 使用console.log调试
export async function createQuote(data: any) {
  console.log('Creating quote with data:', data);
  
  const result = await db.insert(quotes).values(data).returning();
  
  console.log('Quote created:', result);
  
  return result;
}

// 使用debugger断点
export async function createQuote(data: any) {
  debugger; // 浏览器会在此处暂停
  
  const result = await db.insert(quotes).values(data).returning();
  
  return result;
}
```

### React组件调试

```typescript
// 使用React DevTools
export function QuoteList({ quotes }: Props) {
  console.log('QuoteList rendered with quotes:', quotes);
  
  return (
    <div>
      {quotes.map(quote => (
        <QuoteItem key={quote.id} quote={quote} />
      ))}
    </div>
  );
}

// 使用useEffect调试依赖
export function QuoteDetail({ quoteId }: Props) {
  const [quote, setQuote] = useState<Quote | null>(null);
  
  useEffect(() => {
    console.log('quoteId changed:', quoteId);
    fetchQuote(quoteId).then(setQuote);
  }, [quoteId]);
  
  // ...
}
```

### 数据库查询调试

```typescript
// 使用Drizzle的日志功能
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const db = drizzle(pool, {
  schema,
  logger: {
    logQuery(query, params) {
      console.log('Query:', query);
      console.log('Params:', params);
    },
  },
});

// 使用EXPLAIN分析查询
const result = await db.execute(
  sql`EXPLAIN ANALYZE SELECT * FROM quotes WHERE id = ${quoteId}`
);
console.log('Query plan:', result);
```

---

## ❓ 常见问题

### Q1: 如何添加新的计算策略?

**A**: 按照以下步骤操作:

1. 创建新的策略类,继承 `BaseCalcStrategy`
2. 实现 `calculate` 方法
3. 在 `StrategyFactory` 中注册新策略
4. 编写单元测试

```typescript
// 1. 创建策略类
export class NewStrategy extends BaseCalcStrategy<NewInput, NewResult> {
  calculate(input: NewInput): NewResult {
    // 实现计算逻辑
  }
}

// 2. 注册策略
export class CalculationStrategyFactory {
  static create(category: string): BaseCalcStrategy<any, any> {
    switch (category) {
      case 'NEW_CATEGORY':
        return new NewStrategy();
      // ...
    }
  }
}

// 3. 编写测试
describe('NewStrategy', () => {
  it('应该正确计算', () => {
    // ...
  });
});
```

### Q2: 如何添加新的报价字段?

**A**: 按照以下步骤操作:

1. 在类型定义文件中添加字段定义
2. 在配置文件中添加字段到相应模式
3. 在表单组件中添加字段输入
4. 更新数据库Schema(如果需要)

```typescript
// 1. 添加字段定义
interface CurtainAttributes {
  // 现有字段...
  newField: string;
}

// 2. 更新配置
export const SYSTEM_DEFAULT_QUOTE_CONFIG: TenantQuoteModeConfig = {
  simpleModeFields: [
    // 现有字段...
    'newField',
  ],
  // ...
};

// 3. 添加表单字段
export function CurtainFabricQuoteForm() {
  return (
    <form>
      <input name="newField" />
    </form>
  );
}
```

### Q3: 如何处理版本管理的并发问题?

**A**: 使用数据库事务和唯一约束:

```typescript
export async function setActiveVersion(quoteId: string) {
  return await db.transaction(async (tx) => {
    // 查询当前ACTIVE版本
    const currentActive = await tx.query.quotes.findFirst({
      where: and(
        eq(quotes.quoteNo, quoteNo),
        eq(quotes.isActive, true)
      ),
    });

    // 降级当前ACTIVE版本
    if (currentActive && currentActive.id !== quoteId) {
      await tx.update(quotes)
        .set({ isActive: false })
        .where(eq(quotes.id, currentActive.id));
    }

    // 激活目标版本
    await tx.update(quotes)
      .set({ isActive: true })
      .where(eq(quotes.id, quoteId));
  });
}
```

### Q4: 如何优化计算引擎性能?

**A**: 使用以下优化策略:

1. 缓存计算结果
2. 批量计算
3. 使用Web Worker

```typescript
// 1. 缓存计算结果
const calcCache = new Map<string, CalcResult>();

function calculateWithCache(input: CalcInput): CalcResult {
  const cacheKey = JSON.stringify(input);
  
  if (calcCache.has(cacheKey)) {
    return calcCache.get(cacheKey)!;
  }
  
  const result = strategy.calculate(input);
  calcCache.set(cacheKey, result);
  
  return result;
}

// 2. 批量计算
async function batchCalculate(inputs: CalcInput[]): Promise<CalcResult[]> {
  return Promise.all(inputs.map(input => strategy.calculate(input)));
}

// 3. 使用Web Worker
const worker = new Worker('calc-worker.js');

worker.postMessage({ inputs });

worker.onmessage = (e) => {
  const results = e.data;
  // 处理结果
};
```

### Q5: 如何调试计算引擎的错误?

**A**: 使用以下调试技巧:

1. 添加详细的日志
2. 使用单元测试隔离问题
3. 使用断点调试

```typescript
// 1. 添加详细日志
function calculate(input: CalcInput): CalcResult {
  console.log('Input:', input);
  console.log('Step 1: Calculate finished dimensions');
  const finishedWidth = input.measuredWidth * input.foldRatio;
  console.log('Finished width:', finishedWidth);
  // ...
}

// 2. 使用单元测试
it('应该正确计算', () => {
  const input = { /* ... */ };
  const result = strategy.calculate(input);
  
  console.log('Result:', result);
  
  expect(result.quantity).toBe(expected);
});

// 3. 使用断点
function calculate(input: CalcInput): CalcResult {
  debugger; // 在此处暂停
  
  const finishedWidth = input.measuredWidth * input.foldRatio;
  // ...
}
```

---

## 📚 学习资源

### 官方文档

- [Next.js文档](https://nextjs.org/docs)
- [React文档](https://react.dev)
- [TypeScript文档](https://www.typescriptlang.org/docs)
- [Drizzle ORM文档](https://orm.drizzle.team/docs/overview)
- [Vitest文档](https://vitest.dev)
- [Playwright文档](https://playwright.dev)

### 相关技术文档

- [数据库迁移计划](./database-migration-plan.md)
- [TypeScript类型定义](./typescript-type-definitions.md)
- [计算引擎技术设计](./quote-calculation-engine.md)
- [版本管理技术设计](./quote-version-management.md)
- [报价模式配置技术设计](./quote-mode-configuration.md)
- [API接口文档](./api-documentation.md)
- [测试计划](./test-plan.md)

---

## 🤝 贡献指南

### 提交代码

1. 创建功能分支
2. 编写代码和测试
3. 运行测试和类型检查
4. 提交Pull Request

```bash
# 创建功能分支
git checkout -b feature/quote-mode-config

# 编写代码和测试
# ...

# 运行测试
pnpm test

# 运行类型检查
pnpm type-check

# 提交代码
git add .
git commit -m "feat: add quote mode configuration"
git push origin feature/quote-mode-config
```

### 代码审查清单

- [ ] 代码符合规范
- [ ] 有完整的测试覆盖
- [ ] TypeScript类型检查通过
- [ ] 有适当的注释
- [ ] 更新了相关文档

---

## ✅ 快速开始

### 创建新的报价项类型

```bash
# 1. 创建类型定义文件
touch src/features/quotes/types/new-item-attributes.ts

# 2. 创建计算策略
touch src/features/quotes/calc-strategies/new-strategy.ts

# 3. 注册策略
# 编辑 src/features/quotes/calc-strategies/strategy-factory.ts

# 4. 编写测试
touch src/features/quotes/__tests__/unit/calculation/new-strategy.test.ts

# 5. 运行测试
pnpm test new-strategy
```

### 添加新的API端点

```bash
# 1. 创建API路由文件
touch src/app/api/quotes/new-endpoint/route.ts

# 2. 实现Server Action
touch src/features/quotes/actions/new-action.ts

# 3. 添加类型定义
# 编辑 src/features/quotes/types/index.ts

# 4. 编写测试
touch src/features/quotes/__tests__/integration/api/new-endpoint.test.ts

# 5. 运行测试
pnpm test new-endpoint
```

---

## 🔗 相关文档

- [报价模块需求文档](../02-requirements/modules/报价单/报价单.md)
- [报价模块审计报告](../02-requirements/modules/报价单/quote-module-audit-20260116.md)
- [整改计划](../整改计划.md)

---

**最后更新**: 2026-01-16  
**维护者**: 开发团队
