# TypeScript类型定义 - 报价模块

> **文档版本**: v1.0  
> **创建日期**: 2026-01-16  
> **优先级**: P0 (类型安全)  
> **预估工时**: 1天  
> **依赖**: 无

---

## 📋 概述

本文档定义报价模块中所有JSONB字段的TypeScript类型,确保类型安全,避免运行时错误。

---

## 🎯 类型定义文件结构

```
src/features/quotes/types/
├── index.ts                    # 导出所有类型
├── quote-item-attributes.ts    # 报价项属性类型
├── calculation-params.ts       # 计算参数类型
├── quote-mode-config.ts        # 报价模式配置类型
└── quote-snapshot.ts           # 报价快照类型
```

---

## 📦 报价项属性类型 (Quote Item Attributes)

### 窗帘属性 (CurtainAttributes)

```typescript
// src/features/quotes/types/quote-item-attributes.ts

export interface CurtainAttributes {
  /** 开启方式 */
  openingStyle: 'DOUBLE' | 'LEFT' | 'RIGHT' | 'MULTI';
  
  /** 安装位置 */
  installPosition: 'CURTAIN_BOX' | 'INSIDE' | 'OUTSIDE';
  
  /** 离地高度 (cm) */
  groundClearance: number;
  
  /** 褶皱倍数 */
  foldRatio: number;
  
  /** 面料幅宽 (cm) */
  fabricWidth: number;
  
  /** 面料材质 */
  material: string;
  
  /** 面料克重 (g/㎡) */
  weight?: number;
  
  /** 花距 (cm) */
  patternRepeat?: number;
  
  /** 图片URL */
  imageUrl?: string;
  
  /** 面料方向 */
  fabricDirection?: 'HEIGHT' | 'WIDTH';
  
  /** 帘头工艺类型 */
  headerProcessType?: 'WRAPPED' | 'ATTACHED' | 'NONE';
  
  /** 轨道调节 (cm) */
  trackAdjustment?: number;
  
  /** 备注 */
  remark?: string;
}
```

### 墙纸属性 (WallpaperAttributes)

```typescript
export interface WallpaperAttributes {
  /** 幅宽 (定宽值, cm) */
  fabricWidth: number;
  
  /** 卷长 (m) */
  rollLength: number;
  
  /** 花距 (cm) */
  patternRepeat: number;
  
  /** 对花方式 */
  patternMatch: 'STRAIGHT' | 'OFFSET';
  
  /** 图片URL */
  imageUrl?: string;
  
  /** 墙纸类型 */
  wallpaperType?: 'PAPER' | 'VINYL' | 'NON_WOVEN';
  
  /** 备注 */
  remark?: string;
}
```

### 墙布属性 (WallclothAttributes)

```typescript
export interface WallclothAttributes {
  /** 幅宽 (cm) */
  fabricWidth: number;
  
  /** 图片URL */
  imageUrl?: string;
  
  /** 墙布类型 */
  wallclothType?: 'PLAIN' | 'EMBOSSED' | 'PRINTED';
  
  /** 备注 */
  remark?: string;
}
```

### 轨道属性 (TrackAttributes)

```typescript
export interface TrackAttributes {
  /** 轨道类型 */
  trackType: 'STRAIGHT' | 'CURVED' | 'ELECTRIC';
  
  /** 轨道长度 (cm) */
  trackLength: number;
  
  /** 安装方式 */
  installMethod: 'CEILING' | 'WALL';
  
  /** 图片URL */
  imageUrl?: string;
  
  /** 备注 */
  remark?: string;
}
```

### 附件属性 (AttachmentAttributes)

```typescript
export interface AttachmentAttributes {
  /** 附件类型 */
  attachmentType: 'BAND' | 'PILLOW' | 'FRINGE' | 'TASSEL' | 'GLUE' | 'PRIMER';
  
  /** 尺寸 (如抱枕 45×45) */
  size?: string;
  
  /** 图片URL */
  imageUrl?: string;
  
  /** 备注 */
  remark?: string;
}
```

### 统一属性类型 (ItemAttributes)

```typescript
export type ItemAttributes =
  | CurtainAttributes
  | WallpaperAttributes
  | WallclothAttributes
  | TrackAttributes
  | AttachmentAttributes;

export function isCurtainAttributes(attrs: any): attrs is CurtainAttributes {
  return attrs?.openingStyle !== undefined;
}

export function isWallpaperAttributes(attrs: any): attrs is WallpaperAttributes {
  return attrs?.patternMatch !== undefined;
}

export function isWallclothAttributes(attrs: any): attrs is WallclothAttributes {
  return attrs?.fabricWidth !== undefined && attrs?.patternMatch === undefined;
}
```

