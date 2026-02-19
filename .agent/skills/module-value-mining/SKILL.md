---
name: module-value-mining
description: Use when you need to extract business value, selling points, and technical highlights from a module's codebase for marketing, sales, or showroom purposes.
---

# Module Value Mining: 模块价值挖掘

## Overview

一个用于**将代码能力转化为商业语言**的技能。
它不关注代码写得好不好（这是 `module-audit` 的事），而是关注**代码实现了什么业务价值**，以及如何将这些价值包装成吸引客户的卖点。

**核心逻辑**：Code Capabilities (功能) → User Benefits (价值) → Selling Points (卖点)

## When to Use

*   **项目宣发**：需要为官网、PPT、小红书撰写产品介绍时
*   **售前支持**：需要回答客户"你们的产品有什么亮点"时
*   **产品规划**：需要梳理现有功能资产，寻找差异化竞争优势时
*   **内部培训**：需要向销售/客服培训产品功能价值时
*   **展厅 (Showroom) 内容生产**：需要填充演示系统的内容数据时

---

## 1. Mining Framework (挖掘框架)

### 目标受众 (Target Audience)

在挖掘时，始终针对以下三类核心用户画像进行价值翻译：

1.  **老板/决策者 (Boss)**
    *   关注点：降本、增效、风控、数据透明、ROI
    *   话术风格：宏观、结果导向 ("杜绝飞单"、"提升转化率 30%")
2.  **管理者/运营 (Manager/Ops)**
    *   关注点：流程管控、效率工具、报表、绩效考核
    *   话术风格：管理导向、流程导向 ("自动化分配"、"实时业绩看板")
3.  **执行者/个体户 (Worker/Individual)**
    *   关注点：简单易用、少操作、不背锅、多赚钱
    *   话术风格：体验导向、便携导向 ("手机一键接单"、"自动算佣金")

### 挖掘维度 (Dimensions)

| 维度 | 关注点 | 代码线索关键词 (Search Keywords) |
|:---|:---|:---|
| **业务闭环** | 流程是否完整？有无断点？ | `state`, `status`, `workflow`, `process`, `complete` |
| **自动化/智能** | 有无自动分配、计算、提醒？ | `auto`, `engine`, `cron`, `job`, `calculate`, `sync` |
| **风控/安全** | 有无防作弊、防飞单、留痕？ | `audit`, `verify`, `check`, `lock`, `permission`, `validate` |
| **精细化运营** | 有无标签、画像、分层、漏斗？ | `tag`, `score`, `level`, `tier`, `rank`, `analysis` |
| **移动/现场** | 有无定位、拍照、离线、即时通知？ | `mobile`, `location`, `gps`, `upload`, `camera`, `notify` |

---

## 2. The Process (挖掘流程)

```mermaid
graph TD
    Start[开始挖掘] --> Scan[代码扫描]
    Scan --> Identify[功能点提取]
    Identify --> Translate[价值翻译 (To B/C)]
    Translate --> Package[卖点包装]
    Package --> Output[生成宣发素材]
```

### Step 1: 功能点提取 (Feature Extraction)

扫描模块的 `actions`, `services`, `schema`，列出核心功能。

*   **Service Methods**: 核心业务逻辑 (e.g. `assignLead`, `calculateCommission`)
*   **Database Schema**: 数据资产 (e.g. `Leads` 表的 `source`, `score`, `tags` 字段)
*   **Cron Jobs**: 后台自动化任务 (e.g. `LeadRecycleJob`)
*   **UI Components**: 前端交互亮点 (e.g. `KanbanBoard`, `DashboardChart`)

### Step 2: 价值翻译 (Value Translation)

将功能点翻译为用户价值。

*   *功能*: `LeadRecycleJob` (30分钟未处理自动回收)
*   *价值 (老板)*: **防止线索浪费**，逼着销售动起来，每一条线索都不浪费。
*   *价值 (销售)*: **机会公平**，勤快的人有更多单子接。

### Step 3: 卖点包装 (Selling Point Packaging)

结合**场景 (Scenario)** 和 **亮点 (Highlight)** 进行包装。

*   **场景化**: "当销售在以前，线索记在小本子上容易丢；现在，系统自动提醒，客户一个不少。"
*   **数据化**: "提升线索转化率 20%，缩短跟进周期 3 天。"
*   **概念化**: "不仅是软件，更是您的**24小时智能销售总监**。"

---

## 3. Report Template (挖掘报告模板)

保存至：`docs/04-marketing/<module>-value-mining.md`

```markdown
# [模块名] 价值挖掘与卖点报告

> 挖掘日期：YYYY-MM-DD
> 目标模块：`src/features/<module>/`

## 🎯 核心定位 (One-Liner)
用一句话概括该模块的核心价值。（例如：线索模块——“从流量到现金流的智能加速器”）

## 💎 核心卖点清单 (Killer Features)

### 1. [卖点名称，如：智能流量分配引擎]
*   **技术支撑**: `DistributionEngine.distribute()`, 基于 `score` 和 `availability`。
*   **老板价值**: 杜绝“大锅饭”和“关系户”，谁转化高给谁派单，资源利用最大化。
*   **管理价值**: 全自动流转，省去人工分单的繁琐，避免分配不公的投诉。
*   **话术金句**: “让每一条线索都找到最适合它的成交人。”

### 2. [卖点名称，如：公海池自动回收机制]
*   **技术支撑**: `PoolRecycleJob` (Cron), `lastActivityAt` 判定。
*   **老板价值**: 解决“占着茅坑不拉屎”的顽疾，逼单神器。
*   **执行价值**: 只要勤快，公海池里永远有淘不完的金子。
*   **话术金句**: “流水不腐，户枢不蠹；让线索流动起来，业绩自然来。”

(...列出 3-5 个核心卖点...)

## 🎬 场景化故事 (User Stories)

### 场景一：[场景名，如：深夜线索不打烊]
*   **痛点**: 晚上 11 点客户咨询，客服下班，第二天早上客户冷了。
*   **解决方案**: 系统自动捕获 -> 自动创建 -> 自动分配 -> 手机弹窗通知销售。
*   **结果**: 销售睡前花 1 分钟联系，锁定意向，客户感觉服务超好。

## 📱 宣发文案素材 (For Social Media)

### 朋友圈/小红书风格
*   **标题**: 装修公司老板看过来！还在用 Excel 管客户？难怪丢单率高！😭
*   **正文**:
    *   ❌ 以前：线索记本子，撞单天天吵，离职带走一堆客...
    *   ✅ 现在：L2C 系统上线！
    *   ✨ **自动分单**：秒级响应，不让客户等凉了
    *   ✨ **公海淘金**：闲置客户自动回流，谁行谁上
    *   ✨ **防撞单**：手机号自动查重，内部不再打架
    *   👉 懂行的老板都在用了，你还在等什么？#装修管理 #SaaS #降本增效

## 🛠️ 展厅演示配置建议 (Showroom Setup)
*   **演示账号**: 准备“金牌销售”和“摸鱼销售”两个角色。
*   **演示数据**: 预置 10 条高意向线索，5 条即将掉入公海的线索。
*   **演示脚本**: 现场演示“摸鱼销售”未及时跟进，线索当场被回收，被“金牌销售”抢走的过程。

```

---

## 4. Execution Strategy (执行策略)

1.  **Read**: 阅读 `src/features/<module>` 下的核心代码，特别是 `logic/`, `engine/`, `job/` 目录。
2.  **Think**: 思考代码背后的业务痛点。
3.  **Write**: 按照模板输出报告。
4.  **Refine**: 像一个金牌销售一样润色文案。
