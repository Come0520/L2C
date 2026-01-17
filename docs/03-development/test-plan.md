# 测试计划文档 - 报价模块

> **文档版本**: v1.0  
> **创建日期**: 2026-01-16  
> **优先级**: P1 (质量保证)  
> **预估工时**: 2周  
> **依赖**: 所有技术设计文档

---

## 📋 概述

本文档定义报价模块的测试策略,包括单元测试、集成测试和E2E测试的覆盖范围、测试用例和验收标准。

---

## 🎯 测试目标

### 核心目标

1. **功能完整性**: 确保所有需求功能正确实现
2. **计算准确性**: 计算引擎结果与手工计算一致(误差<1%)
3. **数据一致性**: 版本管理、快照机制保证数据一致性
4. **性能达标**: 响应时间满足性能要求
5. **代码质量**: 单元测试覆盖率>80%(计算引擎100%)

---

## 🧪 测试分层

### 测试金字塔

```
         ┌─────────┐
         │   E2E   │  10% (端到端测试)
         │  Tests   │
         └────┬────┘
              │
         ┌────▼────┐
         │Integration│  30% (集成测试)
         │  Tests   │
         └────┬────┘
              │
         ┌────▼────┐
         │  Unit    │  60% (单元测试)
         │  Tests   │
         └─────────┘
```

### 测试类型说明

| 测试类型 | 覆盖范围 | 执行频率 | 执行时间 |
|----------|------------|----------|----------|
| **单元测试** | 函数、类、组件 | 每次提交 | <5分钟 |
| **集成测试** | API、数据库交互 | 每次提交 | <15分钟 |
| **E2E测试** | 完整业务流程 | 每日/每次发布 | <30分钟 |

---

## 📊 单元测试

### 测试框架

- **测试框架**: Vitest
- **断言库**: Vitest内置
- **Mock库**: vi.fn()
- **覆盖率工具**: Vitest Coverage

### 覆盖率要求

| 模块 | 覆盖率要求 | 说明 |
|------|------------|------|
| 计算引擎 | 100% | 核心计算逻辑 |
| 版本管理 | 90% | 状态机逻辑 |
| 配置管理 | 80% | 配置合并逻辑 |
| API Actions | 80% | Server Actions |
| 工具函数 | 90% | 通用工具 |
| 组件 | 70% | React组件 |

### 测试文件结构

```
src/features/quotes/__tests__/
├── unit/
│   ├── calculation/
│   │   ├── curtain-calc-engine.test.ts
│   │   ├── wallpaper-strategy.test.ts
│   │   ├── wallcloth-strategy.test.ts
│   │   └── attachment-calc.test.ts
│   ├── version/
│   │   ├── version-management.test.ts
│   │   └── version-state-machine.test.ts
│   ├── config/
│   │   ├── quote-config-merge.test.ts
│   │   └── quote-config-validation.test.ts
│   ├── api/
│   │   ├── quote-mutations.test.ts
│   │   ├── item-mutations.test.ts
│   │   └── room-mutations.test.ts
│   └── utils/
│       ├── quote-utils.test.ts
│       └── calculation-utils.test.ts
└── integration/
    ├── quote-crud.test.ts
    ├── version-workflow.test.ts
    └── calculation-workflow.test.ts
```

### 计算引擎测试用例

#### 窗帘计算引擎测试

