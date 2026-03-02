# Task 23: Upload 模块测试补强（tests=2 → ≥4）

> **任务性质**：测试编写（编程任务）
> **目标**：upload 测试文件从 2 个扩充至 ≥ 4 个，消除 D3 短板
> **模块路径**：`src/features/upload/`
> **评估人**：主线程 AI（不参与编程，只做验收）

---

## 🔍 当前状态（Phase 5 实测）

| 指标 | 当前值 | 目标 | 状态 |
|:---|:---:|:---:|:---:|
| 测试文件数 | **2** | ≥ 4 | 🔴 全 L4 模块最低 |
| AuditService | 5 | — | ✅ Phase 5 已达标 |
| logger | 14 | — | ✅ |
| any 类型 | 0 | 0 | ✅ |
| tsx 组件 | 0 | — | 纯 server actions |

**核心问题**：upload 已升至 L4 但 D3 测试维度仍然很弱（仅 2 个文件），其余 L4 模块均 ≥ 4 个测试文件。

---

## 📋 任务清单

### 前置步骤：了解现有测试
```powershell
# 查看当前测试文件
Get-ChildItem src\features\upload -r -Include "*.test.ts","*.test.tsx" | Select-Object Name

# 查看 action 文件（用于确定测试目标）
Get-ChildItem src\features\upload -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-Object Name
```

### 新增测试文件 A：`security.test.ts`（安全与权限测试）

路径：`src/features/upload/__tests__/security.test.ts`

```typescript
describe('Upload 安全与权限', () => {
    it('无 session 的上传请求应被拒绝')
    it('租户 A 无法访问租户 B 上传的文件')
    it('非法 tenantId 请求应返回错误')
    it('上传操作应记录审计日志（AuditService）')
})
```

### 新增测试文件 B：`error-handling.test.ts`（错误处理测试）

路径：`src/features/upload/__tests__/error-handling.test.ts`

```typescript
describe('Upload 错误处理', () => {
    it('数据库写入失败时应返回友好错误信息')
    it('文件存储服务不可用时应正确降级处理')
    it('并发上传同名文件时应正确处理冲突')
    it('超时请求应返回 408 状态码或相应错误')
})
```

### 重要注意事项

1. **必须 mock 数据库**，不可真实查询（参考现有测试的 mock 写法）
2. **不要修改现有的 2 个测试文件**
3. mock 导入要参考同目录其他测试文件的 `vi.mock` 模式
4. 如果 action 中依赖 `@/shared/lib/auth`，也需要 mock

---

## ✅ 验收清单

```powershell
# 1. 测试文件数（必须 ≥ 4）
(Get-ChildItem src\features\upload -r -Include "*.test.ts","*.test.tsx").Count

# 2. 测试全通过
npx vitest run src/features/upload
# 期望：Exit code 0，0 个失败

# 3. tsc 编译
npx tsc --noEmit 2>&1 | Select-String "upload"
# 期望：无输出
```

## 交付说明
完成后宣告"Task 23 完成"，报告新增测试文件名和各文件的用例数量。
