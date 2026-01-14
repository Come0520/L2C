# 系统参数排查与配置化方案

本文档详细梳理了系统中现有的各类参数，涵盖计算逻辑、界面默认值、业务约束等，并给出了配置化建议。

## 1. 窗帘计算 (Curtain Calculation)

| 参数名称 | 描述 | 当前状态 | 所在文件 | 建议调整方案 |
| :--- | :--- | :--- | :--- | :--- |
| **褶皱倍数配置** | 默认值 (2.0), 最小值 (1.5), 最大值 (3.5), 步长 (0.1) | **硬解码** (常量) | `constants.ts` (FOLD_RATIO_CONFIG) | **系统设置** (租户级默认值) + **网页调节** (当前已支持，但范围受限) |
| **侧边损耗** | 默认侧边损耗 (5cm) | **系统设置** (租户级) | `settings.curtainCalc.sideLoss` | 保持系统设置，支持网页微调 |
| **侧边损耗倍率** | 对开 x2, 单开 x1 | **不可调节** (逻辑) | `curtain-calc-engine.ts` | 保持逻辑不可调 (行业标准) |
| **包布带损耗** | 默认值 (20cm) | **系统设置** (租户级) | `settings.curtainCalc.headerLossWrapped` | 保持系统设置 |
| **贴布带损耗** | 默认值 (7cm) | **系统设置** (租户级) | `settings.curtainCalc.headerLossAttached` | 保持系统设置 |
| **底边损耗** | 默认值 (10cm) | **系统设置** (租户级) | `settings.curtainCalc.bottomLoss` | 保持系统设置 |
| **定高阈值** | 默认 275cm (超过此高度报警或切定宽) | **系统设置** (租户级) | `settings.curtainCalc.fixedHeightThreshold` | 保持系统设置 |
| **"做小边"优化阈值** | 硬编码为节省 > 3cm 时提示 (bottomLoss - 3) | **硬解码** (逻辑) | `curtain-calc-engine.ts` | **系统设置** (可配置 "小边高度" 或 "最小收益阈值") |
| **允许手动改价** | 是否允许修改计算后的单价 | **系统设置** (租户级) | `settings.curtainCalc.allowManualPriceEdit` | 保持系统设置 |
| **离地/轨道高度** | 是否包含离地/轨道高度计算 | **系统设置** (租户级) | `settings.curtainCalc.include...` | 保持系统设置 |

## 2. 墙纸/墙布计算 (Wallpaper/Wallcloth)

| 参数名称 | 描述 | 当前状态 | 所在文件 | 建议调整方案 |
| :--- | :--- | :--- | :--- | :--- |
| **宽度/高度/裁剪损耗** | 默认损耗值 (20/10/10 cm) | **系统设置** (租户级) | `settings.wallpaperCalc` | 保持系统设置 |
| **对花损耗** | 默认 0 | **系统设置** (租户级) | `settings.wallpaperCalc` | 保持系统设置 |
| **标准卷规格** | 卷宽 0.53m, 卷长 10m | **系统设置** (租户级) | `settings.wallpaperCalc` | 保持系统设置 |
| **计算默认幅宽** | 0.53m (Fallback) | **硬解码** (逻辑默认值) | `wallpaper-strategy.ts` | **系统设置** (统一使用系统配置的标准卷宽) |
| **计算进位逻辑** | 向上取整 (Ceil) | **不可调节** (逻辑) | `wallpaper-strategy.ts` | 保持逻辑不可调 |

## 3. UI/交互配置 (UI & Interaction)

| 参数名称 | 描述 | 当前状态 | 所在文件 | 建议调整方案 |
| :--- | :--- | :--- | :--- | :--- |
| **简单模式字段** | 哪些字段可见/必填 | **系统设置** (租户级) | `settings.*QuickQuote` | 保持系统设置 |
| **报价列显示** | 报价单表格显示哪些列 | **用户设置** (Config) | `users.preferences.quoteConfig` | 保持用户设置 |
| **商品分类列表** | 窗帘、墙纸、标品等分类定义 | **硬解码** (常量) | `constants.ts` | **不可调节** (暂不建议开放，涉及系统核心枚举) |
| **标签映射** | 空间、安装方式等中文名称 | **硬解码** (常量) | `constants.ts` | **系统设置** (可由用户自定义术语，如 "主卧" vs "主人房") |

## 4. 实施计划 (Action Plan)

### Step 1: 迁移硬编码参数至系统设置
- [ ] **褶皱倍数 (Fold Ratio)**:
    - 在 `CurtainCalcSettings` 中新增 `foldRatioConfig: { default: number, min: number, max: number, step: number }`。
    - 数据库迁移 (Migration) 更新 `Tenant` 表结构 (JSON 字段无需 schema 变更，但需更新类型定义)。
    - 更新 `settings/actions.ts` 支持读写。
    - 更新 `constants.ts` 移除硬编码，改为从 Settings 或 Context 读取 (需考虑 Client Component 获取方式)。
- [ ] **"做小边"参数**:
    - 在 `CurtainCalcSettings` 中新增 `smallBottomHeight` (小边高度，默认 3cm) 或类似配置。
    - 更新计算引擎逻辑读取此配置。

### Step 2: 完善设置界面
- [ ] 在「系统设置 - 窗帘配置」页面增加上述新字段的输入框。
- [ ] 增加「恢复默认值」功能，确保用户配置错误时可回退。

### Step 3: 前端组件接入
- [ ] 更新 `CurtainFabricQuoteForm` 等组件，初始值不再读取常量，而是读取 `useSettings()` (需封装 Context 或 Hook)。
- [ ] 更新计算引擎 `CurtainQuantityEngine` 确保使用传入的完整配置。

### Step 4: 术语/标签配置 (可选/后续)
- [ ] 将 `ROOM_TYPE_LABELS` 等移动到系统配置，允许装饰公司自定义常用空间名称。
