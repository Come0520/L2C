# 云展厅模块 L3→L4 升级实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 将云展厅模块从 L3 (5.8/10) 升级至 L4 (≥ 7.5/10)，主攻测试覆盖 (D3: 1→7)、文档完整性 (D4: 3→7)、代码质量 (D2: 7→8)

**架构:** 先补齐重点逻辑的单元/集成测试（D3 是升级硬性瓶颈），再消除类型问题，最后完善功能闭环和文档。所有测试使用 Vitest 4.x + Mock db 层。

**技术栈:** Vitest 4.x, TypeScript, Drizzle ORM (mock), DOMPurify, Redis (mock), Zod

---

## 前置知识

### 项目结构

```
src/features/showroom/
├── actions/
│   ├── index.ts              # 统一导出
│   ├── items.ts              # 素材 CRUD (243 行) — 核心业务
│   ├── shares.ts             # 分享链接 (139 行) — 核心业务
│   └── schema.ts             # Zod 校验 (49 行)

src/app/(dashboard)/showroom/
├── page.tsx                  # 列表页 Server Component
├── [showroomId]/page.tsx     # 详情页 Server Component
└── components/
    ├── showroom-client-page.tsx     # 列表客户端页
    ├── showroom-card.tsx            # 卡片组件
    ├── showroom-detail-client.tsx   # 详情页（双布局系统）
    ├── showroom-table.tsx           # 表格视图
    ├── add-resource-dialog.tsx      # 新增素材对话框
    └── image-gallery.tsx            # 图片画廊

src/shared/api/schema/showroom.ts   # DB Schema (2 张表 + 6 索引)
src/features/settings/components/showroom-settings-config.tsx  # 设置组件
```

### 运行测试命令

```powershell
# 运行全部测试
pnpm test:run

# 运行云展厅模块测试
pnpm test:run src/features/showroom/

# 运行指定测试文件
pnpm test:run src/features/showroom/actions/__tests__/items.test.ts

# TypeScript 类型检查
npx tsc --noEmit
```

### 当前测试覆盖范围

**零覆盖** — 模块内无任何 `__tests__/` 目录或测试文件。

### 核心业务逻辑清单

| 函数 | 文件 | 行号 | 关键点 |
|:---|:---|:---:|:---|
| `calculateScore()` | items.ts | L16-23 | 纯函数，评分算法 |
| `canCreateShowroomItem()` | items.ts | L90-96 | 权限检查：Admin/PM + 租户开关 |
| `canManageShowroomItem()` | items.ts | L99-104 | 权限检查：Owner + Admin/PM |
| `createShowroomItem()` | items.ts | L106-145 | 创建 + XSS 清洗 + 审计 |
| `updateShowroomItem()` | items.ts | L147-205 | 更新 + 所有者校验 + 审计 |
| `deleteShowroomItem()` | items.ts | L207-242 | 软删除 ARCHIVED + 审计 |
| `getShowroomItems()` | items.ts | L25-69 | 列表查询 + 筛选 + 分页 |
| `getShowroomItem()` | items.ts | L71-87 | 单条查询 + ARCHIVED 过滤 |
| `createShareLink()` | shares.ts | L14-43 | 创建分享 + 过期时间 + 审计 |
| `getShareContent()` | shares.ts | L45-138 | 公开访问 + Redis 限流 + 采样回写 |

---

## Task 1: 为 `calculateScore` 编写单元测试

**优先级:** P0（D3 主要提升点 — 纯函数最易测试）

**Files:**
- New: `src/features/showroom/actions/__tests__/items.test.ts`
- Reference: `src/features/showroom/actions/items.ts:16-23`

### Step 1: 创建测试文件骨架

> 注意: `calculateScore` 未导出，需要先将其改为命名导出或创建独立的测试辅助导出。
> 推荐方案：将 `calculateScore` 改为 `export function`（它是纯函数，导出不影响安全性）。

先修改 `items.ts` L16：
```typescript
// items.ts L16: 将 const calculateScore 改为 export function
export function calculateScore(data: Partial<z.infer<typeof createShowroomItemSchema>>) {
```

