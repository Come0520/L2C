# 报价模式配置技术设计文档

> **文档版本**: v1.0  
> **创建日期**: 2026-01-16  
> **优先级**: P1 (用户体验)  
> **预估工时**: 3天  
> **依赖**: TypeScript类型定义

---

## 📋 概述

报价模式配置允许租户和用户自定义报价表单的字段显示,支持"快速模式"和"高级模式"两种模式,满足不同场景的需求。本文档详细说明配置系统的架构、数据结构和实现方案。

---

## 🎯 业务需求

### 核心功能

1. **两种报价模式**:
   - **快速模式 (SIMPLE)**: 仅显示核心字段,适合快速报价
   - **高级模式 (ADVANCED)**: 显示所有字段,适合专业报价

2. **三级配置优先级**:
   - **用户级配置**: 最高优先级,用户个人偏好
   - **租户级配置**: 中等优先级,租户管理员配置
   - **系统默认配置**: 最低优先级,系统预设

3. **字段分组**:
   - Basic Info (基础信息)
   - Product Info (商品信息)
   - Dimensions (尺寸信息)
   - Price & Calculation (价格与计算)
   - Attachments (附件)

4. **动态表单**:
   - 基于配置动态渲染字段
   - 模式切换时保留已录入数据
   - 支持字段验证规则

### 配置优先级示例

```
用户配置 > 租户配置 > 系统默认

示例:
- 系统默认: 简单模式显示8个字段
- 租户配置: 简单模式显示10个字段
- 用户配置: 简单模式显示12个字段

最终生效: 用户配置(12个字段)
```

---

## 🏗️ 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                  报价模式配置系统                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  前端表单     │───▶│  配置获取     │───▶│  配置合并     │  │
│  │  (动态渲染)   │    │  (三级优先级)  │    │  (优先级逻辑)  │  │
│  └──────────────┘    └──────────────┘    └──────┬───────┘  │
│                                              │              │
│                                    ┌─────────┴─────────┐  │
│                                    │                   │  │
│                          ┌─────────▼──────┐  ┌────────▼──────┐│
│                          │ 用户配置存储    │  │ 租户配置存储    ││
│                          │ users.settings │  │ tenants.settings││
│                          └────────────────┘  └───────────────┘│
│                                    │                   │      │
│                          ┌─────────▼──────────────────▼──────┐│
│                          │       系统默认配置                 ││
│                          │  SYSTEM_DEFAULT_QUOTE_CONFIG       ││
│                          └────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 配置获取流程

```
1. 用户请求配置
   ↓
2. 查询用户配置 (users.settings.quoteModeConfig)
   ↓
3. 如果用户配置存在且customized=true,返回用户配置
   ↓
4. 否则查询租户配置 (tenants.settings.quoteModeConfig)
   ↓
5. 如果租户配置存在,返回租户配置
   ↓
6. 否则返回系统默认配置
```

---

## 📊 数据结构

### 系统默认配置

```typescript
// src/features/quotes/config/quote-mode-config.ts

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
    product: {
      label: 'Product Details',
      fields: ['fabricDirection', 'headerProcessType', 'trackAdjustment'],
    },
    dimension: {
      label: 'Dimensions',
      fields: ['width', 'height', 'openingStyle', 'installPosition', 'groundClearance', 'foldRatio'],
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

### 租户级配置

```typescript
// tenants.settings JSONB字段结构

interface TenantSettings {
  quoteModeConfig?: {
    defaultMode: 'SIMPLE' | 'ADVANCED';
    simpleModeFields: string[];
    advancedModeFields: string[];
    fieldGroups: Record<string, { label: string; fields: string[] }>;
    defaultValues: Record<string, any>;
    validationRules: Record<string, { required?: boolean; min?: number; max?: number }>;
    allowUserCustomization: boolean;
    updatedAt: string;
  };
}
```

### 用户级配置

```typescript
// users.settings JSONB字段结构