```typescript
// src/features/quotes/__tests__/unit/calculation/curtain-calc-engine.test.ts

import { describe, it, expect } from 'vitest';
import { CurtainStrategy } from '../../../calc-strategies/curtain-strategy';

describe('CurtainStrategy - 定高面料计算', () => {
  const strategy = new CurtainStrategy();

  describe('单开窗帘', () => {
    it('应该正确计算成品尺寸', () => {
      const input = {
        measuredWidth: 150,
        measuredHeight: 250,
        foldRatio: 2.0,
        groundClearance: 2,
        headerProcessType: 'WRAPPED' as const,
        fabricDirection: 'HEIGHT' as const,
        fabricSize: 280,
        openingStyle: 'SINGLE' as const,
        unitPrice: 100,
      };

      const result = strategy.calculate(input);

      expect(result.finishedWidth).toBe(300); // 150 × 2.0
      expect(result.finishedHeight).toBe(248); // 250 - 2
    });

    it('应该正确计算裁剪尺寸', () => {
      const input = {
        measuredWidth: 150,
        measuredHeight: 250,
        foldRatio: 2.0,
        groundClearance: 2,
        headerProcessType: 'WRAPPED' as const,
        fabricDirection: 'HEIGHT' as const,
        fabricSize: 280,
        openingStyle: 'SINGLE' as const,
        unitPrice: 100,
      };

      const result = strategy.calculate(input);

      expect(result.cutWidth).toBe(310); // 300 + 5×2×1
      expect(result.cutHeight).toBe(278); // 248 + 20 + 10
    });

    it('应该正确计算用量和金额', () => {
      const input = {
        measuredWidth: 150,
        measuredHeight: 250,
        foldRatio: 2.0,
        groundClearance: 2,
        headerProcessType: 'WRAPPED' as const,
        fabricDirection: 'HEIGHT' as const,
        fabricSize: 280,
        openingStyle: 'SINGLE' as const,
        unitPrice: 100,
      };

      const result = strategy.calculate(input);

      expect(result.quantity).toBe(3.1); // ⌈310/100⌉×10/10
      expect(result.subtotal).toBe(310);
      expect(result.panelCount).toBe(1);
    });
  });

  describe('对开窗帘', () => {
    it('应该正确计算裁剪宽度', () => {
      const input = {
        measuredWidth: 200,
        measuredHeight: 250,
        foldRatio: 2.0,
        groundClearance: 2,
        headerProcessType: 'WRAPPED' as const,
        fabricDirection: 'HEIGHT' as const,
        fabricSize: 280,
        openingStyle: 'DOUBLE' as const,
        unitPrice: 100,
      };

      const result = strategy.calculate(input);

      expect(result.cutWidth).toBe(420); // 400 + 5×2×2
    });
  });

  describe('定宽面料', () => {
    it('应该正确计算片数', () => {
      const input = {
        measuredWidth: 200,
        measuredHeight: 250,
        foldRatio: 2.0,
        groundClearance: 2,
        headerProcessType: 'WRAPPED' as const,
        fabricDirection: 'WIDTH' as const,
        fabricSize: 140,
        openingStyle: 'DOUBLE' as const,
        unitPrice: 100,
      };

      const result = strategy.calculate(input);

      expect(result.panelCount).toBe(3); // ⌈420/140⌉
    });

    it('应该正确计算用量', () => {
      const input = {
        measuredWidth: 200,
        measuredHeight: 250,
        foldRatio: 2.0,
        groundClearance: 2,
        headerProcessType: 'WRAPPED' as const,
        fabricDirection: 'WIDTH' as const,
        fabricSize: 140,
        openingStyle: 'DOUBLE' as const,
        unitPrice: 100,
      };

      const result = strategy.calculate(input);

      expect(result.quantity).toBeCloseTo(8.34, 1); // 3 × 278 / 100
    });
  });

  describe('预警逻辑', () => {
    it('应该在高度过高时触发预警', () => {
      const input = {
        measuredWidth: 200,
        measuredHeight: 300,
        foldRatio: 2.0,
        groundClearance: 2,
        headerProcessType: 'WRAPPED' as const,
        fabricDirection: 'HEIGHT' as const,
        fabricSize: 280,
        openingStyle: 'DOUBLE' as const,
        unitPrice: 100,
      };

      const result = strategy.calculate(input);

      expect(result.warnings).toContainEqual({
        type: 'HEIGHT_TOO_HIGH',
        message: expect.stringContaining('超过275cm'),
      });
    });

    it('应该在高度过低时触发预警', () => {
      const input = {
        measuredWidth: 200,
        measuredHeight: 10,
        foldRatio: 2.0,
        groundClearance: 2,
        headerProcessType: 'WRAPPED' as const,
        fabricDirection: 'HEIGHT' as const,
        fabricSize: 280,
        openingStyle: 'DOUBLE' as const,
        unitPrice: 100,
      };

      const result = strategy.calculate(input);

      expect(result.warnings).toContainEqual({
        type: 'HEIGHT_TOO_LOW',
        message: expect.stringContaining('过小'),
      });
    });

    it('应该在宽度过宽时触发预警', () => {
      const input = {
        measuredWidth: 400,
        measuredHeight: 250,
        foldRatio: 2.0,
        groundClearance: 2,
        headerProcessType: 'WRAPPED' as const,
        fabricDirection: 'HEIGHT' as const,
        fabricSize: 280,
        openingStyle: 'DOUBLE' as const,
        unitPrice: 100,
      };

      const result = strategy.calculate(input);

      expect(result.warnings).toContainEqual({
        type: 'WIDTH_TOO_WIDE',
        message: expect.stringContaining('过宽'),
      });
    });
  });

  describe('边界条件', () => {
    it('应该处理最小宽度', () => {
      const input = {
        measuredWidth: 10,
        measuredHeight: 250,
        foldRatio: 2.0,
        groundClearance: 2,
        headerProcessType: 'WRAPPED' as const,
        fabricDirection: 'HEIGHT' as const,
        fabricSize: 280,
        openingStyle: 'SINGLE' as const,
        unitPrice: 100,
      };

      const result = strategy.calculate(input);

      expect(result.quantity).toBeGreaterThan(0);
    });

    it('应该处理最大宽度', () => {
      const input = {
        measuredWidth: 1000,
        measuredHeight: 250,
        foldRatio: 2.0,
        groundClearance: 2,
        headerProcessType: 'WRAPPED' as const,
        fabricDirection: 'HEIGHT' as const,
        fabricSize: 280,
        openingStyle: 'DOUBLE' as const,
        unitPrice: 100,
      };

      const result = strategy.calculate(input);

      expect(result.quantity).toBeGreaterThan(0);
    });

    it('应该处理最小褶皱倍数', () => {
      const input = {
        measuredWidth: 200,
        measuredHeight: 250,
        foldRatio: 1.5,
        groundClearance: 2,
        headerProcessType: 'WRAPPED' as const,
        fabricDirection: 'HEIGHT' as const,
        fabricSize: 280,
        openingStyle: 'DOUBLE' as const,
        unitPrice: 100,
      };

      const result = strategy.calculate(input);

      expect(result.quantity).toBeGreaterThan(0);
    });

    it('应该处理最大褶皱倍数', () => {
      const input = {
        measuredWidth: 200,
        measuredHeight: 250,
        foldRatio: 3.5,
        groundClearance: 2,
        headerProcessType: 'WRAPPED' as const,
        fabricDirection: 'HEIGHT' as const,
        fabricSize: 280,
        openingStyle: 'DOUBLE' as const,
        unitPrice: 100,
      };

      const result = strategy.calculate(input);

      expect(result.quantity).toBeGreaterThan(0);
    });
  });

  describe('错误处理', () => {
    it('应该在宽度<=0时抛出错误', () => {
      const input = {
        measuredWidth: 0,
        measuredHeight: 250,
        foldRatio: 2.0,
        groundClearance: 2,
        headerProcessType: 'WRAPPED' as const,
        fabricDirection: 'HEIGHT' as const,
        fabricSize: 280,
        openingStyle: 'DOUBLE' as const,
        unitPrice: 100,
      };

      expect(() => strategy.calculate(input)).toThrow('测量宽度必须大于0');
    });

    it('应该在高度<=0时抛出错误', () => {
      const input = {
        measuredWidth: 200,
        measuredHeight: 0,
        foldRatio: 2.0,
        groundClearance: 2,
        headerProcessType: 'WRAPPED' as const,
        fabricDirection: 'HEIGHT' as const,
        fabricSize: 280,
        openingStyle: 'DOUBLE' as const,
        unitPrice: 100,
      };

      expect(() => strategy.calculate(input)).toThrow('测量高度必须大于0');
    });

    it('应该在褶皱倍数超出范围时抛出错误', () => {
      const input = {
        measuredWidth: 200,
        measuredHeight: 250,
        foldRatio: 4.0,
        groundClearance: 2,
        headerProcessType: 'WRAPPED' as const,
        fabricDirection: 'HEIGHT' as const,
        fabricSize: 280,
        openingStyle: 'DOUBLE' as const,
        unitPrice: 100,
      };

      expect(() => strategy.calculate(input)).toThrow('褶皱倍数必须在1.5-3.5之间');
    });
  });
});
```

