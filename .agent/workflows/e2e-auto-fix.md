---
description: E2E 测试全流程工作流（分层执行、全量后台、日志查看、分组跑）
---

# E2E 测试工作流

## 触发关键词速查

| 相公说的话 | 执行的命令 |
|---|---|
| "全量测试" / "跑全量" / "test:e2e:bg" | `pnpm test:e2e:bg`（后台无人值守，只需一次批准） |
| "看看进度" / "查看进度" | `pwsh test-reports\watch-latest.ps1` |
| "跑P0" / "冒烟测试" | `pnpm test:e2e:p0` |
| "跑P1" / "日常回归" | `pnpm test:e2e:p1` |
| "跑线索" / "跑lead" | `pnpm test:e2e:group:lead` |
| "跑客户" / "跑customer" | `pnpm test:e2e:group:customer` |
| "跑报价" / "跑quote" | `pnpm test:e2e:group:quote` |
| "跑订单" / "跑order" | `pnpm test:e2e:group:order` |
| "跑财务" / "跑finance" | `pnpm test:e2e:group:finance` |
| "跑安装" / "跑install" | `pnpm test:e2e:group:install` |
| "跑售后" / "跑aftersales" | `pnpm test:e2e:group:aftersales` |
| "清理测试报告" / "清理test-results" | `pnpm test:e2e:clean` |

---

## 分层策略

| 层级 | 脚本 | 条数 | 时间 | 建议频率 |
|---|---|---|---|---|
| **P0 冒烟** | `pnpm test:e2e:p0` | ~35 | < 20 分钟 | 每次提交前 |
| **P1 回归** | `pnpm test:e2e:p1` | ~200 | ~1.5 小时 | 每天下班时 |
| **P2 全量** | `pnpm test:e2e:bg` | 2200+ | ~18 小时 | 发版前 / 周末夜跑 |

---

## 全量后台运行流程（P2）

// turbo

### 步骤 1：启动后台全量测试（仅此一步，只需点一次批准）

```powershell
pnpm test:e2e:bg
```

启动后立即返回命令行，测试在后台运行，**相公可以继续正常工作**。

---

### 步骤 2：查看实时进度（可选，随时执行）

```powershell
pwsh test-reports\watch-latest.ps1
```

滚动显示最新 30 行日志。按 `Ctrl+C` 退出查看但不会中断测试。

---

### 步骤 3：查看最终结果

```powershell
# 查看摘要（测试完成后自动生成）
Get-Content (Get-ChildItem test-reports -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName\summary.txt
```

---

## 分组执行流程（按模块单独跑）

当只需要验证某个业务模块时，使用分组命令，速度更快：

// turbo

```powershell
# 示例：只跑财务模块
pnpm test:e2e:group:finance

# 只跑安装 + 售后
pnpm test:e2e:group:install
pnpm test:e2e:group:aftersales
```

---

## 前置检查（重要）

> ⚠️ **每次跑 E2E 前，如果有代码变更，必须先重新构建！**
> 
> ECS Parity 铁律：E2E 测试跑的是 standalone 生产构建产物，不是 dev 模式。
> 旧产物不包含新代码，会导致测试通过但线上仍有 Bug（已发生真实事故）。

// turbo

```powershell
# 清除旧构建 + 重新构建
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
pnpm build
```

---

## 环境版本对照

| 环境 | Node.js 版本 |
|---|---|
| 本地开发 | v22.x |
| ECS 生产容器 | node:22-alpine（已与本地对齐） |

---

## 循环修复（测试失败时）

如需自动循环修复，触发 `/e2e-auto-fix` 工作流，该工作流将：
1. 自动构建 → 运行测试 → 分析失败 → TDD 修复 → 再次运行
2. 直到全部通过或触发熔断（同一文件失败 ≥3 次）后通知相公