interface UserSettings {
  quoteModeConfig?: {
    preferredMode: 'SIMPLE' | 'ADVANCED';
    customizedFields?: string[];
    useSystemDefault: boolean;
    updatedAt: string;
  };
}
```

---

## 🔧 核心功能实现

### 1. 配置获取 (Get Quote Config)

#### 业务逻辑

1. 查询用户配置
2. 如果用户配置存在且 `useSystemDefault=false`,返回用户配置
3. 否则查询租户配置
4. 如果租户配置存在,返回租户配置
5. 否则返回系统默认配置

#### 实现代码

```typescript
// src/features/quotes/actions/get-quote-config.ts

'use server';

import { db } from '@/shared/api/db';
import { users, tenants } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { SYSTEM_DEFAULT_QUOTE_CONFIG } from '../config/quote-mode-config';

export interface QuoteConfigResponse {
  config: TenantQuoteModeConfig;
  source: 'USER' | 'TENANT' | 'SYSTEM';
}

export async function getQuoteConfig(userId: string, tenantId: string): Promise<QuoteConfigResponse> {
  // 步骤1: 查询用户配置
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      settings: true,
    },
  });

  const userConfig = user?.settings?.quoteModeConfig;

  // 步骤2: 如果用户配置存在且未使用系统默认,返回用户配置
  if (userConfig && !userConfig.useSystemDefault) {
    // 将用户配置转换为完整配置格式
    const mergedConfig = mergeUserConfig(userConfig, tenantId);
    return {
      config: mergedConfig,
      source: 'USER',
    };
  }

  // 步骤3: 查询租户配置
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    columns: {
      settings: true,
    },
  });

  const tenantConfig = tenant?.settings?.quoteModeConfig;

  // 步骤4: 如果租户配置存在,返回租户配置
  if (tenantConfig) {
    return {
      config: tenantConfig,
      source: 'TENANT',
    };
  }

  // 步骤5: 返回系统默认配置
  return {
    config: SYSTEM_DEFAULT_QUOTE_CONFIG,
    source: 'SYSTEM',
  };
}

async function mergeUserConfig(
  userConfig: UserQuoteModeConfig,
  tenantId: string
): Promise<TenantQuoteModeConfig> {
  // 如果用户自定义了字段列表,使用用户配置
  if (userConfig.customizedFields && userConfig.customizedFields.length > 0) {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
      columns: {
        settings: true,
      },
    });

    const tenantConfig = tenant?.settings?.quoteModeConfig || SYSTEM_DEFAULT_QUOTE_CONFIG;

    return {
      ...tenantConfig,
      simpleModeFields: userConfig.customizedFields,
      defaultMode: userConfig.preferredMode,
    };
  }

  // 否则使用租户配置或系统默认配置
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    columns: {
      settings: true,
    },
  });

  const tenantConfig = tenant?.settings?.quoteModeConfig || SYSTEM_DEFAULT_QUOTE_CONFIG;

  return {
    ...tenantConfig,
    defaultMode: userConfig.preferredMode,
  };
}
```

### 2. 更新租户配置 (Update Tenant Config)

#### 业务逻辑

1. 验证配置数据
2. 更新 `tenants.settings.quoteModeConfig`
3. 返回更新后的配置

#### 实现代码

```typescript
// src/features/quotes/actions/update-tenant-config.ts

'use server';

import { db } from '@/shared/api/db';
import { tenants } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';

const updateTenantConfigSchema = z.object({
  tenantId: z.string().uuid(),
  config: z.object({
    defaultMode: z.enum(['SIMPLE', 'ADVANCED']),
    simpleModeFields: z.array(z.string()),
    advancedModeFields: z.array(z.string()),
    fieldGroups: z.record(z.object({
      label: z.string(),
      fields: z.array(z.string()),
    })),
    defaultValues: z.record(z.any()),
    validationRules: z.record(z.object({
      required: z.boolean().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
    })),
    allowUserCustomization: z.boolean(),
  }),
});