#### 墙纸计算引擎测试

```typescript
// src/features/quotes/__tests__/unit/calculation/wallpaper-strategy.test.ts

import { describe, it, expect } from 'vitest';
import { WallpaperStrategy } from '../../../calc-strategies/wallpaper-strategy';

describe('WallpaperStrategy - 墙纸计算', () => {
  const strategy = new WallpaperStrategy();

  describe('无对花计算', () => {
    it('应该正确计算条数', () => {
      const params = {
        width: 400,
        height: 260,
        fabricWidth: 53,
        unitPrice: 50,
        rollLength: 10,
        patternRepeat: 0,
      };

      const result = strategy.calculate(params);

      expect(result.details?.totalStrips).toBe(8); // ⌈(400+20)/53⌉
    });

    it('应该正确计算单条高度', () => {
      const params = {
        width: 400,
        height: 260,
        fabricWidth: 53,
        unitPrice: 50,
        rollLength: 10,
        patternRepeat: 0,
      };

      const result = strategy.calculate(params);

      expect(result.details?.effectiveHeightCm).toBe(280); // 260+10+10
    });

    it('应该正确计算卷数', () => {
      const params = {
        width: 400,
        height: 260,
        fabricWidth: 53,
        unitPrice: 50,
        rollLength: 10,
        patternRepeat: 0,
      };

      const result = strategy.calculate(params);

      expect(result.details?.stripHeight).toBe(280);
      expect(result.usage).toBe(3); // ⌈8/⌊10/2.8⌋⌉
      expect(result.subtotal).toBe(150);
    });
  });

  describe('有对花计算', () => {
    it('应该正确计算对花高度', () => {
      const params = {
        width: 400,
        height: 260,
        fabricWidth: 53,
        unitPrice: 50,
        rollLength: 10,
        patternRepeat: 64,
      };

      const result = strategy.calculate(params);

      expect(result.details?.effectiveHeightCm).toBe(320); // ⌈280/64⌉×64
    });

    it('应该正确计算对花卷数', () => {
      const params = {
        width: 400,
        height: 260,
        fabricWidth: 53,
        unitPrice: 50,
        rollLength: 10,
        patternRepeat: 64,
      };

      const result = strategy.calculate(params);

      expect(result.usage).toBe(4); // ⌈8/⌊10/3.2⌋⌉
      expect(result.subtotal).toBe(200);
    });
  });

  describe('多段墙面', () => {
    it('应该正确计算多段墙面总条数', () => {
      const params = {
        height: 260,
        fabricWidth: 53,
        unitPrice: 50,
        rollLength: 10,
        patternRepeat: 0,
        wallSegments: [
          { width: 200 },
          { width: 300 },
          { width: 150 },
        ],
      };

      const result = strategy.calculate(params);

      expect(result.details?.totalStrips).toBe(13); // ⌈220/53⌉+⌈320/53⌉+⌈170/53⌉
    });

    it('应该正确计算每段墙面的条数', () => {
      const params = {
        height: 260,
        fabricWidth: 53,
        unitPrice: 50,
        rollLength: 10,
        patternRepeat: 0,
        wallSegments: [
          { width: 200 },
          { width: 300 },
          { width: 150 },
        ],
      };

      const result = strategy.calculate(params);

      expect(result.details?.wallSegments).toEqual([
        { width: 200, strips: 5 },
        { width: 300, strips: 7 },
        { width: 150, strips: 4 },
      ]);
    });
  });
});
```