---

## 🧮 计算参数类型 (Calculation Params)

### 通用计算参数 (BaseCalculationParams)

```typescript
// src/features/quotes/types/calculation-params.ts

export interface BaseCalculationParams {
  /** 计算公式类型 */
  formulaType: 'FIXED_HEIGHT' | 'FIXED_WIDTH' | 'WALLPAPER' | 'WALLCLOTH';
  
  /** 计算时间戳 */
  calculatedAt: string;
  
  /** 计算版本 */
  calcVersion: string;
}
```

### 窗帘计算参数 (CurtainCalculationParams)

```typescript
export interface CurtainCalculationParams extends BaseCalculationParams {
  formulaType: 'FIXED_HEIGHT' | 'FIXED_WIDTH';
  
  /** 侧边损耗 (cm) */
  sideLoss: number;
  
  /** 帘头损耗 (cm) */
  headerLoss: number;
  
  /** 底边损耗 (cm) */
  bottomLoss: number;
  
  /** 成品宽度 (cm) */
  finishedWidth: number;
  
  /** 成品高度 (cm) */
  finishedHeight: number;
  
  /** 裁剪宽度 (cm) */
  cutWidth: number;
  
  /** 裁剪高度 (cm) */
  cutHeight: number;
  
  /** 片数 */
  panelCount?: number;
  
  /** 预警信息 */
  warnings?: Array<{
    type: 'HEIGHT_TOO_HIGH' | 'HEIGHT_TOO_LOW' | 'WIDTH_TOO_WIDE';
    message: string;
    suggestion?: string;
  }>;
}
```

### 墙纸计算参数 (WallpaperCalculationParams)

```typescript
export interface WallpaperCalculationParams extends BaseCalculationParams {
  formulaType: 'WALLPAPER';
  
  /** 宽度损耗 (cm) */
  widthLoss: number;
  
  /** 高度损耗 (cm) */
  heightLoss: number;
  
  /** 裁剪损耗 (cm) */
  cutLoss: number;
  
  /** 总条数 */
  totalStrips: number;
  
  /** 单条高度 (cm) */
  stripHeight: number;
  
  /** 每卷条数 */
  stripsPerRoll: number;
  
  /** 总卷数 */
  totalRolls: number;
  
  /** 对花损耗 (cm) */
  patternMatchLoss?: number;
  
  /** 墙段信息 */
  wallSegments?: Array<{
    width: number;
    strips: number;
  }>;
}
```

### 墙布计算参数 (WallclothCalculationParams)

```typescript
export interface WallclothCalculationParams extends BaseCalculationParams {
  formulaType: 'WALLCLOTH';
  
  /** 宽度损耗 (cm) */
  widthLoss: number;
  
  /** 上下损耗 (cm) */
  heightLoss: number;
  
  /** 墙布高度 (cm) */
  wallclothHeight: number;
  
  /** 总面积 (㎡) */
  totalArea: number;
  
  /** 预警信息 */
  warnings?: Array<{
    type: 'HEIGHT_EXCEEDS_FABRIC';
    message: string;
    suggestion?: string;
  }>;
}
```

### 统一计算参数类型 (CalculationParams)

```typescript
export type CalculationParams =
  | CurtainCalculationParams
  | WallpaperCalculationParams
  | WallclothCalculationParams;

export function isCurtainCalcParams(params: any): params is CurtainCalculationParams {
  return params?.formulaType === 'FIXED_HEIGHT' || params?.formulaType === 'FIXED_WIDTH';
}

export function isWallpaperCalcParams(params: any): params is WallpaperCalculationParams {
  return params?.formulaType === 'WALLPAPER';
}

export function isWallclothCalcParams(params: any): params is WallclothCalculationParams {
  return params?.formulaType === 'WALLCLOTH';
}
```

---

## ⚙️ 报价模式配置类型 (Quote Mode Config)

### 租户级配置 (TenantQuoteModeConfig)

```typescript
// src/features/quotes/types/quote-mode-config.ts

export interface TenantQuoteModeConfig {
  /** 默认模式 */
  defaultMode: 'SIMPLE' | 'ADVANCED';
  
  /** 简单模式字段列表 */
  simpleModeFields: string[];
  
  /** 高级模式字段列表 */
  advancedModeFields: string[];
  
  /** 字段分组 */
  fieldGroups: Record<string, {
    label: string;
    fields: string[];
  }>;
  
  /** 默认值 */
  defaultValues: Record<string, any>;
  
  /** 字段验证规则 */
  validationRules: Record<string, {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  }>;
  
  /** 是否允许用户自定义 */
  allowUserCustomization: boolean;
  
  /** 更新时间 */
  updatedAt: string;
}
```