export const updateTenantConfigAction = createSafeAction(
  updateTenantConfigSchema,
  async ({ tenantId, config }) => {
    // 步骤1: 查询租户当前配置
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
      columns: {
        settings: true,
      },
    });

    if (!tenant) {
      return {
        error: 'Tenant not found',
      };
    }

    // 步骤2: 合并配置
    const updatedSettings = {
      ...tenant.settings,
      quoteModeConfig: {
        ...config,
        updatedAt: new Date().toISOString(),
      },
    };

    // 步骤3: 更新租户配置
    await db.update(tenants)
      .set({
        settings: updatedSettings,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId));

    return {
      success: true,
      config: updatedSettings.quoteModeConfig,
    };
  }
);
```

### 3. 更新用户配置 (Update User Config)

#### 业务逻辑

1. 验证配置数据
2. 检查租户是否允许用户自定义
3. 更新 `users.settings.quoteModeConfig`
4. 返回更新后的配置

#### 实现代码

```typescript
// src/features/quotes/actions/update-user-config.ts

'use server';

import { db } from '@/shared/api/db';
import { users, tenants } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';

const updateUserConfigSchema = z.object({
  userId: z.string().uuid(),
  tenantId: z.string().uuid(),
  config: z.object({
    preferredMode: z.enum(['SIMPLE', 'ADVANCED']),
    customizedFields: z.array(z.string()).optional(),
    useSystemDefault: z.boolean(),
  }),
});

export const updateUserConfigAction = createSafeAction(
  updateUserConfigSchema,
  async ({ userId, tenantId, config }) => {
    // 步骤1: 查询租户配置,检查是否允许用户自定义
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
      columns: {
        settings: true,
      },
    });

    const tenantConfig = tenant?.settings?.quoteModeConfig;

    if (tenantConfig && !tenantConfig.allowUserCustomization && config.customizedFields) {
      return {
        error: 'Tenant does not allow user customization',
      };
    }

    // 步骤2: 查询用户当前配置
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        settings: true,
      },
    });

    if (!user) {
      return {
        error: 'User not found',
      };
    }

    // 步骤3: 合并配置
    const updatedSettings = {
      ...user.settings,
      quoteModeConfig: {
        ...config,
        updatedAt: new Date().toISOString(),
      },
    };

    // 步骤4: 更新用户配置
    await db.update(users)
      .set({
        settings: updatedSettings,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return {
      success: true,
      config: updatedSettings.quoteModeConfig,
    };
  }
);
```

---

## 🎨 前端动态表单

### 组件结构

```
src/features/quotes/components/
├── DynamicQuoteForm.tsx           # 动态表单主组件
├── QuoteModeToggle.tsx            # 模式切换按钮
├── FieldGroup.tsx                 # 字段分组组件
└── fields/
    ├── RoomTypeField.tsx
    ├── ProductSkuField.tsx
    ├── WidthField.tsx
    ├── HeightField.tsx
    └── ...
```

### 动态表单组件

```typescript
// src/features/quotes/components/DynamicQuoteForm.tsx

'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuoteConfig } from '../hooks/use-quote-config';
import { QuoteModeToggle } from './QuoteModeToggle';
import { FieldGroup } from './FieldGroup';

interface Props {
  category: string;
  defaultMode?: 'SIMPLE' | 'ADVANCED';
  onSubmit: (data: any) => void;
}

export function DynamicQuoteForm({ category, defaultMode = 'SIMPLE', onSubmit }: Props) {
  const [currentMode, setCurrentMode] = useState<'SIMPLE' | 'ADVANCED'>(defaultMode);
  const { config, isLoading } = useQuoteConfig();
  const methods = useForm();

  const fields = currentMode === 'SIMPLE' 
    ? config?.simpleModeFields || []
    : config?.advancedModeFields || [];

  const fieldGroups = config?.fieldGroups || {};

  // 切换模式时保留已录入数据
  const handleModeChange = (newMode: 'SIMPLE' | 'ADVANCED') => {
    const currentData = methods.getValues();
    setCurrentMode(newMode);
    
    // 延迟设置值,确保模式已切换
    setTimeout(() => {
      methods.reset(currentData);
    }, 0);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={methods.handleSubmit(onSubmit)}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          {currentMode === 'SIMPLE' ? 'Quick Quote' : 'Advanced Quote'}
        </h2>
        <QuoteModeToggle
          currentMode={currentMode}
          onModeChange={handleModeChange}
        />
      </div>

      {Object.entries(fieldGroups).map(([groupId, group]) => {
        const groupFields = group.fields.filter(field => fields.includes(field));
        
        if (groupFields.length === 0) {
          return null;
        }

        return (
          <FieldGroup
            key={groupId}
            label={group.label}
            fields={groupFields}
            category={category}
            control={methods.control}
          />
        );
      })}

      <button type="submit" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
        Save
      </button>
    </form>
  );
}
```

### 模式切换组件

```typescript
// src/features/quotes/components/QuoteModeToggle.tsx