### Step 2: 编写测试用例

```typescript
import { describe, it, expect } from 'vitest';
import { calculateScore } from '../items';

describe('calculateScore() 评分算法', () => {
    it('空数据应返回基础分20', () => {
        expect(calculateScore({})).toBe(20);
    });

    it('有图片应加20分', () => {
        expect(calculateScore({ images: ['https://example.com/img.jpg'] })).toBe(40);
    });

    it('内容超过50字应加20分', () => {
        const longContent = 'a'.repeat(51);
        expect(calculateScore({ content: longContent })).toBe(40);
    });

    it('内容不足50字不应加分', () => {
        expect(calculateScore({ content: '短文本' })).toBe(20);
    });

    it('有 productId 应加20分', () => {
        expect(calculateScore({ productId: 'prod-123' })).toBe(40);
    });

    it('有标签应加20分', () => {
        expect(calculateScore({ tags: ['现代', '简约'] })).toBe(40);
    });

    it('全部条件满足应返回满分100', () => {
        const fullData = {
            images: ['https://example.com/img.jpg'],
            content: 'a'.repeat(100),
            productId: 'prod-123',
            tags: ['tag1'],
        };
        expect(calculateScore(fullData)).toBe(100);
    });

    it('空图片数组不应加分', () => {
        expect(calculateScore({ images: [] })).toBe(20);
    });

    it('空标签数组不应加分', () => {
        expect(calculateScore({ tags: [] })).toBe(20);
    });
});
```

### Step 3: 运行测试

```powershell
pnpm test:run src/features/showroom/actions/__tests__/items.test.ts
```

预期：全部 9 个用例 PASS

### Step 4: 提交

```powershell
git add src/features/showroom/actions/__tests__/items.test.ts src/features/showroom/actions/items.ts
git commit -m "test(showroom): 为 calculateScore 纯函数编写 9 个单元测试"
```

---

## Task 2: 为权限检查函数编写单元测试

**优先级:** P0

**Files:**
- Modify: `src/features/showroom/actions/__tests__/items.test.ts`
- Modify: `src/features/showroom/actions/items.ts` (导出权限函数)
- Reference: `src/features/showroom/actions/items.ts:90-104`

### Step 1: 导出权限函数

将 `items.ts` 中的两个权限函数从私有改为导出：

```typescript
// items.ts L90: async function → export async function
export async function canCreateShowroomItem(session: Session) { ... }

// items.ts L99: async function → export async function
export async function canManageShowroomItem(session: Session, ownerId: string) { ... }
```

### Step 2: Mock 依赖并编写测试

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock auth 和 permission 模块
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/features/settings/actions/system-settings-actions', () => ({
    getSetting: vi.fn(),
}));

import { canCreateShowroomItem, canManageShowroomItem } from '../items';
import { checkPermission } from '@/shared/lib/auth';
import { getSetting } from '@/features/settings/actions/system-settings-actions';

describe('canCreateShowroomItem() 权限检查', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    const mockSession = (userId: string) => ({
        user: { id: userId, tenantId: 't1' },
    }) as any;

    it('拥有 PRODUCTS.MANAGE 权限应返回 true', async () => {
        vi.mocked(checkPermission).mockResolvedValueOnce(true);
        expect(await canCreateShowroomItem(mockSession('u1'))).toBe(true);
    });

    it('拥有 ADMIN.SETTINGS 权限应返回 true', async () => {
        vi.mocked(checkPermission)
            .mockResolvedValueOnce(false)   // PRODUCTS.MANAGE
            .mockResolvedValueOnce(true);   // ADMIN.SETTINGS
        expect(await canCreateShowroomItem(mockSession('u1'))).toBe(true);
    });

    it('租户开关开启时普通用户应返回 true', async () => {
        vi.mocked(checkPermission).mockResolvedValue(false);
        vi.mocked(getSetting).mockResolvedValue(true);
        expect(await canCreateShowroomItem(mockSession('u1'))).toBe(true);
    });

    it('无权限且开关关闭时应返回 false', async () => {
        vi.mocked(checkPermission).mockResolvedValue(false);
        vi.mocked(getSetting).mockResolvedValue(false);
        expect(await canCreateShowroomItem(mockSession('u1'))).toBe(false);
    });
});

