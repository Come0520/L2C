# 计算引擎技术设计文档

> **文档版本**: v1.0  
> **创建日期**: 2026-01-16  
> **优先级**: P0 (核心业务逻辑)  
> **预估工时**: 4天  
> **依赖**: TypeScript类型定义

---

## 📋 概述

计算引擎是报价模块的核心,负责根据测量数据和商品参数计算用量和金额。本文档详细说明窗帘、墙纸、墙布的计算逻辑、实现方案和测试策略。

---

## 🎯 计算引擎架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     计算引擎架构                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   前端表单    │───▶│  Server      │───▶│  计算引擎     │  │
│  │   (用户输入)  │    │  Action      │    │  (核心逻辑)   │  │
│  └──────────────┘    └──────────────┘    └──────┬───────┘  │
│                                              │              │
│                                    ┌─────────┴─────────┐  │
│                                    │                   │  │
│                          ┌─────────▼──────┐  ┌────────▼──────┐│
│                          │ 窗帘计算策略    │  │ 墙纸计算策略    ││
│                          │ CurtainStrategy│  │WallpaperStrategy││
│                          └────────────────┘  └───────────────┘│
│                                    │                   │      │
│                          ┌─────────▼──────┐  ┌────────▼──────┐│
│                          │ 墙布计算策略    │  │ 附件计算策略    ││
│                          │WallclothStrategy│  │AttachmentCalc  ││
│                          └────────────────┘  └───────────────┘│
│                                    │                   │      │
│                          ┌─────────▼──────────────────▼──────┐│
│                          │       计算结果汇总                  ││
│                          │   (用量 + 金额 + 预警)            ││
│                          └─────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 策略模式实现

```typescript
// src/features/quotes/calc-strategies/base-strategy.ts

export abstract class BaseCalcStrategy<TInput, TResult> {
  abstract calculate(input: TInput): TResult;
  
  protected validateInput(input: TInput): void {
    // 子类实现具体验证逻辑
  }
  
  protected generateWarnings(input: TInput): Array<{ type: string; message: string }> {
    // 子类实现预警逻辑
    return [];
  }
}
```

```typescript
// src/features/quotes/calc-strategies/strategy-factory.ts

import { CurtainStrategy } from './curtain-strategy';
import { WallpaperStrategy } from './wallpaper-strategy';
import { WallclothStrategy } from './wallcloth-strategy';
import { AttachmentStrategy } from './attachment-strategy';

export class CalculationStrategyFactory {
  static create(category: string): BaseCalcStrategy<any, any> {
    switch (category) {
      case 'CURTAIN_FABRIC':
        return new CurtainStrategy();
      case 'WALLPAPER':
        return new WallpaperStrategy();
      case 'WALLCLOTH':
        return new WallclothStrategy();
      case 'CURTAIN_ACCESSORY':
      case 'WALLPAPER_CONSUMABLE':
        return new AttachmentStrategy();
      default:
        throw new Error(`Unsupported category: ${category}`);
    }
  }
}
```

---

## 🪟 窗帘计算引擎

### 计算公式

#### 1. 基础参数

| 参数 | 说明 | 单位 | 默认值 |
|------|------|------|--------|
| `measuredWidth` | 测量宽度 | cm | - |
| `measuredHeight` | 测量高度 | cm | - |
| `foldRatio` | 褶皱倍数 | - | 2.0 |
| `groundClearance` | 离地高度 | cm | 2 |
| `headerProcessType` | 帘头工艺 | - | WRAPPED |
| `fabricDirection` | 面料方向 | - | HEIGHT |
| `fabricSize` | 面料尺寸 | cm | 280 |
| `openingStyle` | 开启方式 | - | DOUBLE |
| `unitPrice` | 单价 | 元/㎡ | - |

#### 2. 损耗参数

| 参数 | 说明 | 单位 | 默认值 |
|------|------|------|--------|
| `sideLoss` | 侧边损耗 | cm | 5 |
| `headerLoss` | 帘头损耗 | cm | WRAPPED:20, ATTACHED:7, NONE:0 |
| `bottomLoss` | 底边损耗 | cm | 10 |
| `smallBottomThreshold` | 小高度阈值 | cm | 3 |

#### 3. 计算步骤

