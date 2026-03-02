# Task 24 返工：task-status.test.ts 测试断言失败

> **整体验收结果**：JSDoc=50 ✅ | 功能文档 ✅ | tsc 无错误 ✅ | **task-status.test.ts ❌（4 个用例失败）**
> **返工范围**：仅修复 `task-status.test.ts`，其余所有工作均已验收通过

---

## ❌ 精确失败原因

```
AssertionError: expected "vi.fn()" to be called at least once
```

**根因**：你的测试用 `expect(someFunction).toHaveBeenCalled()` 之类的断言，但 mock 没有被实际调用。这通常是以下原因之一：

1. **mock 路径写错**：`vi.mock('@/...')` 的路径与实际导入路径不一致
2. **action 函数内部没有调用你 mock 的函数**：你断言的函数根本不在代码执行路径上
3. **async 处理不当**：测试没有 `await` action 的执行结果

---

## 🔧 修复方法

### Step 1：打开并阅读失败文件
```
src/features/dispatch/__tests__/task-status.test.ts
```

### Step 2：找到 4 个失败用例的断言

找到类似以下模式的断言：
```typescript
expect(mockSomething).toHaveBeenCalled()
// 或
expect(mockSomething).toHaveBeenCalledWith(...)
```

### Step 3：逐一修复

**方案 A：如果 mock 写法有问题**

确保 mock 路径正确，参考 dispatch 模块其他测试文件（如 `task-assignment.test.ts`）的 mock 写法：
```typescript
// ❌ 可能错误的路径
vi.mock('@/features/dispatch/actions/update-status')

// ✅ 查看实际导入路径后再 mock
vi.mock('@/lib/db', () => ({
    db: { /* mock 实现 */ }
}))
```

**方案 B：如果断言本身不合理**

如果该函数确实不会在这个场景下被调用，把断言改为验证返回值或副作用：
```typescript
// ❌ 过于细节的 mock 断言
expect(db.update).toHaveBeenCalled()

// ✅ 改为验证行为结果
const result = await updateTaskStatus(mockData);
expect(result.success).toBe(true);
```

**方案 C：如果是 async 遗漏 await**
```typescript
// ❌ 忘记 await
it('should update task status', () => {
    updateTaskStatus(data);  // 没 await
    expect(mock).toHaveBeenCalled();
});

// ✅ 加上 await
it('should update task status', async () => {
    await updateTaskStatus(data);
    expect(mock).toHaveBeenCalled();
});
```

---

## ✅ 验收命令

```powershell
# 必须 0 个失败
npx vitest run src/features/dispatch
# 期望：Test Files 5 passed (5)，Tests X passed (X)，0 failed
```

## 交付说明
完成后宣告"Task 24 返工完成"，报告修复的用例名称和修复方式。
