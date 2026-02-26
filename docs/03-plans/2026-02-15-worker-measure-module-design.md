# 工人测量模块设计文档

> **创建日期**: 2026-02-15
> **设计范围**: 微信小程序·工人端·测量任务模块 (MVP)
> **决策来源**: 头脑风暴会话 (2026-02-15)

---

## 一、核心决策记录

| #   | 决策         | 选项                   | 原因                            |
| --- | ------------ | ---------------------- | ------------------------------- |
| 1   | MVP 范围     | 仅测量任务（不含安装） | 分步迭代，降低复杂度            |
| 2   | 操作流深度   | 完整流                 | 师傅端到端完成测量数据录入      |
| 3   | 数据录入交互 | 可折叠卡片（全部一页） | 高效录入，减少页面跳转          |
| 4   | 测量模式     | 盲测 + 带方案测量      | 后端已有 `measureTypeEnum` 支持 |
| 5   | 多方案       | 支持方案 A/B/C         | 后端已有 `variant` 字段         |
| 6   | 工费         | 测量任务也有工费       | 需新增 Schema 字段              |

---

## 二、状态流转

```
PENDING_APPROVAL → PENDING → DISPATCHING → PENDING_VISIT → PENDING_CONFIRM → COMPLETED
                                                                        ↗ (驳回后重新上门)
```

**师傅参与的环节：**

```
PENDING_VISIT (待上门)
  → GPS 签到
  → 录入测量数据（支持多方案）
  → 拍摄现场照片
  → 提交
PENDING_CONFIRM (待确认)
  → 等待销售/管理员审核
  → 若驳回 → 回到 PENDING_VISIT 重新测量
COMPLETED (已完成)
```

---

## 三、页面设计

### 3.1 任务列表页 — `pages/tasks/index`

**布局：**

- 顶部：Tab 切换「待处理 | 已完成」
- 内容：任务卡片列表，每张卡片显示：
  - 测量编号 (`measureNo`)
  - 客户姓名 + 电话（脱敏）
  - 预约时间
  - 测量类型标签（🔍盲测 / 📋带方案）
  - 状态标签
  - 预估工费（右侧显示）
- 底部：下拉刷新 + 上拉加载

**数据源：** `GET /api/miniprogram/tasks?type=measure`

---

### 3.2 任务详情页 — `pages/tasks/detail/detail`

**布局：**

- 顶部：状态进度条（待上门 → 测量中 → 待确认 → 已完成）
- 客户信息卡片：
  - 客户姓名、电话（一键拨号按钮）
  - 地址（点击跳转地图导航）
- 任务信息卡片：
  - 测量编号、预约时间、测量类型
  - 备注
- **盲测模式**：仅显示以上信息
- **带方案模式**：额外显示「报价方案预览」卡片
  - 已有的房间 + 窗户列表
  - 预选尺寸/产品信息
- 工费信息卡片：
  - 本单预估工费
  - 计费规则说明（如：精准测量 ¥XX/窗 + 起步费 ¥XX）
- 底部按钮：
  - `PENDING_VISIT` → [GPS 签到] 按钮
  - 签到后 → [开始测量] 按钮
  - `PENDING_CONFIRM` → 显示"已提交，等待审核"
  - 被驳回 → 显示驳回原因 + [重新测量] 按钮

**数据源：** `GET /api/miniprogram/tasks/{id}`（需新建或扩展）

---

### 3.3 测量数据录入页 — `pages/tasks/measure/index` ⭐

**布局：**

- 顶部：方案 Tab（方案 A | 方案 B | + 新方案）
- 内容区：可折叠卡片列表
  - 每张卡片代表一个房间/窗户
  - 卡片标题：房间名称 + 窗型图标
  - 展开后显示表单字段：
    - **房间名称**：选择器（客厅/主卧/次卧/书房/阳台/卫生间/厨房/其他）
    - **窗型**：图标选择（直角/L型/U型/弧形）
    - **宽度 × 高度**：数字输入框 (cm)
    - 展开「更多选项」：
      - 安装方式（顶装/侧装）
      - 支架到墙距离
      - 墙面材质（混凝土/木质/石膏）
      - 是否有窗帘盒 + 窗帘盒深度
      - 是否电动轨道
      - 备注
  - 卡片右上角：删除按钮
