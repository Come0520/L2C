# 线索模块架构设计 (Lead Module Architecture Design)

**日期**: 2026-01-14
**状态**: 已确认 (Validated)
**相关需求**: [线索模块需求](../requirements/modules/线索.md)

## 1. 设计概述

本文档记录了线索 (Lead) 模块的核心技术架构决策。基于业务灵活性、数据安全性和用户体验的平衡，我们采用了以下设计方案。

## 2. 核心架构决策

### 2.1 数据库选型与模型设计

- **选型**: PostgreSQL
- **模式**: **混合模式 (Hybrid Schema)**
  - **核心字段 (Fixed Columns)**: 姓名、电话、状态、归属人等高频、稳定的字段使用固定列存储，保证查询性能和数据完整性。
  - **扩展字段 (JSONB)**: 使用 `extra_data` (JSONB) 字段存储变动频繁或未来新增的业务字段（如“宠物类型”、“结婚纪念日”等）。
  - **优势**: 兼顾了关系型数据库的严谨性（核心业务稳定）和 NoSQL 的灵活性（快速响应市场需求变化）。

### 2.2 数据安全与隐私

- **存储策略**: **明文存储 (Plain Text)**
  - 电话号码等敏感信息在数据库中以明文形式存储。
  - **原因**: 为了支持高效的模糊搜索（如搜索尾号、搜索部分地址）。
- **脱敏策略**: **应用层脱敏 (Application Level Masking)**
  - **防君子不防小人**: 数据库层面不加密，但在 API 输出层进行严格控制。
  - **规则**: 普通销售只能看到 `138****1234`；特定权限（如店长）在特定操作下可查看全号，并触发审计日志。

### 2.3 并发控制 (抢单机制)

- **策略**: **乐观锁 (Optimistic Locking)**
  - **机制**: 引入 `version` 字段。
  - **流程**:
    1. 读取线索时获取当前 `version`。
    2. 更新/认领时检查 `version` 是否未变。
    3. 若 `version` 已变（被他人抢先修改），则更新失败并提示用户。
  - **优势**: 避免了数据库行锁带来的性能损耗，保证了高并发下的系统流畅度，遵循“先到先得”原则。

### 2.4 搜索机制

- **策略**: **模糊搜索 (Fuzzy Search)**
  - **实现**: 利用 PostgreSQL 原生插件 `pg_trgm` (Trigram) 或 `B-tree` 索引。
  - **能力**: 支持手机号后四位搜索、地址关键词模糊匹配。
  - **权衡**: 在百万级数据量下提供秒级响应，无需引入 Elasticsearch 等重型搜索引擎，降低运维成本。

### 2.5 实时性设计

- **策略**: **WebSocket 推送**
  - **技术**: Socket.io (或类似成熟库)。
  - **场景**: 新线索分配、状态变更。
  - **体验**: 销售端无需刷新页面，消息“秒级”到达，确保线索跟进的时效性。

### 2.6 审计日志 (Audit Logs)

- **策略**: **关键动作记录**
  - **范围**: 仅记录对业务状态或关键数据有实质性影响的操作（如分配、改状态、改电话）。
  - **内容**:
    - `operator_id`: 操作人
    - `timestamp`: 时间
    - `action`: 动作类型
    - `before_state`: 修改前快照
    - `after_state`: 修改后快照
    - `reason`: 修改原因（如作废原因）

## 3. 数据结构示例 (Schema Example)

### 3.1 Leads 表

```sql
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_no VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL, -- 明文存储，建立索引
    status VARCHAR(20) NOT NULL,
    assigned_sales_id UUID,

    -- 混合模式扩展字段
    extra_data JSONB DEFAULT '{}',

    -- 乐观锁版本号
    version INTEGER DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引优化搜索
CREATE INDEX idx_leads_phone ON leads(customer_phone);
CREATE INDEX idx_leads_extra_data ON leads USING gin (extra_data);
```

### 3.2 Audit Logs 表

```sql
CREATE TABLE lead_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id),
    operator_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- e.g., 'ASSIGN', 'VOID', 'UPDATE_INFO'
    changes JSONB, -- 存储 { "field": { "old": "A", "new": "B" } }
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 4. 总结

本架构设计旨在构建一个**轻量、敏捷且实用**的线索管理系统。通过混合存储模式和乐观锁机制，我们确保了系统在应对业务变化时的灵活性和高并发下的稳定性；通过应用层脱敏和模糊搜索的组合，我们在保障基本数据安全的前提下，最大化了销售的工作效率。