describe('canManageShowroomItem() 权限检查', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    const mockSession = (userId: string) => ({
        user: { id: userId, tenantId: 't1' },
    }) as any;

    it('创建者本人应返回 true', async () => {
        expect(await canManageShowroomItem(mockSession('user-1'), 'user-1')).toBe(true);
    });

    it('非创建者但有高级权限应返回 true', async () => {
        vi.mocked(checkPermission).mockResolvedValueOnce(true);
        expect(await canManageShowroomItem(mockSession('user-2'), 'user-1')).toBe(true);
    });

    it('非创建者且无权限应返回 false', async () => {
        vi.mocked(checkPermission).mockResolvedValue(false);
        expect(await canManageShowroomItem(mockSession('user-2'), 'user-1')).toBe(false);
    });
});
```

### Step 3: 运行测试

```powershell
pnpm test:run src/features/showroom/actions/__tests__/items.test.ts
```

预期：全部 PASS

### Step 4: 提交

```powershell
git add src/features/showroom/actions/__tests__/items.test.ts src/features/showroom/actions/items.ts
git commit -m "test(showroom): 为权限检查函数编写 7 个单元测试"
```

---

## Task 3: 为 CRUD Actions 编写集成测试

**优先级:** P0

**Files:**
- Modify: `src/features/showroom/actions/__tests__/items.test.ts`
- Reference: `src/features/showroom/actions/items.ts:106-242`

### Step 1: 扩展 Mock 并编写创建/更新/删除测试

需要 Mock `db`、`auth`、`revalidatePath`、`AuditService`、`DOMPurify`：

```typescript
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            showroomItems: {
                findFirst: vi.fn(),
                findMany: vi.fn(),
            },
        },
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn(() => [{
                    id: 'item-new',
                    title: '测试素材',
                    type: 'CASE',
                    tenantId: 't1',
                    createdBy: 'u1',
                }]),
            })),
        })),
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => ({
                    returning: vi.fn(() => [{
                        id: 'item-1',
                        title: '更新后的标题',
                    }]),
                })),
            })),
        })),
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => [{ count: 5 }]),
            })),
        })),
    },
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: { record: vi.fn() },
}));

vi.mock('isomorphic-dompurify', () => ({
    default: { sanitize: vi.fn((html: string) => html) },
}));

import { createShowroomItem, updateShowroomItem, deleteShowroomItem, getShowroomItem } from '../items';
import { auth } from '@/shared/lib/auth';
import { AuditService } from '@/shared/lib/audit-service';
import { db } from '@/shared/api/db';

describe('createShowroomItem() 集成测试', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue({
            user: { id: 'u1', tenantId: 't1' },
        } as any);
        vi.mocked(checkPermission).mockResolvedValue(true); // 有权限
    });

    it('应成功创建素材并记录审计日志', async () => {
        const result = await createShowroomItem({
            type: 'CASE',
            title: '测试案例',
            content: '这是一个测试案例的详细描述内容',
            images: ['https://example.com/img1.jpg'],
            tags: ['现代', '简约'],
            status: 'PUBLISHED',
        });

        expect(result.id).toBe('item-new');
        expect(AuditService.record).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'CREATE',
                tableName: 'showroom_items',
            })
        );
    });

    it('未授权用户应抛出错误', async () => {
        vi.mocked(auth).mockResolvedValue(null as any);
        await expect(
            createShowroomItem({
                type: 'CASE', title: '测试', images: [], tags: [], status: 'DRAFT',
            })
        ).rejects.toThrow('Unauthorized');
    });

    it('无创建权限应抛出权限错误', async () => {
        vi.mocked(checkPermission).mockResolvedValue(false);
        vi.mocked(getSetting).mockResolvedValue(false);
        await expect(
            createShowroomItem({
                type: 'CASE', title: '测试', images: [], tags: [], status: 'DRAFT',
            })
        ).rejects.toThrow('无权创建');
    });
});