### 版本管理测试用例

```typescript
// src/features/quotes/__tests__/unit/version/version-management.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { QuoteService } from '../../../services/quote.service';

describe('Quote Version Management', () => {
  let quoteId: string;

  beforeEach(async () => {
    const quote = await createTestQuote();
    quoteId = quote.id;
  });

  describe('createNextVersion', () => {
    it('应该创建新版本并递增版本号', async () => {
      const newVersion = await QuoteService.createNextVersion(
        quoteId,
        'user-id',
        'tenant-id'
      );

      expect(newVersion.version).toBe(2);
      expect(newVersion.isActive).toBe(true);
      expect(newVersion.parentQuoteId).toBe(quoteId);
    });

    it('应该降级原版本', async () => {
      await QuoteService.createNextVersion(quoteId, 'user-id', 'tenant-id');

      const originalQuote = await db.query.quotes.findFirst({
        where: eq(quotes.id, quoteId),
      });

      expect(originalQuote?.isActive).toBe(false);
    });

    it('应该深度克隆items和rooms', async () => {
      await addTestItems(quoteId);
      await addTestRooms(quoteId);

      const newVersion = await QuoteService.createNextVersion(
        quoteId,
        'user-id',
        'tenant-id'
      );

      const newItems = await db.query.quoteItems.findMany({
        where: eq(quoteItems.quoteId, newVersion.id),
      });

      const newRooms = await db.query.quoteRooms.findMany({
        where: eq(quoteRooms.quoteId, newVersion.id),
      });

      expect(newItems.length).toBeGreaterThan(0);
      expect(newRooms.length).toBeGreaterThan(0);
    });

    it('应该保持附件项的父子关系', async () => {
      await addTestItemsWithAttachments(quoteId);

      const newVersion = await QuoteService.createNextVersion(
        quoteId,
        'user-id',
        'tenant-id'
      );

      const newItems = await db.query.quoteItems.findMany({
        where: eq(quoteItems.quoteId, newVersion.id),
      });

      const attachments = newItems.filter(item => item.parentId);
      const parents = newItems.filter(item => !item.parentId);

      expect(attachments.length).toBeGreaterThan(0);
      expect(parents.length).toBeGreaterThan(0);

      // 验证附件的parentId指向正确的父项
      for (const attachment of attachments) {
        const parent = parents.find(p => p.id === attachment.parentId);
        expect(parent).toBeDefined();
      }
    });
  });

  describe('setActiveVersion', () => {
    it('应该激活目标版本并降级原ACTIVE版本', async () => {
      const v2 = await QuoteService.createNextVersion(quoteId, 'user-id', 'tenant-id');
      const v3 = await QuoteService.createNextVersion(v2.id, 'user-id', 'tenant-id');

      const activated = await QuoteService.setActiveVersion(v2.id);

      expect(activated.isActive).toBe(true);

      const v3After = await db.query.quotes.findFirst({
        where: eq(quotes.id, v3.id),
      });

      expect(v3After?.isActive).toBe(false);
    });

    it('应该在同一事务中完成降级和激活', async () => {
      const v2 = await QuoteService.createNextVersion(quoteId, 'user-id', 'tenant-id');

      // 模拟并发激活
      const [result1, result2] = await Promise.all([
        QuoteService.setActiveVersion(quoteId),
        QuoteService.setActiveVersion(v2.id),
      ]);

      // 应该只有一个版本是ACTIVE
      const activeQuotes = await db.query.quotes.findMany({
        where: eq(quotes.isActive, true),
      });

      expect(activeQuotes.length).toBe(1);
    });
  });

  describe('archiveVersion', () => {
    it('应该归档版本', async () => {
      const archived = await QuoteService.archiveVersion(quoteId);

      expect(archived.status).toBe('ARCHIVED');
      expect(archived.isActive).toBe(false);
    });

    it('归档ACTIVE版本时应自动降级', async () => {
      const v2 = await QuoteService.createNextVersion(quoteId, 'user-id', 'tenant-id');

      const archived = await QuoteService.archiveVersion(v2.id);

      expect(archived.status).toBe('ARCHIVED');
      expect(archived.isActive).toBe(false);

      const v1After = await db.query.quotes.findFirst({
        where: eq(quotes.id, quoteId),
      });

      expect(v1After?.isActive).toBe(true);
    });
  });
});
```

