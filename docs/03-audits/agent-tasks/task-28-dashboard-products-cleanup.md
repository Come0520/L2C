# Task 28: Dashboard TODO 清理 + Products any 消除

> **任务性质**：代码清理（技术债偿还）
> **目标**：Dashboard TODO=40→≤5，Products any=4→0
> **模块路径**：`src/features/dashboard/` 和 `src/features/products/`
> **评估人**：主线程 AI（不参与编程，只做验收）

---

## 🔍 当前状态

| 模块 | 指标 | 当前值 | 目标 |
|:---|:---|:---:|:---:|
| **dashboard** | TODO/FIXME 数量 | 40 | ≤ 5 |
| **products** | `any` 类型数量 | 4 | 0 |

---

## 📋 Dashboard TODO 清理任务

### Step 1：列出全部 TODO
```powershell
Get-ChildItem src\features\dashboard -r -Include "*.ts","*.tsx" | Select-String "TODO|FIXME" | ForEach-Object { "$($_.Filename):$($_.LineNumber) $($_.Line.Trim())" }
```

### Step 2：逐一分类处理

对每个 TODO，按以下策略处理：

| 类型 | 处理方式 |
|:---|:---|
| 已完成的 TODO | 直接删除注释 |
| 过时/不再需要 | 直接删除注释 |
| 简单代码补全 | 补写实现后删除 TODO |
| 复杂待办事项 | 改写为 `// NOTE: 未来计划...` 并保留（计入≤5） |

### 注意事项
- **严禁删除业务逻辑**，只删除或处理 TODO 注释
- 如果 TODO 涉及复杂功能实现，不强求完成，转为 NOTE 即可
- 不要因为清理 TODO 而引入新的 bug

---

## 📋 Products any 消除任务

### Step 1：定位 any
```powershell
Get-ChildItem src\features\products -r -Include "*.ts","*.tsx" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "\bany\b" | Where-Object {$_.Line -notmatch "//|import|as any"} | ForEach-Object { "$($_.Filename):$($_.LineNumber) $($_.Line.Trim())" }
```

### Step 2：替换为正确类型
- 查看上下文推断正确类型
- 利用已有的类型定义（Schema、接口等）
- 实在无法推断的用 `unknown` + 类型守卫

---

## ✅ 验收清单

```powershell
# 1. Dashboard TODO 数（≤5）
(Get-ChildItem src\features\dashboard -r -Include "*.ts","*.tsx" | Select-String "TODO|FIXME").Count

# 2. Products any 数（=0，排除测试文件、注释、import）
(Get-ChildItem src\features\products -r -Include "*.ts","*.tsx" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "\bany\b" | Where-Object {$_.Line -notmatch "//|import|as any"}).Count

# 3. tsc 编译
npx tsc --noEmit 2>&1 | Select-String "dashboard|products"
# 期望：无输出

# 4. 测试全通过
npx vitest run src/features/dashboard src/features/products
```

## 交付说明
完成后宣告"Task 28 完成"，报告 Dashboard TODO 削减数量和 Products any 消除方式。
