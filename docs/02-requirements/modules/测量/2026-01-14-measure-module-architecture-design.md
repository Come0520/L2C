# 测量模块架构设计 (Measure Module Architecture Design)

**日期**: 2026-01-14
**状态**: 已确认 (Validated)
**相关需求**: [测量单模块需求](../requirements/modules/测量单.md)

## 1. 设计概述

本文档记录了测量 (Measure) 模块的核心技术架构决策。针对现场作业环境复杂、数据准确性要求高、版本迭代频繁的业务特点，我们采用了以下设计方案。

## 2. 核心架构决策

### 2.1 数据存储模式
*   **策略**: **混合模式 (Hybrid Schema)**
    *   **结构化字段**: 存储关键统计指标（如 `room_count`, `window_count`）和状态流转字段（如 `status`, `measured_by`）。
    *   **JSONB 字段**: 存储具体的测量明细（如 `items` 数组，包含每个窗户的宽、高、安装方式等）。
    *   **数据分析支持**: 利用 PostgreSQL 的 JSON 查询能力或后台 ETL 清洗程序，满足长期对“窗宽”、“窗高”等维度的统计分析需求。
    *   **优势**: 兼顾了业务录入的灵活性（适应各种异形窗）和宏观数据的可统计性。

### 2.2 离线同步策略
*   **策略**: **混合同步 (Hybrid Sync)**
    *   **默认机制**: **自动静默同步**。小程序监听网络状态，一旦恢复网络即自动在后台上传缓存数据。
    *   **兜底机制**: **失败强提醒**。若连续 3 次上传失败或超时（如 10 分钟），弹窗强制提醒用户检查网络并手动重试。
    *   **优势**: 在保障极致用户体验（无感同步）的同时，提供了可靠的数据防丢失保障。

### 2.3 多版本管理
*   **策略**: **快照归档 (Snapshot Archiving)**
    *   **机制**: `measure_tasks` 表始终存储当前生效版本。每次生成新版本（如重测或方案变更）时，将当前版本数据完整复制到 `measure_history` 表中。
    *   **优势**: 查询性能高（主表数据量小），且具备完整的历史回溯能力（“后悔药”），支持随时恢复旧版本。

### 2.4 图片处理策略
*   **策略**: **智能双图 (Smart Dual-Image)**
    *   **上传**: 客户端同时上传“预览图”（压缩至 ~500KB）和“原图”（原始大小）。
    *   **展示**: 默认加载预览图实现秒开；提供“查看原图”按钮加载高清细节。
    *   **生命周期**: 可配置原图保留策略（如 3 个月后自动清理原图，仅留预览图），平衡存储成本。
    *   **优势**: 解决了“现场上传慢/流量贵”与“后期复核需看清细节”之间的矛盾。

### 2.5 异常数据拦截
*   **策略**: **分级拦截 (Graded Validation)**
    *   **黄线 (Warning)**: 超过常规阈值（如宽 > 5000mm），弹窗提示但允许确认（防手滑）。
    *   **红线 (Error)**: 超过物理极限（如宽 > 50000mm 或负数），直接禁止提交（防错误）。
    *   **优势**: 既防止了明显的数据录入错误，又保留了处理极端特殊情况的灵活性。

## 3. 数据结构示例 (Schema Example)

### 3.1 Measure Tasks 表
```sql
CREATE TABLE measure_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    measure_no VARCHAR(50) NOT NULL UNIQUE,
    lead_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL,
    
    -- 结构化统计字段
    room_count INTEGER DEFAULT 0,
    window_count INTEGER DEFAULT 0,
    
    -- 混合模式明细数据
    -- 结构示例: [{ "room": "主卧", "width": 2000, "height": 1800, ... }]
    items JSONB DEFAULT '[]', 
    
    -- 版本控制
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引优化 JSON 查询 (用于统计分析)
CREATE INDEX idx_measure_items ON measure_tasks USING gin (items);
```

### 3.2 Measure History 表
```sql
CREATE TABLE measure_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES measure_tasks(id),
    version INTEGER NOT NULL,
    snapshot_data JSONB NOT NULL, -- 完整备份那一刻的所有数据
    archived_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 4. 总结
本架构设计重点解决了测量环节的**现场作业痛点**和**数据质量问题**。通过混合存储和分级拦截，我们保证了数据的灵活性与准确性；通过离线同步和智能双图，我们极大地提升了测量师的现场工作体验。这套方案为后续的报价和生产提供了坚实的数据基础。