**步骤1: 计算成品尺寸**

```typescript
// 成品宽度
finishedWidth = measuredWidth × foldRatio

// 成品高度
finishedHeight = measuredHeight - groundClearance
```

**步骤2: 计算裁剪尺寸**

```typescript
// 裁剪宽度
cutWidth = finishedWidth + (sideLoss × 2 × 片数)

// 裁剪高度
cutHeight = finishedHeight + headerLoss + bottomLoss
```

**步骤3: 计算用量**

```typescript
// 定高面料 (HEIGHT方向)
if (fabricDirection === 'HEIGHT') {
  quantity = cutWidth / 100  // 米
  panelCount = 1
}

// 定宽面料 (WIDTH方向)
if (fabricDirection === 'WIDTH') {
  panelCount = ⌈cutWidth / fabricSize⌉
  quantity = panelCount × cutHeight / 100  // 米
}
```

**步骤4: 计算金额**

```typescript
subtotal = quantity × unitPrice
```

#### 4. 预警逻辑

| 预警类型 | 触发条件 | 建议措施 |
|----------|----------|----------|
| `HEIGHT_TOO_HIGH` | finishedHeight > 275cm | 建议改用连体帘头 |
| `HEIGHT_TOO_LOW` | finishedHeight < smallBottomThreshold | 减小底边损耗 |
| `WIDTH_TOO_WIDE` | cutWidth > 600cm | 建议分片制作 |

### 实现代码

```typescript
// src/features/quotes/calc-strategies/curtain-strategy.ts

import { BaseCalcStrategy } from './base-strategy';
import { CurtainCalcInput, CurtainCalcResult, CurtainCalcSettings } from '../logic/curtain-calc-engine';

export class CurtainStrategy extends BaseCalcStrategy<CurtainCalcInput, CurtainCalcResult> {
  private settings: CurtainCalcSettings;

  constructor(settings?: Partial<CurtainCalcSettings>) {
    super();
    this.settings = {
      sideLoss: 5,
      headerLoss: {
        WRAPPED: 20,
        ATTACHED: 7,
        NONE: 0,
      },
      bottomLoss: 10,
      smallBottomThreshold: 3,
      ...settings,
    };
  }

  calculate(input: CurtainCalcInput): CurtainCalcResult {
    this.validateInput(input);
    
    const warnings = this.generateWarnings(input);
    
    const {
      measuredWidth,
      measuredHeight,
      foldRatio,
      groundClearance,
      headerProcessType,
      fabricDirection,
      fabricSize,
      openingStyle,
      unitPrice,
    } = input;

    // 步骤1: 计算成品尺寸
    const finishedWidth = measuredWidth * foldRatio;
    const finishedHeight = measuredHeight - groundClearance;

    // 步骤2: 计算裁剪尺寸
    const headerLoss = this.settings.headerLoss[headerProcessType] || 0;
    const panelCount = openingStyle === 'DOUBLE' ? 2 : 1;
    const sideLossTotal = this.settings.sideLoss * 2 * panelCount;

    const cutWidth = finishedWidth + sideLossTotal;
    const cutHeight = finishedHeight + headerLoss + this.settings.bottomLoss;

    // 步骤3: 计算用量
    let quantity: number;
    let actualPanelCount: number | undefined;

    if (fabricDirection === 'HEIGHT') {
      // 定高面料
      quantity = Math.ceil((cutWidth / 100) * 10) / 10; // 保留1位小数
      actualPanelCount = 1;
    } else {
      // 定宽面料
      actualPanelCount = Math.ceil(cutWidth / fabricSize);
      quantity = Math.ceil((actualPanelCount * cutHeight / 100) * 10) / 10;
    }

    // 步骤4: 计算金额
    const subtotal = Math.round(quantity * unitPrice * 100) / 100; // 保留2位小数

    return {
      finishedWidth,
      finishedHeight,
      cutWidth,
      cutHeight,
      quantity,
      subtotal,
      panelCount: actualPanelCount,
      warnings,
    };
  }

  protected validateInput(input: CurtainCalcInput): void {
    if (input.measuredWidth <= 0) {
      throw new Error('测量宽度必须大于0');
    }
    if (input.measuredHeight <= 0) {
      throw new Error('测量高度必须大于0');
    }
    if (input.foldRatio < 1.5 || input.foldRatio > 3.5) {
      throw new Error('褶皱倍数必须在1.5-3.5之间');
    }
    if (input.groundClearance < 0 || input.groundClearance > 50) {
      throw new Error('离地高度必须在0-50cm之间');
    }
  }

  protected generateWarnings(input: CurtainCalcInput): Array<{ type: string; message?: string }> {
    const warnings: Array<{ type: string; message?: string }> = [];
    
    const finishedHeight = input.measuredHeight - input.groundClearance;
    
    if (finishedHeight > 275) {
      warnings.push({
        type: 'HEIGHT_TOO_HIGH',
        message: `成品高度${finishedHeight}cm超过275cm,建议改用连体帘头`,
      });
    }
    
    if (finishedHeight < this.settings.smallBottomThreshold) {
      warnings.push({
        type: 'HEIGHT_TOO_LOW',
        message: `成品高度${finishedHeight}cm过小,建议减小底边损耗`,
      });
    }
    
    const cutWidth = input.measuredWidth * input.foldRatio + 
                    this.settings.sideLoss * 2 * (input.openingStyle === 'DOUBLE' ? 2 : 1);
    
    if (cutWidth > 600) {
      warnings.push({
        type: 'WIDTH_TOO_WIDE',
        message: `裁剪宽度${cutWidth}cm过宽,建议分片制作`,
      });
    }
    
    return warnings;
  }
}
```