---

## 🔄 集成测试

### 测试框架

- **测试框架**: Vitest
- **数据库**: Testcontainers (PostgreSQL)
- **Mock库**: vi.fn()

### 测试用例

```typescript
// src/features/quotes/__tests__/integration/quote-crud.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestDB, teardownTestDB } from '../../../test-utils/db';
import { createQuote, updateQuote, deleteQuote, getQuote } from '../../../actions/quote-mutations';

describe('Quote CRUD Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('Create Quote', () => {
    it('应该成功创建报价单', async () => {
      const data = {
        customerId: 'customer-id',
        title: 'Test Quote',
        notes: 'Test notes',
      };

      const result = await createQuote(data);

      expect(result.success).toBe(true);
      expect(result.data.quote).toBeDefined();
      expect(result.data.quote.quoteNo).toMatch(/^Q\d{8}-\d{3}$/);
      expect(result.data.quote.status).toBe('DRAFT');
      expect(result.data.quote.isActive).toBe(true);
      expect(result.data.quote.version).toBe(1);
    });

    it('应该验证必填字段', async () => {
      const data = {
        title: 'Test Quote',
      };

      const result = await createQuote(data);

      expect(result.success).toBe(false);
      expect(result.error).toContain('customerId');
    });
  });

  describe('Update Quote', () => {
    it('应该成功更新报价单', async () => {
      const quote = await createQuote({
        customerId: 'customer-id',
        title: 'Test Quote',
      });

      const result = await updateQuote(quote.data.quote.id, {
        title: 'Updated Quote',
        notes: 'Updated notes',
      });

      expect(result.success).toBe(true);
      expect(result.data.quote.title).toBe('Updated Quote');
      expect(result.data.quote.notes).toBe('Updated notes');
    });

    it('应该阻止编辑ACTIVE版本', async () => {
      const quote = await createQuote({
        customerId: 'customer-id',
        title: 'Test Quote',
      });

      const result = await updateQuote(quote.data.quote.id, {
        title: 'Updated Quote',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot edit ACTIVE version');
    });
  });

  describe('Delete Quote', () => {
    it('应该成功删除报价单', async () => {
      const quote = await createQuote({
        customerId: 'customer-id',
        title: 'Test Quote',
      });

      const result = await deleteQuote(quote.data.quote.id);

      expect(result.success).toBe(true);

      const deletedQuote = await getQuote(quote.data.quote.id);
      expect(deletedQuote).toBeNull();
    });
  });
});
```