- [+ 添加窗户] 按钮
- 现场照片区：
  - 网格展示已上传照片
  - [+ 拍照] 按钮（支持相机和相册）
- 底部固定：[提交测量数据] 按钮

**交互细节：**

- 新增卡片时自动展开，其余折叠
- 支持左滑删除
- 必填项校验（房间名、窗型、宽高）
- 提交前二次确认弹窗

**数据源：** `POST /api/miniprogram/tasks/{id}/measure-data`（需新建）

---

### 3.4 工费汇总页 — `pages/users/earnings`（嵌入「我的」页面）

**布局：**

- 本月待结算 / 累计已结算
- 近期工单工费明细列表
- 每条明细：测量单号 + 客户名 + 金额 + 日期

**数据源：** `GET /api/miniprogram/engineer/earnings`（需新建）

---

## 四、Schema 变更

### 4.1 `measureTasks` 表新增工费字段

```sql
ALTER TABLE measure_tasks ADD COLUMN labor_fee DECIMAL(12,2);
ALTER TABLE measure_tasks ADD COLUMN actual_labor_fee DECIMAL(12,2);
ALTER TABLE measure_tasks ADD COLUMN adjustment_reason TEXT;
ALTER TABLE measure_tasks ADD COLUMN fee_breakdown JSONB;
```

对应 Drizzle Schema 变更位置：`src/shared/api/schema/service.ts`

---

## 五、后端 API 变更

### 5.1 需要新建的 API

| 端点                                       | 方法 | 说明                                           |
| ------------------------------------------ | ---- | ---------------------------------------------- |
| `/api/miniprogram/tasks/[id]`              | GET  | 获取任务详情（含客户信息、工费、报价方案预览） |
| `/api/miniprogram/tasks/[id]/check-in`     | POST | GPS 签到                                       |
| `/api/miniprogram/tasks/[id]/measure-data` | POST | 提交测量数据（测量单 + 明细项）                |
| `/api/miniprogram/tasks/[id]/photos`       | POST | 上传现场照片                                   |
| `/api/miniprogram/engineer/earnings`       | GET  | 工费汇总                                       |

### 5.2 需要修改的 API

| 端点                         | 变更                                        |
| ---------------------------- | ------------------------------------------- |
| `GET /api/miniprogram/tasks` | 返回数据增加 `laborFee`、`measureType` 字段 |

---

## 六、前端文件清单

| 文件路径                                     | 类型 | 说明                        |
| -------------------------------------------- | ---- | --------------------------- |
| `miniprogram/pages/tasks/index.ts`           | 重写 | 从 8 行空壳变为完整任务列表 |
| `miniprogram/pages/tasks/index.wxml`         | 重写 | 任务列表 UI                 |
| `miniprogram/pages/tasks/index.wxss`         | 新建 | 列表样式                    |
| `miniprogram/pages/tasks/index.json`         | 新建 | 页面配置                    |
| `miniprogram/pages/tasks/detail/detail.ts`   | 重写 | 任务详情逻辑                |
| `miniprogram/pages/tasks/detail/detail.wxml` | 重写 | 详情 UI                     |
| `miniprogram/pages/tasks/detail/detail.wxss` | 新建 | 详情样式                    |
| `miniprogram/pages/tasks/measure/index.ts`   | 新建 | 测量数据录入逻辑            |
| `miniprogram/pages/tasks/measure/index.wxml` | 新建 | 录入 UI                     |
| `miniprogram/pages/tasks/measure/index.wxss` | 新建 | 录入样式                    |
| `miniprogram/pages/tasks/measure/index.json` | 新建 | 页面配置                    |

**总计：** 11 个文件（6 新建 + 5 重写）+ 5 个后端 API + 1 次 Schema 迁移

---

## 七、UI 风格

延续现有小程序暗色主题：

- 背景色：`#141414`
- 强调色：`#E6B450`（金色）
- 卡片背景：`rgba(255, 255, 255, 0.06)`
- 文字色：`#FFFFFF`（主）/ `#909399`（次）
- 状态标签：与 Web 后台一致的配色方案