### 测试用例

```typescript
// src/features/quotes/calc-strategies/__tests__/curtain-strategy.test.ts

import { describe, it, expect } from 'vitest';
import { CurtainStrategy } from '../curtain-strategy';

describe('CurtainStrategy', () => {
  const strategy = new CurtainStrategy();

  describe('定高面料计算', () => {
    it('应该正确计算定高面料用量', () => {
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

      expect(result.finishedWidth).toBe(400);
      expect(result.finishedHeight).toBe(248);
      expect(result.cutWidth).toBe(420); // 400 + 5*2*2
      expect(result.cutHeight).toBe(278); // 248 + 20 + 10
      expect(result.quantity).toBe(4.2);
      expect(result.subtotal).toBe(420);
      expect(result.panelCount).toBe(1);
    });
  });

  describe('定宽面料计算', () => {
    it('应该正确计算定宽面料用量', () => {
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

      expect(result.finishedWidth).toBe(400);
      expect(result.cutWidth).toBe(420);
      expect(result.panelCount).toBe(3); // ⌈420/140⌉
      expect(result.quantity).toBeCloseTo(8.34, 1); // 3 * 278 / 100
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
  });
});
```

---

## 🖼️ 墙纸计算引擎

### 计算公式

#### 1. 基础参数

| 参数 | 说明 | 单位 | 默认值 |
|------|------|------|--------|
| `width` | 墙面宽度 | cm | - |
| `height` | 墙面高度 | cm | - |
| `fabricWidth` | 墙纸幅宽 | cm | 53 |
| `rollLength` | 卷长 | m | 10 |
| `patternRepeat` | 花距 | cm | 0 |
| `patternMatch` | 对花方式 | - | STRAIGHT |
| `unitPrice` | 单价 | 元/卷 | - |

#### 2. 损耗参数

| 参数 | 说明 | 单位 | 默认值 |
|------|------|------|--------|
| `widthLoss` | 宽度损耗 | cm | 20 |
| `heightLoss` | 高度损耗 | cm | 10 |
| `cutLoss` | 裁剪损耗 | cm | 10 |

#### 3. 计算步骤

**步骤1: 计算条数**

```typescript
// 单面墙
totalStrips = ⌈(width + widthLoss) / fabricWidth⌉

// 多段墙面
wallSegments.forEach(segment => {
  segment.strips = ⌈(segment.width + widthLoss) / fabricWidth⌉
  totalStrips += segment.strips
})
```

**步骤2: 计算单条高度**

```typescript
// 无对花 (patternRepeat = 0)
stripHeight = height + heightLoss + cutLoss

// 有对花
baseHeight = height + heightLoss + cutLoss
stripHeight = ⌈baseHeight / patternRepeat⌉ × patternRepeat
```