---

## 🌐 E2E测试

### 测试框架

- **测试框架**: Playwright
- **浏览器**: Chromium, Firefox, WebKit
- **测试数据**: Seed脚本

### 测试用例

```typescript
// e2e/flows/quote-lifecycle.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Quote Lifecycle E2E Tests', () => {
  test('完整报价单生命周期', async ({ page }) => {
    // 步骤1: 登录
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // 步骤2: 创建报价单
    await page.click('a:has-text("Quotes")');
    await page.click('button:has-text("New Quote")');
    await page.fill('[name="customerName"]', 'John Doe');
    await page.fill('[name="title"]', 'Living Room Curtains');
    await page.click('button:has-text("Create")');
    await expect(page).toHaveURL(/\/quotes\/[a-f0-9-]+/);

    // 步骤3: 添加空间
    await page.click('button:has-text("Add Room")');
    await page.fill('[name="roomName"]', 'Living Room');
    await page.click('button:has-text("Save")');
    await expect(page.locator('text="Living Room"')).toBeVisible();

    // 步骤4: 添加报价项
    await page.click('button:has-text("Add Item")');
    await page.selectOption('[name="category"]', 'CURTAIN_FABRIC');
    await page.fill('[name="productName"]', 'Premium Velvet');
    await page.fill('[name="width"]', '200');
    await page.fill('[name="height"]', '250');
    await page.fill('[name="unitPrice"]', '100');
    await page.click('button:has-text("Calculate")');
    await expect(page.locator('text="4.20"')).toBeVisible();
    await page.click('button:has-text("Save")');
    await expect(page.locator('text="Premium Velvet"')).toBeVisible();

    // 步骤5: 验证总金额
    const totalAmount = await page.locator('[data-testid="total-amount"]').textContent();
    expect(totalAmount).toBe('¥420.00');

    // 步骤6: 创建新版本
    await page.click('button:has-text("Create Version")');
    await expect(page.locator('text="Version 2"')).toBeVisible();

    // 步骤7: 切换到版本1
    await page.click('button:has-text("Version 1")');
    await expect(page.locator('button:has-text("Add Item")')).toBeDisabled();

    // 步骤8: 切换到版本2
    await page.click('button:has-text("Version 2")');
    await expect(page.locator('button:has-text("Add Item")')).toBeEnabled();

    // 步骤9: 转订单
    await page.click('button:has-text("Convert to Order")');
    await page.fill('[name="deliveryAddress"]', '123 Main St, City, State 12345');
    await page.selectOption('[name="settlementType"]', 'CASH');
    await page.fill('[name="paymentAmount"]', '210');
    await page.selectOption('[name="paymentMethod"]', 'CASH');
    await page.click('button:has-text("Confirm")');
    await expect(page).toHaveURL(/\/orders\/[a-f0-9-]+/);

    // 步骤10: 验证订单数据
    await expect(page.locator('text="ORD-"')).toBeVisible();
    await expect(page.locator('text="¥420.00"')).toBeVisible();
  });

  test('报价模式切换', async ({ page }) => {
    await page.goto('/quotes/new');

    // 验证默认为快速模式
    await expect(page.locator('text="Quick Quote"')).toBeVisible();
    await expect(page.locator('[name="installPosition"]')).toBeHidden();

    // 切换到高级模式
    await page.click('button:has-text("Advanced ▼")');
    await expect(page.locator('text="Advanced Quote"')).toBeVisible();
    await expect(page.locator('[name="installPosition"]')).toBeVisible();

    // 填写数据
    await page.fill('[name="width"]', '200');
    await page.fill('[name="height"]', '250');
    await page.fill('[name="installPosition"]', 'CURTAIN_BOX');

    // 切换回快速模式
    await page.click('button:has-text("Simple ▲")');
    await expect(page.locator('text="Quick Quote"')).toBeVisible();
    await expect(page.locator('[name="installPosition"]')).toBeHidden();

    // 验证数据保留
    await expect(page.locator('[name="width"]')).toHaveValue('200');
    await expect(page.locator('[name="height"]')).toHaveValue('250');
  });
});
```