'use client';

interface Props {
  currentMode: 'SIMPLE' | 'ADVANCED';
  onModeChange: (mode: 'SIMPLE' | 'ADVANCED') => void;
}

export function QuoteModeToggle({ currentMode, onModeChange }: Props) {
  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => onModeChange(currentMode === 'SIMPLE' ? 'ADVANCED' : 'SIMPLE')}
        className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {currentMode === 'SIMPLE' ? 'Advanced ▼' : 'Simple ▲'}
      </button>
    </div>
  );
}
```

### 字段分组组件

```typescript
// src/features/quotes/components/FieldGroup.tsx

'use client';

import { Control } from 'react-hook-form';
import { RoomTypeField } from './fields/RoomTypeField';
import { ProductSkuField } from './fields/ProductSkuField';
import { WidthField } from './fields/WidthField';
import { HeightField } from './fields/HeightField';
// ... 其他字段

interface Props {
  label: string;
  fields: string[];
  category: string;
  control: Control<any>;
}

const FIELD_COMPONENTS: Record<string, React.FC<any>> = {
  roomType: RoomTypeField,
  productSku: ProductSkuField,
  width: WidthField,
  height: HeightField,
  // ... 其他字段
};

export function FieldGroup({ label, fields, category, control }: Props) {
  return (
    <div className="mb-6">
      <h3 className="text-md font-medium text-gray-900 mb-3">{label}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(fieldId => {
          const FieldComponent = FIELD_COMPONENTS[fieldId];
          
          if (!FieldComponent) {
            console.warn(`Field component not found: ${fieldId}`);
            return null;
          }

          return (
            <FieldComponent
              key={fieldId}
              name={fieldId}
              control={control}
              category={category}
            />
          );
        })}
      </div>
    </div>
  );
}
```

### 自定义Hook

```typescript
// src/features/quotes/hooks/use-quote-config.ts

'use client';

import { useQuery } from '@tanstack/react-query';
import { getQuoteConfig } from '../actions/get-quote-config';

export function useQuoteConfig() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['quote-config'],
    queryFn: async () => {
      // 从session获取userId和tenantId
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      
      return getQuoteConfig(session.user.id, session.user.tenantId);
    },
    staleTime: 5 * 60 * 1000, // 5分钟
  });

  return {
    config: data?.config,
    source: data?.source,
    isLoading,
    error,
  };
}
```

---

## 🧪 测试用例

### 单元测试

```typescript
// src/features/quotes/__tests__/quote-config.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { getQuoteConfig } from '../actions/get-quote-config';