### 用户级配置 (UserQuoteModeConfig)

```typescript
export interface UserQuoteModeConfig {
  /** 用户偏好模式 */
  preferredMode: 'SIMPLE' | 'ADVANCED';
  
  /** 自定义字段列表 (如果允许) */
  customizedFields?: string[];
  
  /** 是否使用系统默认 */
  useSystemDefault: boolean;
  
  /** 更新时间 */
  updatedAt: string;
}
```

### 字段定义 (FieldDefinition)

```typescript
export interface FieldDefinition {
  /** 字段ID */
  id: string;
  
  /** 字段标签 */
  label: string;
  
  /** 字段分组 */
  group: 'basic' | 'product' | 'dimension' | 'price' | 'attachment';
  
  /** 是否必填 */
  required: boolean;
  
  /** 字段类型 */
  type: 'text' | 'number' | 'select' | 'multiselect' | 'image' | 'textarea';
  
  /** 选项 (select/multiselect类型) */
  options?: Array<{
    value: string;
    label: string;
  }>;
  
  /** 默认值 */
  defaultValue?: any;
  
  /** 验证规则 */
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => boolean | string;
  };
}
```

### 系统默认配置 (SystemDefaultConfig)

```typescript
export const SYSTEM_DEFAULT_QUOTE_CONFIG: TenantQuoteModeConfig = {
  defaultMode: 'SIMPLE',
  simpleModeFields: [
    'roomType',
    'productSku',
    'imageUrl',
    'width',
    'height',
    'openingStyle',
    'quantity',
    'unitPrice',
    'amount',
  ],
  advancedModeFields: [
    'roomType',
    'productSku',
    'imageUrl',
    'width',
    'height',
    'openingStyle',
    'installPosition',
    'groundClearance',
    'foldRatio',
    'fabricDirection',
    'headerProcessType',
    'trackAdjustment',
    'quantity',
    'unitPrice',
    'amount',
    'remark',
    'attachments',
  ],
  fieldGroups: {
    basic: {
      label: 'Basic Info',
      fields: ['roomType', 'productSku', 'imageUrl'],
    },
    dimension: {
      label: 'Dimensions',
      fields: ['width', 'height', 'openingStyle', 'installPosition', 'groundClearance', 'foldRatio'],
    },
    product: {
      label: 'Product Details',
      fields: ['fabricDirection', 'headerProcessType', 'trackAdjustment'],
    },
    price: {
      label: 'Price & Calculation',
      fields: ['quantity', 'unitPrice', 'amount'],
    },
    attachment: {
      label: 'Attachments',
      fields: ['remark', 'attachments'],
    },
  },
  defaultValues: {
    installPosition: 'CURTAIN_BOX',
    groundClearance: 2,
    foldRatio: 2.0,
    fabricDirection: 'HEIGHT',
    headerProcessType: 'WRAPPED',
  },
  validationRules: {
    width: {
      required: true,
      min: 10,
      max: 1000,
    },
    height: {
      required: true,
      min: 10,
      max: 500,
    },
    foldRatio: {
      required: true,
      min: 1.5,
      max: 3.5,
    },
  },
  allowUserCustomization: true,
  updatedAt: new Date().toISOString(),
};
```

---

## 📸 报价快照类型 (Quote Snapshot)

### 完整快照结构 (QuoteSnapshot)

```typescript
// src/features/quotes/types/quote-snapshot.ts

export interface QuoteSnapshot {
  /** 报价单信息 */
  quote: QuoteSnapshotInfo;
  
  /** 报价明细项 */
  items: QuoteItemSnapshot[];
  
  /** 空间信息 */
  rooms: QuoteRoomSnapshot[];
  
  /** 快照元数据 */
  metadata: SnapshotMetadata;
}

export interface QuoteSnapshotInfo {
  id: string;
  quoteNo: string;
  version: number;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount: string;
  discountRate: string;
  discountAmount: string;
  finalAmount: string;
  status: string;
  validUntil?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteItemSnapshot {
  id: string;
  parentId?: string;
  roomId?: string;
  roomName?: string;
  category: string;
  productId?: string;
  productName: string;
  productSku?: string;
  unit: string;
  unitPrice: string;
  quantity: string;
  width?: string;
  height?: string;
  foldRatio?: string;
  processFee?: string;
  subtotal: string;
  attributes: ItemAttributes;
  calculationParams: CalculationParams;
  imageUrl?: string;
  remark?: string;
  sortOrder: number;
  attachments?: QuoteItemSnapshot[];
}

export interface QuoteRoomSnapshot {
  id: string;
  name: string;
  measureRoomId?: string;
  sortOrder: number;
}

export interface SnapshotMetadata {
  /** 快照时间戳 */
  timestamp: string;
  
  /** 快照版本 */
  version: string;
  
  /** 创建者 */
  createdBy: string;
  
  /** 快照类型 */
  snapshotType: 'CONVERT_TO_ORDER' | 'VERSION_CLONE' | 'MANUAL';
}
```

