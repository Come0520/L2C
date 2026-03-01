# Task 17: Search + Upload 模块测试覆盖大幅补强

> **任务性质**：测试编写（编程任务）
> **目标**：search（测试=1文件→≥4）+ upload（测试=2文件→≥4）
> **模块路径**：`src/features/search/` 和 `src/features/upload/`
> **评估人**：主线程 AI（不参与编程，只做验收）

---

## 🔍 实测发现的核心问题

| 模块 | 测试文件 | 已知问题 | 优先级 |
|:---|:---:|:---|:---:|
| **search** | 1 | 1 个已知失败用例（`result.data?.tickets` = undefined）| 🔴 |
| **upload** | 2 | 仅有基础测试，边界条件覆盖不足 | 🟡 |

---

## 📋 Search 模块任务（最高优先级）

### Step 1：先修复已知失败用例

**定位**：打开 `src/features/search/__tests__/actions.test.ts`

找到失败的用例：
```
Search 模块 L5 升级测试 (globalSearch) > 空结果测试：...应返回空数组结构，且包含所有 8 个业务域
AssertionError: expected undefined to be defined (result.data?.tickets)
```

**问题根因**：`globalSearch` 函数返回的 `data` 对象可能没有 `tickets` 字段，或该字段是动态添加的，但 mock 没有模拟这个字段。

**修复方向**：
1. 查看 `src/features/search/actions/` 下 `globalSearch` 的实现
2. 确认该函数返回值的结构中是否包含 `tickets` 字段
3. **如果代码有 tickets 字段但 mock 缺失** → 在测试中补充 mock
4. **如果代码本身没有 tickets 字段** → 修改测试断言，或实现 tickets 搜索功能

**验收**：
```powershell
npx vitest run src/features/search
# 期望：Exit code 0，0 个失败
```

---

### Step 2：新增 ≥ 3 个测试文件

在 `src/features/search/__tests__/` 下新增以下测试文件：

#### 文件 A：`tenant-isolation.test.ts`（租户隔离安全测试）
```typescript
describe('Search 模块租户隔离', () => {
  it('应拒绝无 tenantId 的搜索请求')
  it('租户 A 的搜索不应返回租户 B 的数据')
  it('空关键词搜索应返回空结果而非报错')
})
```

#### 文件 B：`edge-cases.test.ts`（边界条件测试）
```typescript
describe('Search 边界条件', () => {
  it('超长搜索关键词（>100字符）应正常处理，不崩溃')
  it('包含 SQL 特殊字符（单引号、分号等）应安全过滤')
  it('包含 XSS 字符（<script>等）应安全处理')
  it('搜索范围限制（scope 参数）应正确过滤结果域')
})
```

#### 文件 C：`performance.test.ts`（性能基线测试）
```typescript
describe('Search 性能基线', () => {
  it('正常搜索应在 500ms 内响应')
  it('分页参数应正确限制返回数量')
})
```

**重要提示**：
- 所有测试必须 **mock 数据库**，不可真实查询（参考 `actions.test.ts` 中的 mock 写法）
- mock 格式：
```typescript
vi.mock('@/lib/db', () => ({
  db: {
    query: { /* 模拟各表查询 */ }
  }
}))
```

**验收**：
```powershell
(Get-ChildItem src\features\search -r -Include "*.test.ts","*.test.tsx").Count
# 期望：≥ 4
npx vitest run src/features/search
# 期望：Exit code 0，0 个失败
```

---

## 📋 Upload 模块任务

### 新增 ≥ 2 个测试文件

在 `src/features/upload/__tests__/` 下新增：

#### 文件 A：`file-validation.test.ts`（文件验证测试）
```typescript
describe('Upload 文件验证', () => {
  it('应接受允许的文件类型（如 jpg/png/pdf）')
  it('应拒绝不允许的文件类型（如 exe/sh）')
  it('应拒绝超过大小限制的文件')
  it('文件名包含特殊字符时应安全处理')
  it('空文件（0 字节）应被拒绝并返回明确错误')
})
```

#### 文件 B：`tenant-isolation.test.ts`（租户隔离测试）
```typescript
describe('Upload 租户隔离', () => {
  it('上传文件必须绑定到当前租户')
  it('租户 A 无法访问租户 B 的文件')
  it('无 session 的上传请求应被拒绝')
})
```

**注意**：
- 不要实际读写文件系统，使用 `vi.mock` 模拟文件操作
- 参考现有的 2 个测试文件的写法，保持风格一致

**验收**：
```powershell
(Get-ChildItem src\features\upload -r -Include "*.test.ts","*.test.tsx").Count
# 期望：≥ 4
npx vitest run src/features/upload
# 期望：Exit code 0，0 个失败
```

---

## ✅ 最终验收清单

```powershell
# 1. search 测试文件数
(Get-ChildItem src\features\search -r -Include "*.test.ts","*.test.tsx").Count
# 期望：≥ 4

# 2. search 测试全通过（重点：之前失败的 tickets 用例）
npx vitest run src/features/search
# 期望：Exit code 0

# 3. upload 测试文件数
(Get-ChildItem src\features\upload -r -Include "*.test.ts","*.test.tsx").Count
# 期望：≥ 4

# 4. upload 测试全通过
npx vitest run src/features/upload
# 期望：Exit code 0

# 5. tsc 编译
npx tsc --noEmit 2>&1 | Select-String "search|upload"
# 期望：无输出
```

## 交付说明
完成后宣告"Task 17 完成"，分别报告 search 和 upload 的测试文件数与用例数。