---

## 📊 性能测试

### 测试工具

- **负载测试**: k6
- **性能监控**: Lighthouse
- **数据库监控**: pg_stat_statements

### 性能指标

| 指标 | 目标值 | 测试方法 |
|--------|---------|----------|
| 报价单加载时间 | <2s (100+行) | Lighthouse |
| 计算响应时间 | <500ms | k6 |
| 商品联想搜索 | <300ms | k6 |
| 版本切换响应 | <100ms | k6 |
| 配置获取响应 | <300ms | k6 |
| API响应时间(P95) | <500ms | k6 |
| 数据库查询时间(P95) | <100ms | pg_stat_statements |

### 性能测试脚本

```javascript
// performance/load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },  // 1分钟内增加到10用户
    { duration: '2m', target: 50 },  // 2分钟内增加到50用户
    { duration: '1m', target: 10 },  // 1分钟内减少到10用户
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95%的请求响应时间<500ms
    http_req_failed: ['rate<0.01'],    // 错误率<1%
  },
};

export default function () {
  // 测试报价单列表加载
  const listRes = http.get('http://localhost:3000/api/quotes?page=1&pageSize=20', {
    headers: {
      'Authorization': `Bearer ${__ENV.TOKEN}`,
    },
  });
  check(listRes, {
    'list status is 200': (r) => r.status === 200,
    'list response time < 300ms': (r) => r.timings.duration < 300,
  });

  // 测试报价单详情加载
  const detailRes = http.get('http://localhost:3000/api/quotes/quote-id', {
    headers: {
      'Authorization': `Bearer ${__ENV.TOKEN}`,
    },
  });
  check(detailRes, {
    'detail status is 200': (r) => r.status === 200,
    'detail response time < 500ms': (r) => r.timings.duration < 500,
  });

  // 测试计算引擎
  const calcRes = http.post('http://localhost:3000/api/quotes/calculate', JSON.stringify({
    category: 'CURTAIN_FABRIC',
    input: {
      measuredWidth: 200,
      measuredHeight: 250,
      foldRatio: 2.0,
      groundClearance: 2,
      headerProcessType: 'WRAPPED',
      fabricDirection: 'HEIGHT',
      fabricSize: 280,
      openingStyle: 'DOUBLE',
      unitPrice: 100,
    },
  }), {
    headers: {
      'Authorization': `Bearer ${__ENV.TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  check(calcRes, {
    'calc status is 200': (r) => r.status === 200,
    'calc response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

---

## ✅ 验收标准

### 功能验收

- [ ] 所有需求功能正确实现
- [ ] 计算引擎结果与手工计算一致(误差<1%)
- [ ] 版本管理符合"唯一ACTIVE"约束
- [ ] 转单后订单数据不受商品库变更影响
- [ ] 嵌套附件联动计算正确
- [ ] 报价模式切换流畅

### 性能验收

- [ ] 报价单加载时间<2s(含100+行项目)
- [ ] 计算响应时间<500ms
- [ ] 商品联想搜索<300ms
- [ ] 版本切换响应<100ms
- [ ] API响应时间(P95)<500ms

### 代码质量验收

- [ ] TypeScript类型检查0错误
- [ ] 单元测试覆盖率>80%(计算引擎100%)
- [ ] E2E测试覆盖核心流程
- [ ] 无代码异味
- [ ] 符合代码规范

---

## 🔗 相关文档

- [计算引擎技术设计](./quote-calculation-engine.md)
- [版本管理技术设计](./quote-version-management.md)
- [报价模式配置技术设计](./quote-mode-configuration.md)
- [API接口文档](./api-documentation.md)

---

**最后更新**: 2026-01-16  
**维护者**: 开发团队