---

## 🔍 类型守卫 (Type Guards)

```typescript
// src/features/quotes/types/index.ts

import {
  ItemAttributes,
  isCurtainAttributes,
  isWallpaperAttributes,
  isWallclothAttributes,
} from './quote-item-attributes';

import {
  CalculationParams,
  isCurtainCalcParams,
  isWallpaperCalcParams,
  isWallclothCalcParams,
} from './calculation-params';

export function validateItemAttributes(category: string, attrs: any): ItemAttributes {
  switch (category) {
    case 'CURTAIN_FABRIC':
      if (!isCurtainAttributes(attrs)) {
        throw new Error('Invalid curtain attributes');
      }
      return attrs;
    
    case 'WALLPAPER':
      if (!isWallpaperAttributes(attrs)) {
        throw new Error('Invalid wallpaper attributes');
      }
      return attrs;
    
    case 'WALLCLOTH':
      if (!isWallclothAttributes(attrs)) {
        throw new Error('Invalid wallcloth attributes');
      }
      return attrs;
    
    default:
      return attrs as ItemAttributes;
  }
}

export function validateCalculationParams(category: string, params: any): CalculationParams {
  switch (category) {
    case 'CURTAIN_FABRIC':
      if (!isCurtainCalcParams(params)) {
        throw new Error('Invalid curtain calculation params');
      }
      return params;
    
    case 'WALLPAPER':
      if (!isWallpaperCalcParams(params)) {
        throw new Error('Invalid wallpaper calculation params');
      }
      return params;
    
    case 'WALLCLOTH':
      if (!isWallclothCalcParams(params)) {
        throw new Error('Invalid wallcloth calculation params');
      }
      return params;
    
    default:
      return params as CalculationParams;
  }
}
```

---

## ✅ Zod验证Schema