**步骤3: 计算卷数**

```typescript
stripsPerRoll = ⌊(rollLength × 100) / stripHeight⌋
totalRolls = ⌈totalStrips / stripsPerRoll⌉
```

**步骤4: 计算金额**

```typescript
subtotal = totalRolls × unitPrice
```

### 实现代码

```typescript
// src/features/quotes/calc-strategies/wallpaper-strategy.ts

import { BaseCalcStrategy } from './base-strategy';
import { 
  WallpaperCalcSettings, 
  WallpaperCalcParams, 
  WallpaperCalcResult 
} from '../logic/wallpaper-calc-engine';

export class WallpaperStrategy extends BaseCalcStrategy<WallpaperCalcParams, WallpaperCalcResult> {
  private settings: WallpaperCalcSettings;

  constructor(settings?: Partial<WallpaperCalcSettings>) {
    super();
    this.settings = {
      widthLoss: 20,
      heightLoss: 10,
      cutLoss: 10,
      rollWidth: 53,
      rollLength: 10,
      ...settings,
    };
  }

  calculate(params: WallpaperCalcParams): WallpaperCalcResult {
    this.validateInput(params);
    
    const {
      width = 0,
      height = 0,
      fabricWidth = this.settings.rollWidth,
      unitPrice = 0,
      rollLength = this.settings.rollLength,
      widthLoss = this.settings.widthLoss,
      cutLoss = this.settings.cutLoss,
      patternRepeat = 0,
      wallSegments = [],
      heightLoss = this.settings.heightLoss,
    } = params;

    // 步骤1: 计算条数
    let totalStrips = 0;
    const segmentsWithStrips = wallSegments.map(segment => {
      const strips = Math.ceil((segment.width + widthLoss) / fabricWidth);
      totalStrips += strips;
      return { ...segment, strips };
    });

    if (wallSegments.length === 0 && width > 0) {
      totalStrips = Math.ceil((width + widthLoss) / fabricWidth);
    }

    // 步骤2: 计算单条高度
    const baseHeight = height + heightLoss + cutLoss;
    let stripHeight: number;

    if (patternRepeat > 0) {
      // 有对花
      stripHeight = Math.ceil(baseHeight / patternRepeat) * patternRepeat;
    } else {
      // 无对花
      stripHeight = baseHeight;
    }

    // 步骤3: 计算卷数
    const stripHeightM = stripHeight / 100;
    const stripsPerRoll = Math.floor(rollLength / stripHeightM);
    const totalRolls = Math.ceil(totalStrips / stripsPerRoll);

    // 步骤4: 计算金额
    const subtotal = Math.round(totalRolls * unitPrice * 100) / 100;

    return {
      usage: totalRolls,
      subtotal,
      details: {
        totalStrips,
        effectiveHeightCm: stripHeight,
        wallSegments: segmentsWithStrips,
      },
    };
  }

  protected validateInput(params: WallpaperCalcParams): void {
    if (params.width && params.width <= 0) {
      throw new Error('墙面宽度必须大于0');
    }
    if (params.height && params.height <= 0) {
      throw new Error('墙面高度必须大于0');
    }
    if (params.fabricWidth && params.fabricWidth <= 0) {
      throw new Error('墙纸幅宽必须大于0');
    }
  }
}
```

### 测试用例

```typescript
// src/features/quotes/calc-strategies/__tests__/wallpaper-strategy.test.ts

import { describe, it, expect } from 'vitest';
import { WallpaperStrategy } from '../wallpaper-strategy';

describe('WallpaperStrategy', () => {
  const strategy = new WallpaperStrategy();

  describe('无对花计算', () => {
    it('应该正确计算无对花墙纸用量', () => {
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
      expect(result.details?.effectiveHeightCm).toBe(280); // 260+10+10
      expect(result.usage).toBe(3); // ⌈8/⌊10/2.8⌋⌉ = ⌈8/3⌉
      expect(result.subtotal).toBe(150);
    });
  });

  describe('有对花计算', () => {
    it('应该正确计算有对花墙纸用量', () => {
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
      expect(result.usage).toBe(4); // ⌈8/⌊10/3.2⌋⌉ = ⌈8/3⌉
    });
  });

  describe('多段墙面', () => {
    it('应该正确计算多段墙面总用量', () => {
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
  });
});
```