describe('deleteShowroomItem() 软删除', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue({
            user: { id: 'u1', tenantId: 't1' },
        } as any);
        vi.mocked(checkPermission).mockResolvedValue(true);
    });

    it('应软删除（标记 ARCHIVED）并记录审计日志', async () => {
        vi.mocked(db.query.showroomItems.findFirst).mockResolvedValue({
            id: 'item-1', title: '待删除', createdBy: 'u1', tenantId: 't1',
        } as any);

        const result = await deleteShowroomItem({ id: 'item-1' });
        expect(result.success).toBe(true);
        expect(AuditService.record).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'DELETE',
                tableName: 'showroom_items',
            })
        );
    });

    it('素材不存在应抛出错误', async () => {
        vi.mocked(db.query.showroomItems.findFirst).mockResolvedValue(undefined);
        await expect(deleteShowroomItem({ id: 'nonexistent' }))
            .rejects.toThrow('Item not found');
    });
});
```

### Step 2: 运行测试

```powershell
pnpm test:run src/features/showroom/actions/__tests__/items.test.ts
```

预期：≥ 20 个用例 PASS

### Step 3: 提交

```powershell
git add src/features/showroom/actions/__tests__/items.test.ts
git commit -m "test(showroom): 为 CRUD Actions 编写集成测试含审计日志验证"
```

---

## Task 4: 为分享链接编写集成测试

**优先级:** P1

**Files:**
- New: `src/features/showroom/actions/__tests__/shares.test.ts`
- Reference: `src/features/showroom/actions/shares.ts`

### Step 1: 编写分享链接创建和查看测试

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            showroomShares: { findFirst: vi.fn() },
            showroomItems: { findMany: vi.fn() },
        },
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn(() => [{
                    id: 'share-new', tenantId: 't1', salesId: 'u1',
                    expiresAt: new Date(Date.now() + 86400000),
                }]),
            })),
        })),
        update: vi.fn(() => ({
            set: vi.fn(() => ({ where: vi.fn() })),
        })),
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: { record: vi.fn() },
}));

vi.mock('@/shared/middleware/rate-limit', () => ({
    checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));

vi.mock('@/shared/lib/redis', () => ({
    redis: { incr: vi.fn(), get: vi.fn().mockResolvedValue(10) },
}));

vi.mock('next/headers', () => ({
    headers: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue('127.0.0.1'),
    }),
}));

import { createShareLink, getShareContent } from '../shares';
import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';
import { AuditService } from '@/shared/lib/audit-service';

describe('createShareLink() 分享链接创建', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue({
            user: { id: 'u1', tenantId: 't1' },
        } as any);
    });

    it('应成功创建分享链接', async () => {
        const result = await createShareLink({
            items: [{ itemId: 'item-1' }],
            expiresInDays: 7,
        });
        expect(result.id).toBe('share-new');
        expect(AuditService.record).toHaveBeenCalled();
    });

    it('空 items 应被 Zod 拦截', async () => {
        await expect(
            createShareLink({ items: [], expiresInDays: 7 })
        ).rejects.toThrow();
    });
});

describe('getShareContent() 公开访问', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('分享不存在应返回 null', async () => {
        vi.mocked(db.query.showroomShares.findFirst).mockResolvedValue(undefined);
        const result = await getShareContent('nonexistent-uuid');
        expect(result).toBeNull();
    });

    it('过期分享应返回 expired=true', async () => {
        vi.mocked(db.query.showroomShares.findFirst).mockResolvedValue({
            id: 'share-1',
            expiresAt: new Date('2020-01-01'), // 已过期
            itemsSnapshot: [],
            sales: { name: '张三' },
        } as any);

        const result = await getShareContent('share-1');
        expect(result).not.toBeNull();
        expect(result!.expired).toBe(true);
    });
});
```

### Step 2: 运行测试

```powershell
pnpm test:run src/features/showroom/actions/__tests__/shares.test.ts
```

### Step 3: 提交