```typescript
// src/features/quotes/types/schemas.ts

import { z } from 'zod';

export const curtainAttributesSchema = z.object({
  openingStyle: z.enum(['DOUBLE', 'LEFT', 'RIGHT', 'MULTI']),
  installPosition: z.enum(['CURTAIN_BOX', 'INSIDE', 'OUTSIDE']),
  groundClearance: z.number().min(0).max(50),
  foldRatio: z.number().min(1.5).max(3.5),
  fabricWidth: z.number().min(100).max(300),
  material: z.string().min(1),
  weight: z.number().optional(),
  patternRepeat: z.number().optional(),
  imageUrl: z.string().url().optional(),
  fabricDirection: z.enum(['HEIGHT', 'WIDTH']).optional(),
  headerProcessType: z.enum(['WRAPPED', 'ATTACHED', 'NONE']).optional(),
  trackAdjustment: z.number().optional(),
  remark: z.string().optional(),
});

export const wallpaperAttributesSchema = z.object({
  fabricWidth: z.number().min(50).max(100),
  rollLength: z.number().min(5).max(20),
  patternRepeat: z.number().min(0),
  patternMatch: z.enum(['STRAIGHT', 'OFFSET']),
  imageUrl: z.string().url().optional(),
  wallpaperType: z.enum(['PAPER', 'VINYL', 'NON_WOVEN']).optional(),
  remark: z.string().optional(),
});

export const wallclothAttributesSchema = z.object({
  fabricWidth: z.number().min(200).max(300),
  imageUrl: z.string().url().optional(),
  wallclothType: z.enum(['PLAIN', 'EMBOSSED', 'PRINTED']).optional(),
  remark: z.string().optional(),
});

export const curtainCalcParamsSchema = z.object({
  formulaType: z.enum(['FIXED_HEIGHT', 'FIXED_WIDTH']),
  calculatedAt: z.string(),
  calcVersion: z.string(),
  sideLoss: z.number().min(0),
  headerLoss: z.number().min(0),
  bottomLoss: z.number().min(0),
  finishedWidth: z.number().min(0),
  finishedHeight: z.number().min(0),
  cutWidth: z.number().min(0),
  cutHeight: z.number().min(0),
  panelCount: z.number().optional(),
  warnings: z.array(z.object({
    type: z.enum(['HEIGHT_TOO_HIGH', 'HEIGHT_TOO_LOW', 'WIDTH_TOO_WIDE']),
    message: z.string(),
    suggestion: z.string().optional(),
  })).optional(),
});

export const wallpaperCalcParamsSchema = z.object({
  formulaType: z.literal('WALLPAPER'),
  calculatedAt: z.string(),
  calcVersion: z.string(),
  widthLoss: z.number().min(0),
  heightLoss: z.number().min(0),
  cutLoss: z.number().min(0),
  totalStrips: z.number().min(1),
  stripHeight: z.number().min(0),
  stripsPerRoll: z.number().min(1),
  totalRolls: z.number().min(1),
  patternMatchLoss: z.number().optional(),
  wallSegments: z.array(z.object({
    width: z.number(),
    strips: z.number(),
  })).optional(),
});

export const wallclothCalcParamsSchema = z.object({
  formulaType: z.literal('WALLCLOTH'),
  calculatedAt: z.string(),
  calcVersion: z.string(),
  widthLoss: z.number().min(0),
  heightLoss: z.number().min(0),
  wallclothHeight: z.number().min(0),
  totalArea: z.number().min(0),
  warnings: z.array(z.object({
    type: z.enum(['HEIGHT_EXCEEDS_FABRIC']),
    message: z.string(),
    suggestion: z.string().optional(),
  })).optional(),
});

export function getAttributesSchema(category: string) {
  switch (category) {
    case 'CURTAIN_FABRIC':
      return curtainAttributesSchema;
    case 'WALLPAPER':
      return wallpaperAttributesSchema;
    case 'WALLCLOTH':
      return wallclothAttributesSchema;
    default:
      return z.object({});
  }
}

export function getCalcParamsSchema(category: string) {
  switch (category) {
    case 'CURTAIN_FABRIC':
      return curtainCalcParamsSchema;
    case 'WALLPAPER':
      return wallpaperCalcParamsSchema;
    case 'WALLCLOTH':
      return wallclothCalcParamsSchema;
    default:
      return z.object({});
  }
}
```

---

## 📝 使用示例

### 在Server Action中使用

```typescript
// src/features/quotes/actions/item-mutations.ts

import { z } from 'zod';
import { getAttributesSchema, getCalcParamsSchema } from '../types/schemas';

export async function updateQuoteItem(itemId: string, data: any) {
  const attributesSchema = getAttributesSchema(data.category);
  const calcParamsSchema = getCalcParamsSchema(data.category);
  
  const validatedAttributes = attributesSchema.parse(data.attributes);
  const validatedCalcParams = calcParamsSchema.parse(data.calculationParams);
  
  await db.update(quoteItems)
    .set({
      attributes: validatedAttributes,
      calculationParams: validatedCalcParams,
      updatedAt: new Date(),
    })
    .where(eq(quoteItems.id, itemId));
}
```

### 在前端组件中使用

```typescript
// src/features/quotes/components/curtain-fabric-quote-form.tsx

import { CurtainAttributes, isCurtainAttributes } from '../types';

interface Props {
  item: {
    attributes: any;
  };
}

export function CurtainFabricQuoteForm({ item }: Props) {
  const attributes = item.attributes as CurtainAttributes;
  
  if (!isCurtainAttributes(attributes)) {
    return <div>Invalid attributes</div>;
  }
  
  return (
    <form>
      <input
        name="openingStyle"
        defaultValue={attributes.openingStyle}
      />
      <input
        name="groundClearance"
        type="number"
        defaultValue={attributes.groundClearance}
      />
      {/* ... */}
    </form>
  );
}
```

---

## ✅ 验收标准

- [ ] 所有JSONB字段都有对应的TypeScript类型定义
- [ ] 类型定义覆盖所有品类(窗帘、墙纸、墙布、轨道、附件)
- [ ] 提供类型守卫函数
- [ ] 提供Zod验证Schema
- [ ] 类型检查无错误
- [ ] 运行时验证正常工作

---

## 🔗 相关文档

- [数据库Schema文档](../03-database/schema.md)
- [计算引擎技术设计](./quote-calculation-engine.md)
- [报价模块需求文档](../02-requirements/modules/报价单/报价单.md)

---

**最后更新**: 2026-01-16  
**维护者**: 开发团队