describe('Quote Mode Config', () => {
  let userId: string;
  let tenantId: string;

  beforeEach(() => {
    userId = 'user-id';
    tenantId = 'tenant-id';
  });

  describe('getQuoteConfig', () => {
    it('应该返回用户配置(如果存在)', async () => {
      // 设置用户配置
      await setUserConfig(userId, {
        preferredMode: 'SIMPLE',
        useSystemDefault: false,
      });

      const result = await getQuoteConfig(userId, tenantId);

      expect(result.source).toBe('USER');
      expect(result.config.defaultMode).toBe('SIMPLE');
    });

    it('应该返回租户配置(如果用户使用系统默认)', async () => {
      // 设置用户配置为使用系统默认
      await setUserConfig(userId, {
        preferredMode: 'SIMPLE',
        useSystemDefault: true,
      });

      // 设置租户配置
      await setTenantConfig(tenantId, {
        defaultMode: 'ADVANCED',
        // ... 其他配置
      });

      const result = await getQuoteConfig(userId, tenantId);

      expect(result.source).toBe('TENANT');
      expect(result.config.defaultMode).toBe('ADVANCED');
    });

    it('应该返回系统默认配置(如果没有用户和租户配置)', async () => {
      const result = await getQuoteConfig(userId, tenantId);

      expect(result.source).toBe('SYSTEM');
      expect(result.config).toEqual(SYSTEM_DEFAULT_QUOTE_CONFIG);
    });
  });

  describe('updateTenantConfig', () => {
    it('应该更新租户配置', async () => {
      const newConfig = {
        defaultMode: 'ADVANCED' as const,
        simpleModeFields: ['field1', 'field2'],
        advancedModeFields: ['field1', 'field2', 'field3'],
        fieldGroups: {},
        defaultValues: {},
        validationRules: {},
        allowUserCustomization: true,
      };

      const result = await updateTenantConfigAction({ tenantId, config: newConfig });

      expect(result.success).toBe(true);
      expect(result.config.defaultMode).toBe('ADVANCED');
    });
  });

  describe('updateUserConfig', () => {
    it('应该更新用户配置', async () => {
      const newConfig = {
        preferredMode: 'ADVANCED' as const,
        useSystemDefault: false,
      };

      const result = await updateUserConfigAction({ userId, tenantId, config: newConfig });

      expect(result.success).toBe(true);
      expect(result.config.preferredMode).toBe('ADVANCED');
    });

    it('如果租户不允许用户自定义,应该返回错误', async () => {
      // 设置租户配置不允许用户自定义
      await setTenantConfig(tenantId, {
        allowUserCustomization: false,
        // ... 其他配置
      });

      const newConfig = {
        preferredMode: 'ADVANCED' as const,
        customizedFields: ['field1', 'field2'],
        useSystemDefault: false,
      };

      const result = await updateUserConfigAction({ userId, tenantId, config: newConfig });

      expect(result.error).toBe('Tenant does not allow user customization');
    });
  });
});
```

### 集成测试

```typescript
// e2e/flows/quote-mode-config.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Quote Mode Configuration', () => {
  test('模式切换流程', async ({ page }) => {
    // 步骤1: 打开报价单页面
    await page.goto('/quotes/new');
    await expect(page.locator('text="Quick Quote"')).toBeVisible();

    // 步骤2: 切换到高级模式
    await page.click('button:has-text("Advanced ▼")');
    await expect(page.locator('text="Advanced Quote"')).toBeVisible();
    await expect(page.locator('[name="installPosition"]')).toBeVisible();

    // 步骤3: 填写数据
    await page.fill('[name="width"]', '200');
    await page.fill('[name="height"]', '250');

    // 步骤4: 切换回简单模式
    await page.click('button:has-text("Simple ▲")');
    await expect(page.locator('text="Quick Quote"')).toBeVisible();
    await expect(page.locator('[name="installPosition"]')).toBeHidden();

    // 步骤5: 验证数据保留
    await expect(page.locator('[name="width"]')).toHaveValue('200');
    await expect(page.locator('[name="height"]')).toHaveValue('250');
  });

  test('租户配置管理', async ({ page }) => {
    // 步骤1: 打开设置页面
    await page.goto('/settings/quote-config');

    // 步骤2: 修改租户配置
    await page.click('button:has-text("Edit Config")');
    await page.fill('[name="defaultMode"]', 'ADVANCED');
    await page.click('button:has-text("Save")');

    // 步骤3: 验证配置生效
    await page.goto('/quotes/new');
    await expect(page.locator('text="Advanced Quote"')).toBeVisible();
  });
});
```

---

## ✅ 验收标准

### 功能验收

- [ ] 快速模式和高级模式切换流畅
- [ ] 字段正确显示/隐藏
- [ ] 模式切换时数据保留
- [ ] 三级配置优先级正确
- [ ] 租户管理员可以配置字段
- [ ] 用户可以自定义字段(如果允许)

### 性能验收

- [ ] 配置获取响应时间<300ms
- [ ] 模式切换响应时间<100ms
- [ ] 表单渲染时间<500ms

### 用户体验验收

- [ ] 模式切换按钮位置合理
- [ ] 字段分组清晰
- [ ] 数据保留逻辑符合预期

---

## 🔗 相关文档

- [TypeScript类型定义](./typescript-type-definitions.md)
- [报价模块需求文档](../02-requirements/modules/报价单/报价单.md)

---

**最后更新**: 2026-01-16  
**维护者**: 开发团队