---

## 🧱 墙布计算引擎

### 计算公式

#### 1. 基础参数

| 参数 | 说明 | 单位 | 默认值 |
|------|------|------|--------|
| `width` | 墙面宽度 | cm | - |
| `height` | 墙面高度 | cm | - |
| `fabricWidth` | 墙布幅宽 | cm | 280 |
| `unitPrice` | 单价 | 元/㎡ | - |

#### 2. 损耗参数

| 参数 | 说明 | 单位 | 默认值 |
|------|------|------|--------|
| `widthLoss` | 宽度损耗 | cm | 10 |
| `heightLoss` | 上下损耗 | cm | 10 |

#### 3. 计算步骤

**步骤1: 计算用料宽度**

```typescript
usageWidth = width + widthLoss
```

**步骤2: 计算墙布高度**

```typescript
wallclothHeight = fabricWidth + heightLoss
```

**步骤3: 计算面积**

```typescript
totalArea = (usageWidth × wallclothHeight) / 10000  // 平方米
```

**步骤4: 计算金额**

```typescript
subtotal = totalArea × unitPrice
```

### 实现代码

```typescript
// src/features/quotes/calc-strategies/wallcloth-strategy.ts

import { BaseCalcStrategy } from './base-strategy';

export interface WallclothCalcParams {
  width: number;
  height: number;
  fabricWidth: number;
  unitPrice: number;
  widthLoss?: number;
  heightLoss?: number;
}

export interface WallclothCalcResult {
  usage: number; // 平方米
  subtotal: number;
  details?: {
    usageWidth: number;
    wallclothHeight: number;
    totalArea: number;
    warnings?: Array<{
      type: string;
      message: string;
    }>;
  };
}

export class WallclothStrategy extends BaseCalcStrategy<WallclothCalcParams, WallclothCalcResult> {
  private settings = {
    widthLoss: 10,
    heightLoss: 10,
  };

  calculate(params: WallclothCalcParams): WallclothCalcResult {
    this.validateInput(params);
    
    const {
      width,
      height,
      fabricWidth,
      unitPrice,
      widthLoss = this.settings.widthLoss,
      heightLoss = this.settings.heightLoss,
    } = params;

    // 步骤1: 计算用料宽度
    const usageWidth = width + widthLoss;

    // 步骤2: 计算墙布高度
    const wallclothHeight = fabricWidth + heightLoss;

    // 步骤3: 计算面积
    const totalArea = (usageWidth * wallclothHeight) / 10000;

    // 步骤4: 计算金额
    const subtotal = Math.round(totalArea * unitPrice * 100) / 100;

    // 预警检查
    const warnings = this.generateWarnings(height, fabricWidth);

    return {
      usage: totalArea,
      subtotal,
      details: {
        usageWidth,
        wallclothHeight,
        totalArea,
        warnings: warnings.length > 0 ? warnings : undefined,
      },
    };
  }

  protected validateInput(params: WallclothCalcParams): void {
    if (params.width <= 0) {
      throw new Error('墙面宽度必须大于0');
    }
    if (params.height <= 0) {
      throw new Error('墙面高度必须大于0');
    }
    if (params.fabricWidth <= 0) {
      throw new Error('墙布幅宽必须大于0');
    }
  }

  private generateWarnings(height: number, fabricWidth: number): Array<{ type: string; message: string }> {
    const warnings: Array<{ type: string; message: string }> = [];
    
    if (height > fabricWidth) {
      warnings.push({
        type: 'HEIGHT_EXCEEDS_FABRIC',
        message: `墙面高度${height}cm超过墙布幅宽${fabricWidth}cm,建议使用墙纸`,
      });
    }
    
    return warnings;
  }
}
```

### 测试用例

