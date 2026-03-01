# Task 12 返工：Services 层 JSDoc 覆盖率修复 (23.8% → ≥ 90%)

> **背景**：Task 12 主线程复核发现 Services 层 JSDoc 覆盖率严重不足（仅 23.8%），需要立即返工补齐。
> Actions 层、功能需求文档、Schema 注释、架构文档更新均已通过验收，**本次只需补齐 Services 层**。

## ❌ 当前缺陷详情

| 文件 | 方法数 | 已有 JSDoc | 缺口 | 紧迫度 |
|:---|:---:|:---:|:---:|:---:|
| `services/quote-import.service.ts` | 18 | **0** | 18 | 🔴 最严重 |
| `services/quote-version.service.ts` | 16 | 5 | 11 | 🔴 |
| `services/quote-expiration.service.ts` | 14 | 4 | 10 | 🔴 |
| `services/measure-matcher.service.ts` | 6 | 1 | 5 | 🔴 |
| `services/accessory-linkage.service.ts` | 5 | 3 | 2 | 🟡 |
| `services/calculation-service.ts` | 4 | 2 | 2 | 🟡 |
| **合计** | **63** | **15** | **~48** | — |

> 需要新增约 **48 个** JSDoc 注释块才能达到 ≥ 90% 覆盖率。

## 工作范围

你**只能**修改以下路径下的文件，且**仅添加 JSDoc 注释，严禁改动任何业务逻辑代码**：
- `src/features/quotes/services/quote-import.service.ts`
- `src/features/quotes/services/quote-version.service.ts`
- `src/features/quotes/services/quote-expiration.service.ts`
- `src/features/quotes/services/measure-matcher.service.ts`
- `src/features/quotes/services/accessory-linkage.service.ts`
- `src/features/quotes/services/calculation-service.ts`

## JSDoc 规范要求

每个公共方法（含 `async`）必须添加符合以下规范的 JSDoc：

```typescript
/**
 * [一句话中文说明本方法的业务用途]
 *
 * @param paramName - 参数中文说明
 * @param paramName2 - 参数中文说明
 * @returns 返回值的中文说明（含类型描述）
 * @throws {Error} 可能抛出的异常情况说明（如有）
 *
 * @example
 * // 简单用法示例（可选，复杂方法建议添加）
 * const result = await importQuoteFromExcel(file, tenantId);
 */
```

### 必须包含的内容
1. **业务用途说明**（第一行）：不是代码翻译，而是**业务语言描述**
2. **@param**：每个参数都要注释，说明其业务含义
3. **@returns**：返回值说明
4. **@throws**：如果方法内有 `throw` 语句，必须标注

### 禁止的写法
```typescript
// ❌ 禁止无意义的注释
/** 导入报价单 */
async importQuote(data: any) { ... }

// ❌ 禁止只是复述函数名
/** quote import service */
```

## 按文件优先级执行

### 1. `quote-import.service.ts` (18 个方法，0 个 JSDoc) — 🔴 最优先
这是最大的空白区。逐个阅读每个方法体，理解其：
- 从什么数据源导入（Excel/CAD/JSON？）
- 如何解析数据映射到 quote items
- 错误处理机制
然后写出准确的 JSDoc。

### 2. `quote-version.service.ts` (缺 11 个)
重点关注版本创建、快照、激活、对比等操作的 JSDoc。

### 3. `quote-expiration.service.ts` (缺 10 个)
重点关注过期检测、批量过期、延期、价格刷新等操作。

### 4. `measure-matcher.service.ts` (缺 5 个)
测量数据匹配相关方法。

### 5. `accessory-linkage.service.ts` (缺 2 个)
配件联动相关方法。

### 6. `calculation-service.ts` (缺 2 个)
计算引擎相关方法。

## 验收标准

1. **覆盖率检查命令**（主线程将执行以下命令验证）：
```powershell
Get-ChildItem "src/features/quotes/services/*.ts" | ForEach-Object {
    $methods = (Select-String -Path $_.FullName -Pattern "^\s+(async\s+)?\w+\s*\(" | Measure-Object).Count
    $jsdocs = (Select-String -Path $_.FullName -Pattern "^\s*/\*\*" | Measure-Object).Count
    "$($_.Name) : 方法=$methods, JSDoc=$jsdocs, 覆盖率=$([math]::Round($jsdocs/$methods*100,1))%"
}
```
2. 每个文件的 JSDoc 覆盖率 ≥ 85%（允许极少数 private 辅助方法不写）
3. 全文件总覆盖率 ≥ 90%
4. `npx tsc --noEmit` 零错误（注释不应影响编译）

## 交付说明
完成后宣告"Task 12 返工完成"，汇报每个文件的新增 JSDoc 数量。