```powershell
git add src/features/showroom/actions/__tests__/shares.test.ts
git commit -m "test(showroom): 为分享链接 CRUD 编写集成测试含过期和限流验证"
```

---

## Task 5: 消除 4 处 `any` / `as unknown` 类型断言

**优先级:** P1（D2 提升）

**Files:**
- Modify: `src/app/(dashboard)/showroom/page.tsx:15`
- Modify: `src/app/(dashboard)/showroom/components/add-resource-dialog.tsx:40`
- Modify: `src/features/settings/components/showroom-settings-config.tsx:32,46`

### Step 1: 修复 `page.tsx` 中的 `as any`

```typescript
// page.tsx L15: type: type === 'all' ? undefined : (type as any),
// 替换为：
type: type === 'all' ? undefined : (type as 'PRODUCT' | 'CASE' | 'KNOWLEDGE' | 'TRAINING'),
```

### Step 2: 修复 `add-resource-dialog.tsx` 中的 `as any`

```typescript
// add-resource-dialog.tsx L40: 
// resolver: zodResolver(createShowroomItemSchema) as any,
// 替换为（去掉 as any，修复 zodResolver 类型）：
resolver: zodResolver(createShowroomItemSchema),
```

如果出现类型不兼容，需要确认 `@hookform/resolvers/zod` 版本与 `react-hook-form` 版本兼容性。如果确实不兼容，保留 `as any` 但添加注释说明原因。

### Step 3: 修复 `showroom-settings-config.tsx` 中的 `as unknown as`

```typescript
// L32: form.reset(settings as unknown as ShowroomSettingsFormData);
// 改为：安全解构赋值
const parsed: ShowroomSettingsFormData = {
    ENABLE_SHOWROOM_WRITE_FOR_ALL: Boolean(settings?.ENABLE_SHOWROOM_WRITE_FOR_ALL ?? true),
};
form.reset(parsed);

// L46: await batchUpdateSettings(data as unknown as Record<string, unknown>);
// 改为：
await batchUpdateSettings({ ENABLE_SHOWROOM_WRITE_FOR_ALL: data.ENABLE_SHOWROOM_WRITE_FOR_ALL });
```

### Step 4: 运行类型检查

```powershell
npx tsc --noEmit
```

### Step 5: 提交

```powershell
git add src/app/(dashboard)/showroom/page.tsx src/app/(dashboard)/showroom/components/add-resource-dialog.tsx src/features/settings/components/showroom-settings-config.tsx
git commit -m "refactor(showroom): 消除 4 处 any/unknown 类型断言，提升类型安全"
```

---

## Task 6: 绑定「分享给客户」按钮到 createShareLink

**优先级:** P2（D1 功能闭环）

**Files:**
- Modify: `src/app/(dashboard)/showroom/components/showroom-detail-client.tsx:223-225, 393-395`
- Modify: `src/app/(dashboard)/showroom/components/showroom-card.tsx:154-160`

### Step 1: 在详情页实现分享弹窗

在 `showroom-detail-client.tsx` 中：

1. 导入 `createShareLink` Action
2. 添加 `handleShare` 函数，点击按钮时调用 `createShareLink` 并生成分享链接 URL
3. 成功后弹出 Toast 并复制链接到剪贴板

```typescript
// 在 ProductLayout 组件内添加：
const [isSharing, setIsSharing] = useState(false);

const handleShare = async () => {
    setIsSharing(true);
    try {
        const share = await createShareLink({
            items: [{ itemId: item.id }],
            expiresInDays: 15,
        });
        const shareUrl = `${window.location.origin}/share/${share.id}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success('分享链接已复制到剪贴板');
    } catch (error) {
        toast.error('分享失败');
    } finally {
        setIsSharing(false);
    }
};
```

4. 将分享按钮的 `onClick` 绑定到 `handleShare`

### Step 2: 对 ArticleLayout 做同样处理

### Step 3: 运行类型检查

```powershell
npx tsc --noEmit
```

### Step 4: 提交

```powershell
git add src/app/(dashboard)/showroom/components/showroom-detail-client.tsx src/app/(dashboard)/showroom/components/showroom-card.tsx
git commit -m "feat(showroom): 绑定分享按钮到 createShareLink Action"
```

---

## Task 7: 移除/降级未实现 CTA 按钮

**优先级:** P2（D1 功能诚实性）

**Files:**
- Modify: `src/app/(dashboard)/showroom/components/showroom-detail-client.tsx`

### Step 1: 处理未实现功能按钮

对「下载大图」「加入选品」「收藏」三个按钮，选择以下策略之一：

- **方案 A（推荐）**：添加 `disabled` 属性 + `title="功能开发中"` 提示
- **方案 B**：临时移除按钮，待后续迭代实现

```typescript
// 例：下载大图按钮改为
<Button variant="outline" className="rounded-xl" disabled title="功能开发中">
    <Download className="mr-2 h-4 w-4" /> 下载大图