```typescript
// src/features/quotes/calc-strategies/__tests__/wallcloth-strategy.test.ts

import { describe, it, expect } from 'vitest';
import { WallclothStrategy } from '../wallcloth-strategy';

describe('WallclothStrategy', () => {
  const strategy = new WallclothStrategy();

  it('应该正确计算墙布面积', () => {
    const params = {
      width: 400,
      height: 260,
      fabricWidth: 280,
      unitPrice: 80,
    };

    const result = strategy.calculate(params);

    expect(result.details?.usageWidth).toBe(410); // 400+10
    expect(result.details?.wallclothHeight).toBe(290); // 280+10
    expect(result.details?.totalArea).toBeCloseTo(11.89, 2); // 410×290/10000
    expect(result.usage).toBeCloseTo(11.89, 2);
    expect(result.subtotal).toBeCloseTo(951.2, 1);
  });

  it('应该在高度超过幅宽时触发预警', () => {
    const params = {
      width: 400,
      height: 300,
      fabricWidth: 280,
      unitPrice: 80,
    };

    const result = strategy.calculate(params);

    expect(result.details?.warnings).toContainEqual({
      type: 'HEIGHT_EXCEEDS_FABRIC',
      message: expect.stringContaining('超过墙布幅宽'),
    });
  });
});
```

---

## 📎 附件计算引擎

### 计算逻辑

#### 1. 本布绑带

```typescript
// 固定数量
fixedQuantity = 0.15  // 米

// 推荐数量
if (openingStyle === 'SINGLE') {
  recommendedQuantity = 1  // 个
} else if (openingStyle === 'DOUBLE') {
  recommendedQuantity = 2  // 个
}
```

#### 2. 抱枕

```typescript
// 单价锁定主行价格
unitPrice = mainItem.unitPrice

// 默认尺寸
size = '45×45'

// 数量
quantity = userQuantity
```

#### 3. 胶水/基膜

```typescript
// 按面积计算
usage = totalWallpaperArea × consumptionRate

// 消耗率
glueRate = 0.15  // kg/㎡
primerRate = 0.1  // kg/㎡
```

### 实现代码

```typescript
// src/features/quotes/calc-strategies/attachment-strategy.ts

import { BaseCalcStrategy } from './base-strategy';

export interface AttachmentCalcParams {
  attachmentType: 'BAND' | 'PILLOW' | 'GLUE' | 'PRIMER';
  parentItem: {
    category: string;
    openingStyle?: string;
    unitPrice?: number;
    totalArea?: number;
  };
  quantity?: number;
  unitPrice?: number;
}

export interface AttachmentCalcResult {
  quantity: number;
  unitPrice: number;
  subtotal: number;
  details?: {
    recommendedQuantity?: number;
    fixedQuantity?: number;
    consumptionRate?: number;
  };
}

export class AttachmentStrategy extends BaseCalcStrategy<AttachmentCalcParams, AttachmentCalcResult> {
  calculate(params: AttachmentCalcParams): AttachmentCalcResult {
    const { attachmentType, parentItem, quantity, unitPrice } = params;

    switch (attachmentType) {
      case 'BAND':
        return this.calculateBand(parentItem, quantity, unitPrice);
      
      case 'PILLOW':
        return this.calculatePillow(parentItem, quantity, unitPrice);
      
      case 'GLUE':
      case 'PRIMER':
        return this.calculateConsumable(attachmentType, parentItem, quantity, unitPrice);
      
      default:
        throw new Error(`Unsupported attachment type: ${attachmentType}`);
    }
  }

  private calculateBand(
    parentItem: any,
    quantity?: number,
    unitPrice?: number
  ): AttachmentCalcResult {
    const fixedQuantity = 0.15; // 米
    
    let recommendedQuantity: number;
    if (parentItem.openingStyle === 'SINGLE') {
      recommendedQuantity = 1;
    } else {
      recommendedQuantity = 2;
    }

    const finalQuantity = quantity ?? recommendedQuantity;
    const finalUnitPrice = unitPrice ?? 0;
    const subtotal = Math.round(finalQuantity * finalUnitPrice * 100) / 100;

    return {
      quantity: finalQuantity,
      unitPrice: finalUnitPrice,
      subtotal,
      details: {
        recommendedQuantity,
        fixedQuantity,
      },
    };
  }

  private calculatePillow(
    parentItem: any,
    quantity?: number,
    unitPrice?: number
  ): AttachmentCalcResult {
    const finalQuantity = quantity ?? 1;
    const finalUnitPrice = unitPrice ?? parentItem.unitPrice ?? 0;
    const subtotal = Math.round(finalQuantity * finalUnitPrice * 100) / 100;

    return {
      quantity: finalQuantity,
      unitPrice: finalUnitPrice,
      subtotal,
    };
  }

  private calculateConsumable(
    attachmentType: 'GLUE' | 'PRIMER',
    parentItem: any,
    quantity?: number,
    unitPrice?: number
  ): AttachmentCalcResult {
    const consumptionRate = attachmentType === 'GLUE' ? 0.15 : 0.1;
    const totalArea = parentItem.totalArea ?? 0;
    
    const calculatedQuantity = totalArea * consumptionRate;
    const finalQuantity = quantity ?? calculatedQuantity;
    const finalUnitPrice = unitPrice ?? 0;
    const subtotal = Math.round(finalQuantity * finalUnitPrice * 100) / 100;

    return {
      quantity: finalQuantity,
      unitPrice: finalUnitPrice,
      subtotal,
      details: {
        consumptionRate,
      },
    };
  }
}
```

