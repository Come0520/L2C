# 状态码速查表 (Status Code Reference)

> 本文档汇总了 L2C 系统所有模块的状态枚举值，便于开发与维护时快速查阅。

---

## 1. 线索 (Lead)

| 状态名 | 状态码 | 说明 |
|:---|:---|:---|
| 待分配 | `PENDING_DISPATCH` | 公海池，未指派销售 |
| 待跟踪 | `PENDING_FOLLOWUP` | 已指派，待首次接触 |
| 跟踪中 | `FOLLOWING` | 正在跟进中 |
| 已成交 | `WON` | 已生成订单 |
| 已作废 | `VOID` | 无效线索 |

---

## 2. 测量任务 (Measure Task)

| 状态名 | 状态码 | 说明 |
|:---|:---|:---|
| 待分配 | `PENDING` | 等待派单 |
| 分配中 | `DISPATCHING` | 已指派，待接单 |
| 待上门 | `PENDING_VISIT` | 已接单，待上门 |
| 待确认 | `PENDING_CONFIRM` | 已提交，待销售确认 |
| 已完成 | `COMPLETED` | 流程结束 |
| 已取消 | `CANCELLED` | 任务取消 |

---

## 3. 测量数据 (Measure Sheet)

| 状态名 | 状态码 | 说明 |
|:---|:---|:---|
| 草稿 | `DRAFT` | 录入中，可修改 |
| 已确认 | `CONFIRMED` | 已提交，不可修改 |
| 已归档 | `ARCHIVED` | 历史版本 |

---

## 4. 报价单 (Quote)

| 状态名 | 状态码 | 说明 |
|:---|:---|:---|
| 草稿 | `DRAFT` | 编辑中 |
| 生效中 | `ACTIVE` | 当前有效报价 |
| 已锁定 | `LOCKED` | 已转订单，不可修改 |
| 已失效 | `EXPIRED` | 被替代或过期 |

---

## 5. 订单 (Order)

| 状态名 | 状态码 | 说明 |
|:---|:---|:---|
| 待下单 | `PENDING_PO` | 等待拆单生成采购单 |
| 生产中 | `IN_PRODUCTION` | 采购单已下达 |
| 待发货 | `PENDING_DELIVERY` | 备货完成，等待发货 |
| 发货中 | `DISPATCHING` | 销售已申请发货 |
| 已发货 | `SHIPPED` | 物流运输中 |
| 待安装 | `PENDING_INSTALL` | 货物到达，等待安装 |
| 已完成 | `COMPLETED` | 交付完成 |
| 已关闭 | `CLOSED` | 财务结清 |

---

## 6. 采购单 (Purchase Order)

| 状态名 | 状态码 | 说明 |
|:---|:---|:---|
| 草稿 | `DRAFT` | 待确认下单 |
| 生产中 | `IN_PRODUCTION` | 工厂生产中 |
| 备货完成 | `READY` | 工厂已完工 |
| 已发货 | `SHIPPED` | 物流运输中 |
| 已到货 | `DELIVERED` | 货物签收 |

---

## 7. 安装单 (Install Task)

| 状态名 | 状态码 | 说明 |
|:---|:---|:---|
| 待分配 | `PENDING_DISPATCH` | 等待派单 |
| 分配中 | `DISPATCHING` | 已指派，待接单 |
| 待上门 | `PENDING_VISIT` | 已接单，待上门 |
| 待确认 | `PENDING_CONFIRM` | 已完工，待验收 |
| 已完成 | `COMPLETED` | 验收通过 |

---

## 8. 对账单 (Statement)

### 8.1 销售对账单 (AR)

| 状态名 | 状态码 | 说明 |
|:---|:---|:---|
| 待开票 | `PENDING_INVOICE` | 等待开具发票 |
| 待回款 | `PENDING_PAYMENT` | 发票已开，等待收款 |
| 已完成 | `COMPLETED` | 款项已收 |

### 8.2 采购对账单 (AP-Supplier)

| 状态名 | 状态码 | 说明 |
|:---|:---|:---|
| 待开票 | `PENDING_INVOICE` | 等待供应商开票 |
| 待付款 | `PENDING_PAYMENT` | 发票已录入，待付款 |
| 已完成 | `COMPLETED` | 款项已付 |

### 8.3 劳务结算单 (AP-Labor)

| 状态名 | 状态码 | 说明 |
|:---|:---|:---|
| 待核对 | `PENDING_CHECK` | 等待核对工单明细 |
| 待发放 | `PENDING_PAYMENT` | 核对完成，待发放 |
| 已发放 | `COMPLETED` | 工资已发放 |

---

## 9. 售后工单 (After-Sales)

| 状态名 | 状态码 | 说明 |
|:---|:---|:---|
| 待受理 | `PENDING` | 刚创建，待客服处理 |
| 处理中 | `PROCESSING` | 客服评估中 |
| 待上门 | `PENDING_VISIT` | 需上门服务 |
| 待回访 | `PENDING_CALLBACK` | 待确认满意度 |
| 已关闭 | `CLOSED` | 流程结束 |
| 已驳回 | `REJECTED` | 非售后范围 |

---

## 10. 定责单 (Liability Notice)

| 状态名 | 状态码 | 说明 |
|:---|:---|:---|
| 待发送 | `DRAFT` | 刚创建，待发送 |
| 待确认 | `PENDING_CONFIRM` | 已发送，待责任方确认 |
| 已确认 | `CONFIRMED` | 责任方已确认 |
| 有异议 | `DISPUTED` | 责任方有异议 |
| 已仲裁 | `ARBITRATED` | 管理层裁定 |

---

## 11. 审批流 (Approval)

| 状态名 | 状态码 | 说明 |
|:---|:---|:---|
| 待审批 | `PENDING` | 等待审批人处理 |
| 已通过 | `APPROVED` | 审批通过 |
| 已驳回 | `REJECTED` | 审批驳回 |
| 已升级 | `ESCALATED` | 超时自动升级 |

---

## 附录：责任方类型枚举

| 类型 | 代码 | 说明 |
|:---|:---|:---|
| 公司 | `COMPANY` | 公司自身承担 |
| 供应商 | `SUPPLIER` | 供应商承担 |
| 安装师 | `INSTALLER` | 安装师承担 |
| 测量师 | `MEASURER` | 测量师承担 |
| 客户 | `CUSTOMER` | 客户承担 |