</Button>
```

### Step 2: 提交

```powershell
git add src/app/(dashboard)/showroom/components/showroom-detail-client.tsx
git commit -m "fix(showroom): 标记未实现 CTA 按钮为 disabled 避免用户困惑"
```

---

## Task 8: 创建模块需求文档 + JSDoc 补充

**优先级:** P2（D4 提升）

**Files:**
- New: `docs/02-requirements/modules/showroom.md`
- Modify: `src/features/showroom/actions/items.ts` (添加 JSDoc)
- Modify: `src/features/showroom/actions/shares.ts` (添加 JSDoc)

### Step 1: 创建需求文档

基于代码实现反向输出需求文档，包含：
- 模块概述（云展厅的定位和核心价值）
- 用户角色与权限矩阵
- 功能清单（CRUD / 分享 / 评分 / 搜索筛选）
- 数据模型（2 张表结构说明）
- 业务规则（评分算法、软删除策略、分享过期规则）

### Step 2: 为 Actions 添加 JSDoc

为 `items.ts` 中的 8 个导出函数和 `shares.ts` 中的 2 个导出函数添加中文 JSDoc 注释，包含 `@param`、`@returns`、`@throws` 说明。

### Step 3: 提交

```powershell
git add docs/02-requirements/modules/showroom.md src/features/showroom/actions/items.ts src/features/showroom/actions/shares.ts
git commit -m "docs(showroom): 创建需求文档并为 Actions 补充 JSDoc"
```

---

## 验证计划

### 自动化测试

| 测试类型 | 命令 | 预期结果 |
|:---|:---|:---|
| 现有测试不回归 | `pnpm test:run` | 全部 PASS |
| Items 单元/集成测试 | `pnpm test:run src/features/showroom/actions/__tests__/items.test.ts` | ≥ 20 用例 PASS |
| Shares 集成测试 | `pnpm test:run src/features/showroom/actions/__tests__/shares.test.ts` | ≥ 4 用例 PASS |
| TypeScript 编译 | `npx tsc --noEmit` | 零新增错误 |

### 手动验证

Task 6 完成后，可在浏览器中验证：
1. 启动 `pnpm dev`
2. 进入云展厅列表页 → 点击任意素材进入详情
3. 点击「分享给客户」按钮，确认 Toast 提示 + 剪贴板包含分享链接 URL
4. 用新标签页打开该链接，验证公开分享页能正常展示

### 完成标准

- [ ] `calculateScore` 有 ≥ 9 个单元测试用例
- [ ] `canCreateShowroomItem` / `canManageShowroomItem` 有 ≥ 7 个权限测试用例
- [ ] CRUD Actions 有 ≥ 5 个集成测试用例（创建/删除/未授权/无权限/不存在）
- [ ] 分享链接有 ≥ 4 个集成测试用例（创建/空items/不存在/过期）
- [ ] 零 `as any` / `as unknown` 类型断言（或有明确注释说明不可避免原因）
- [ ] 详情页「分享给客户」按钮功能可用
- [ ] 未实现按钮标记为 `disabled`
- [ ] 需求文档 `showroom.md` 已创建
- [ ] Actions 导出函数有 JSDoc
- [ ] `npx tsc --noEmit` 零新增错误