---

## 🧪 测试策略

### 单元测试覆盖率要求

| 模块 | 覆盖率要求 | 说明 |
|------|------------|------|
| 窗帘计算引擎 | 100% | 核心计算逻辑 |
| 墙纸计算引擎 | 100% | 核心计算逻辑 |
| 墙布计算引擎 | 100% | 核心计算逻辑 |
| 附件计算引擎 | 90% | 相对简单 |
| 策略工厂 | 80% | 简单路由 |

### 测试数据集

#### 窗帘测试数据

```typescript
const curtainTestCases = [
  {
    name: '定高面料-单开',
    input: {
      measuredWidth: 150,
      measuredHeight: 250,
      foldRatio: 2.0,
      groundClearance: 2,
      headerProcessType: 'WRAPPED',
      fabricDirection: 'HEIGHT',
      fabricSize: 280,
      openingStyle: 'SINGLE',
      unitPrice: 100,
    },
    expected: {
      quantity: 3.1,
      subtotal: 310,
    },
  },
  {
    name: '定高面料-对开',
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
    expected: {
      quantity: 4.2,
      subtotal: 420,
    },
  },
  {
    name: '定宽面料',
    input: {
      measuredWidth: 200,
      measuredHeight: 250,
      foldRatio: 2.0,
      groundClearance: 2,
      headerProcessType: 'WRAPPED',
      fabricDirection: 'WIDTH',
      fabricSize: 140,
      openingStyle: 'DOUBLE',
      unitPrice: 100,
    },
    expected: {
      quantity: 8.34,
      subtotal: 834,
    },
  },
];
```

#### 墙纸测试数据

```typescript
const wallpaperTestCases = [
  {
    name: '无对花',
    input: {
      width: 400,
      height: 260,
      fabricWidth: 53,
      unitPrice: 50,
      rollLength: 10,
      patternRepeat: 0,
    },
    expected: {
      totalRolls: 3,
      subtotal: 150,
    },
  },
  {
    name: '有对花',
    input: {
      width: 400,
      height: 260,
      fabricWidth: 53,
      unitPrice: 50,
      rollLength: 10,
      patternRepeat: 64,
    },
    expected: {
      totalRolls: 4,
      subtotal: 200,
    },
  },
];
```

---

## ✅ 验收标准

### 功能验收

- [ ] 窗帘计算结果与手工计算一致(误差<1%)
- [ ] 墙纸计算结果与手工计算一致(误差<1%)
- [ ] 墙布计算结果与手工计算一致(误差<1%)
- [ ] 附件联动计算正确
- [ ] 预警逻辑准确触发

### 性能验收

- [ ] 单次计算响应时间<500ms
- [ ] 批量计算(100项)响应时间<5s

### 代码质量验收

- [ ] 单元测试覆盖率>80%(计算引擎100%)
- [ ] 所有计算逻辑有完整测试用例
- [ ] 边界条件测试覆盖

---

## 🔗 相关文档

- [TypeScript类型定义](./typescript-type-definitions.md)
- [报价模块需求文档](../02-requirements/modules/报价单/报价单.md)
- [数量计算逻辑文档](../02-requirements/数量计算逻辑.md)

---

**最后更新**: 2026-01-16  
**维护者**: 开发团队
