# [验收任务] Phase 1 完成后主线程验收清单

> 此文档由主线程持有，等待 3 个 Agent 全部汇报后执行

---

## 等待汇报

- [ ] Agent 1 (`[Agent 1 - Finance]`) 汇报完成
- [ ] Agent 2 (`[Agent 2 - Settings]`) 汇报完成
- [ ] Agent 3 (`[Agent 3 - After-Sales]`) 汇报完成

---

## 验收执行步骤

当 3 个 Agent 全部汇报后，依次执行：

### 1. 确认无跨模块冲突
```bash
cd c:\Users\bigey\Documents\Antigravity\L2C

# 查看修改文件列表
git diff --name-only
```

确认修改文件只在以下范围内：
- `src/features/finance/`
- `src/features/settings/`
- `src/features/after-sales/`
- `docs/02-requirements/modules/售后.md`

### 2. 全局类型检查
```bash
npx tsc --noEmit
```
✅ 必须零错误

### 3. Finance 模块专项验证
```bash
# any 数量
grep -rn ": any\b\|as any\b" src/features/finance \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir="__tests__" | wc -l
# 目标：≤ 5

# @ts-ignore 数量
grep -rn "@ts-ignore\|@ts-expect-error" src/features/finance \
  --include="*.ts" --include="*.tsx" | wc -l
# 目标：0

# 运行 finance 测试
npx vitest run src/features/finance
```

### 4. Settings 模块专项验证
```bash
# TODO 数量
grep -rn "TODO\|FIXME" src/features/settings \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir="__tests__" | wc -l
# 目标：0

# 运行 settings 测试（含新增）
npx vitest run src/features/settings --reporter=verbose
# 确认新增 ≥ 6 个 roles-management 测试通过
```

### 5. After-Sales 模块专项验证
```bash
# 运行 after-sales 测试
npx vitest run src/features/after-sales --reporter=verbose
# 确认新增 ≥ 3 个集成测试通过
```

### 6. 全量测试（最终）
```bash
npx vitest run
```
✅ 所有测试全部通过

---

## 验收结果记录

| 模块 | any 数 | @ts-ignore | TODO | 新增测试 | 全测试 | 结果 |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| finance | ? | ? | ? | — | ? | ⏳ |
| settings | — | — | ? | ? | ? | ⏳ |
| after-sales | — | — | — | ? | ? | ⏳ |

---

## 评分更新预期

| 模块 | 升级前 | 升级后 |
|:---|:---:|:---:|
| finance | L3 (6.4) | **L4 (~7.5)** |
| settings | L3 (6.9) | **L4 (~7.5)** |
| after-sales | L3 (6.9) | **L4 (~7.4)** |
