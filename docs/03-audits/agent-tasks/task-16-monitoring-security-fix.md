# Task 16: Monitoring 模块安全补丁 + 可运维性补强

> **任务性质**：代码改进（编程任务）
> **目标**：清除全项目最后 1 处 @ts-ignore + 接入 AuditService（当前 audit=0）
> **模块路径**：`src/features/monitoring/`
> **评估人**：主线程 AI（不参与编程，只做验收）

---

## 🔍 实测发现的核心问题

| 指标 | 当前值 | 目标 | 状态 |
|:---|:---:|:---:|:---:|
| `@ts-ignore` | **1** | 0 | 🔴 全项目唯一残留 |
| `AuditService` 引用 | **0** | ≥ 3 | 🔴 监控操作无审计记录 |
| `logger.` 调用 | 14 | ≥ 14 | ✅ |
| 测试文件数 | 3 | ≥ 3 | ✅ |
| TODO 数 | 0 | 0 | ✅ |

---

## 📋 必须完成的具体任务

### 任务一：修复 @ts-ignore（最高优先级，全项目唯一残留）

**定位步骤**：
```powershell
# 执行此命令找到精确位置
Select-String -Path "src\features\monitoring\**\*.ts","src\features\monitoring\**\*.tsx" -Pattern "@ts-ignore"
```

**处理规则**：
- **如果 `@ts-ignore` 下方代码有类型错误** → 修复类型错误，不是绕过它
- **如果类型确实无法推断**（如第三方库返回 `any`）→ 使用 `unknown` + 类型断言，并附上说明注释
- **绝对禁止**：不能因为"修起来麻烦"就改成 `@ts-expect-error`（也不行）

**验收命令**：
```powershell
(Get-ChildItem src\features\monitoring -r -Include "*.ts","*.tsx" | Select-String "@ts-ignore").Count
# 期望：0
```

---

### 任务二：接入 AuditService 审计日志

**背景**：monitoring 模块有写操作（如创建报警规则、修改告警阈值、调整监控配置等），这些操作没有审计记录，不符合企业合规要求。

**要求**：
1. 读取 `src/features/monitoring/actions/` 下所有 server action 文件
2. 找到所有**写操作**（CREATE / UPDATE / DELETE）
3. 在每个写操作中，在成功执行后调用 `AuditService`：

```typescript
import { AuditService } from '@/services/audit.service'; // 使用项目规范导入路径
import { AuditAction } from '@/types/audit';

// 写操作成功后：
await AuditService.recordFromSession(session, {
  action: AuditAction.CREATE, // 或 UPDATE / DELETE
  entityType: 'monitoring_rule', // 实体类型，根据实际调整
  entityId: result.id,           // 操作的实体 ID
  newValue: result,               // 新值（CREATE/UPDATE 时）
  oldValue: oldRecord,           // 旧值（UPDATE/DELETE 时，需提前查询）
});
```

**注意**：
- 如果模块内已有其他模块的 AuditService 调用示例，参考其用法保持一致
- 优先级高的写操作：配置修改 > 规则创建 > 规则删除
- 至少接入 **3 个写操作**

**验收命令**：
```powershell
(Get-ChildItem src\features\monitoring -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "AuditService").Count
# 期望：≥ 3
```

---

### 任务三：补充1个健康检查测试（D3 加固）

**背景**：testFiles=3 基本够用，但可以新增 1 个专注于**错误处理和边界条件**的测试文件以进一步加固。

**要求**（可选，若时间允许）：
新增 `src/features/monitoring/__tests__/error-handling.test.ts`，覆盖：
- monitoring action 中的租户隔离保护
- 无效配置输入时的校验拒绝

---

## ⚠️ 禁止事项
- **不得将 `@ts-ignore` 改为 `@ts-expect-error`**（两者都不允许）
- **不得删除** logger 相关代码（当前 logger=14 是优势）
- **不得修改** 现有测试

---

## ✅ 最终验收清单

```powershell
# 1. @ts-ignore 清零（全项目关键指标）
(Get-ChildItem src\features\monitoring -r -Include "*.ts","*.tsx" | Select-String "@ts-ignore").Count
# 期望：0

# 2. AuditService 接入数
(Get-ChildItem src\features\monitoring -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "AuditService").Count
# 期望：≥ 3

# 3. 全模块 @ts-ignore 最终确认（含子目录）
Get-ChildItem src\features\monitoring -r -Include "*.ts","*.tsx" | Select-String "@ts-ignore"
# 期望：无任何输出

# 4. 测试全通过
npx vitest run src/features/monitoring
# 期望：Exit code 0

# 5. TypeScript 编译
npx tsc --noEmit 2>&1 | Select-String "monitoring"
# 期望：无输出
```

## 交付说明
完成后宣告"Task 16 完成"，**逐项**报告每条验收命令的实际结果数字。
