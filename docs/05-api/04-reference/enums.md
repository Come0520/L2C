# 枚举值

> L2C 系统所有枚举值定义和说明

## 用户相关

### UserRole（用户角色）

| 值 | 说明 |
|------|------|
| ADMIN | 管理员 |
| SALES | 销售人员 |
| MANAGER | 经理 |
| WORKER | 工人（测量师、安装师） |
| FINANCE | 财务人员 |
| SUPPLY | 采购员 |

## 客户相关

### CustomerType（客户类型）

| 值 | 说明 |
|------|------|
| INDIVIDUAL | 个人 |
| COMPANY | 公司 |
| DESIGNER | 设计师 |
| PARTNER | 合作伙伴 |

### CustomerLevel（客户等级）

| 值 | 说明 |
|------|------|
| A | A 级客户（高价值） |
| B | B 级客户（中高价值） |
| C | C 级客户（中价值） |
| D | D 级客户（普通） |

### CustomerLifecycleStage（客户生命周期阶段）

| 值 | 说明 |
|------|------|
| LEAD | 线索 |
| OPPORTUNITY | 机会 |
| SIGNED | 已签约 |
| DELIVERED | 已交付 |
| LOST | 已流失 |

### CustomerPipelineStatus（客户流水线状态）

| 值 | 说明 |
|------|------|
| UNASSIGNED | 未分配 |
| PENDING_FOLLOWUP | 待跟进 |
| PENDING_MEASUREMENT | 待测量 |
| PENDING_QUOTE | 待报价 |
| QUOTE_SENT | 已报价 |
| IN_PRODUCTION | 生产中 |
| PENDING_DELIVERY | 待发货 |
| PENDING_INSTALLATION | 待安装 |
| COMPLETED | 已完成 |

## 线索相关

### LeadStatus（线索状态）

| 值 | 说明 |
|------|------|
| PENDING_ASSIGNMENT | 待分配 |
| PENDING_FOLLOWUP | 待跟进 |
| FOLLOWING_UP | 跟踪中 |
| INVALID | 无效 |
| WON | 已成交 |
| VOID | 已作废 |

### IntentionLevel（意向等级）

| 值 | 说明 |
|------|------|
| HIGH | 高意向 |
| MEDIUM | 中意向 |
| LOW | 低意向 |

### LeadActivityType（跟进活动类型）

| 值 | 说明 |
|------|------|
| PHONE_CALL | 电话 |
| WECHAT_CHAT | 微信 |
| STORE_VISIT | 到店 |
| HOME_VISIT | 上门 |
| QUOTE_SENT | 发送报价 |
| SYSTEM | 系统 |

### DecorationProgress（装修进度）

| 值 | 说明 |
|------|------|
| WATER_ELECTRIC | 水电 |
| MUD_WOOD | 泥木 |
| INSTALLATION | 安装 |
| PAINTING | 油漆 |
| COMPLETED | 已完成 |

## 报价单相关

### QuoteStatus（报价单状态）

| 值 | 说明 |
|------|------|
| DRAFT | 草稿 |
| SUBMITTED | 已提交 |
| ACCEPTED | 已接受 |
| REJECTED | 已拒绝 |
| EXPIRED | 已过期 |

### QuotePlanType（报价方案类型）

| 值 | 说明 |
|------|------|
| ECONOMIC | 经济型 |
| COMFORT | 舒适型 |
| LUXURY | 豪华型 |

## 订单相关

### OrderStatus（订单状态）

| 值 | 说明 |
|------|------|
| DRAFT | 草稿 |
| PENDING_MEASURE | 待测量 |
| MEASURED | 已测量 |
| QUOTED | 已报价 |
| SIGNED | 已签约 |
| PAID | 已付款 |
| PENDING_PRODUCTION | 待生产 |
| IN_PRODUCTION | 生产中 |
| PENDING_DELIVERY | 待发货 |
| PENDING_INSTALL | 待安装 |
| COMPLETED | 已完成 |
| CANCELLED | 已取消 |

### OrderSettlementType（订单结算类型）

| 值 | 说明 |
|------|------|
| PREPAID | 预付 |
| CREDIT | 赊销 |
| CASH | 现结 |

### PaymentMethod（支付方式）

| 值 | 说明 |
|------|------|
| CASH | 现金 |
| WECHAT | 微信 |
| ALIPAY | 支付宝 |
| BANK | 银行转账 |

### PaymentScheduleStatus（付款计划状态）

| 值 | 说明 |
|------|------|
| PENDING | 待支付 |
| PAID | 已支付 |

## 商品相关

### ProductCategory（商品分类）

| 值 | 说明 |
|------|------|
| CURTAIN | 窗帘 |
| WALLPAPER | 墙纸 |
| WALLCLOTH | 墙布 |
| MATTRESS | 床垫 |
| OTHER | 其他 |
| CURTAIN_FABRIC | 窗帘面料 |
| CURTAIN_SHEER | 窗帘纱 |
| CURTAIN_TRACK | 窗帘轨道 |
| MOTOR | 电机 |
| CURTAIN_ACCESSORY | 窗帘配件 |

## 测量相关

### MeasureTaskStatus（测量任务状态）

| 值 | 说明 |
|------|------|
| PENDING | 待分配 |
| DISPATCHING | 分配中 |
| PENDING_VISIT | 待上门 |
| PENDING_CONFIRM | 待确认 |
| COMPLETED | 已完成 |
| CANCELLED | 已取消 |

### MeasureType（测量类型）

| 值 | 说明 |
|------|------|
| QUOTE_BASED | 基于报价单 |
| BLIND | 盲测 |
| SALES_SELF | 销售自测 |

### MeasureSheetStatus（测量数据状态）

| 值 | 说明 |
|------|------|
| DRAFT | 草稿 |
| CONFIRMED | 已确认 |
| ARCHIVED | 已归档 |

### WindowType（窗户类型）

| 值 | 说明 |
|------|------|
| STRAIGHT | 直形 |
| L_SHAPE | L 形 |
| U_SHAPE | U 形 |
| ARC | 弧形 |

### InstallType（安装类型）

| 值 | 说明 |
|------|------|
| TOP | 顶装 |
| SIDE | 侧装 |

### WallMaterial（墙面材质）

| 值 | 说明 |
|------|------|
| CONCRETE | 混凝土 |
| WOOD | 木材 |
| GYPSUM | 石膏板 |

### FeeCheckStatus（费用检查状态）

| 值 | 说明 |
|------|------|
| NONE | 无需费用 |
| PENDING | 待支付 |
| PAID | 已支付 |
| WAIVED | 已免收 |
| REFUNDED | 已退款 |

## 安装相关

### InstallTaskStatus（安装任务状态）

| 值 | 说明 |
|------|------|
| PENDING | 待分配 |
| DISPATCHING | 分配中 |
| PENDING_VISIT | 待上门 |
| PENDING_CONFIRM | 待确认 |
| COMPLETED | 已完成 |
| CANCELLED | 已取消 |

## 供应链相关

### POType（采购单类型）

| 值 | 说明 |
|------|------|
| FINISHED | 成品 |
| FABRIC | 面料 |
| STOCK | 库存 |

### WorkOrderStatus（加工单状态）

| 值 | 说明 |
|------|------|
| PENDING | 待处理 |
| PROCESSING | 处理中 |
| COMPLETED | 已完成 |
| CANCELLED | 已取消 |

## 财务相关

### AccountType（账户类型）

| 值 | 说明 |
|------|------|
| BANK | 银行账户 |
| WECHAT | 微信账户 |
| ALIPAY | 支付宝账户 |
| CASH | 现金账户 |

### PaymentOrderStatus（收款单状态）

| 值 | 说明 |
|------|------|
| DRAFT | 草稿 |
| PENDING | 待审核 |
| VERIFIED | 已审核 |
| REJECTED | 已拒绝 |
| PARTIAL_USED | 部分使用 |
| FULLY_USED | 全部使用 |

### PaymentBillStatus（付款单状态）

| 值 | 说明 |
|------|------|
| DRAFT | 草稿 |
| PENDING | 待审核 |
| VERIFIED | 已审核 |
| REJECTED | 已拒绝 |
| PAID | 已支付 |

### ARStatementStatus（应收对账单状态）

| 值 | 说明 |
|------|------|
| PENDING_RECON | 待对账 |
| RECONCILED | 已对账 |
| INVOICED | 已开票 |
| PARTIAL | 部分收款 |
| PAID | 已收款 |
| PENDING_DELIVER | 待发货 |
| COMPLETED | 已完成 |
| BAD_DEBT | 坏账 |

### CommissionStatus（佣金状态）

| 值 | 说明 |
|------|------|
| PENDING | 待计算 |
| CALCULATED | 已计算 |
| PENDING_PAYMENT | 待支付 |
| PAID | 已支付 |

## 渠道相关

### ChannelType（渠道类型）

| 值 | 说明 |
|------|------|
| DECORATION_CO | 装修公司 |
| DESIGNER | 设计师 |
| CROSS_INDUSTRY | 跨行业 |

### ChannelLevel（渠道等级）

| 值 | 说明 |
|------|------|
| S | S 级（最高） |
| A | A 级 |
| B | B 级 |
| C | C 级 |

### CommissionType（佣金类型）

| 值 | 说明 |
|------|------|
| FIXED | 固定佣金 |
| TIERED | 阶梯佣金 |

### CooperationMode（合作模式）

| 值 | 说明 |
|------|------|
| BASE_PRICE | 基础价 |
| COMMISSION | 佣金 |

### ChannelSettlementType（渠道结算类型）

| 值 | 说明 |
|------|------|
| PREPAY | 预付 |
| MONTHLY | 月结 |

## 售后相关

### AfterSalesStatus（售后工单状态）

| 值 | 说明 |
|------|------|
| PENDING | 待受理 |
| INVESTIGATING | 调查中 |
| PROCESSING | 处理中 |
| PENDING_VISIT | 待上门 |
| PENDING_CALLBACK | 待回访 |
| PENDING_VERIFY | 待验证 |
| CLOSED | 已关闭 |
| REJECTED | 已驳回 |

### LiablePartyType（责任方类型）

| 值 | 说明 |
|------|------|
| COMPANY | 公司 |
| FACTORY | 工厂 |
| INSTALLER | 安装师 |
| MEASURER | 测量师 |
| LOGISTICS | 物流 |
| CUSTOMER | 客户 |

### LiabilityStatus（定责状态）

| 值 | 说明 |
|------|------|
| DRAFT | 草稿 |
| PENDING_CONFIRM | 待确认 |
| CONFIRMED | 已确认 |
| DISPUTED | 有异议 |
| ARBITRATED | 已仲裁 |

### LiabilityReasonCategory（定责原因分类）

| 值 | 说明 |
|------|------|
| PRODUCTION_QUALITY | 生产质量 |
| CONSTRUCTION_ERROR | 施工错误 |
| DATA_ERROR | 数据错误 |
| SALES_ERROR | 销售错误 |
| LOGISTICS_ISSUE | 物流问题 |
| CUSTOMER_REASON | 客户原因 |

## 审批相关

### ApprovalStatus（审批状态）

| 值 | 说明 |
|------|------|
| PENDING | 待审批 |
| APPROVED | 已通过 |
| REJECTED | 已驳回 |
| ESCALATED | 已升级 |

## 房间类型

### RoomType（房间类型）

| 值 | 说明 |
|------|------|
| LIVING_ROOM | 客厅 |
| BEDROOM | 卧室 |
| DINING_ROOM | 餐厅 |
| STUDY | 书房 |
| BALCONY | 阳台 |
| BATHROOM | 卫生间 |
| KITCHEN | 厨房 |
| OTHER | 其他 |

## 窗帘相关

### HeaderProcessType（帘头工艺）

| 值 | 说明 |
|------|------|
| HOOK | 钩子 |
| PUNCH | 打孔 |
| FIXED_PLEAT | 固定褶 |

## 结算类型

### SettlementType（结算类型）

| 值 | 说明 |
|------|------|
| CASH | 现结 |
| TRANSFER | 转账 |

## 枚举值使用说明

### 枚举值命名规则

1. **全大写**：所有枚举值使用全大写字母
2. **下划线分隔**：多个单词使用下划线分隔
3. **语义清晰**：枚举值名称清晰表达含义

### 枚举值扩展规则

1. **向后兼容**：新增枚举值不影响现有代码
2. **不删除**：废弃的枚举值保留，标记为废弃
3. **文档更新**：枚举值变更及时更新文档

### 枚举值验证

1. **服务端验证**：所有枚举值在服务端验证
2. **客户端验证**：客户端也可以验证枚举值
3. **错误提示**：无效枚举值返回明确错误提示

### 枚举值国际化

枚举值支持国际化，需要提供多语言翻译：

```json
{
  "HIGH": {
    "zh": "高意向",
    "en": "High Intention"
  },
  "MEDIUM": {
    "zh": "中意向",
    "en": "Medium Intention"
  },
  "LOW": {
    "zh": "低意向",
    "en": "Low Intention"
  }
}
```

### 枚举值排序

部分枚举值有明确的排序顺序：

1. **客户等级**：A > B > C > D
2. **意向等级**：HIGH > MEDIUM > LOW
3. **渠道等级**：S > A > B > C
4. **订单状态**：按业务流程顺序

### 枚举值转换

枚举值可以转换为显示名称：

```javascript
function getEnumDisplayName(enumValue, locale = 'zh') {
  const enumMap = {
    'HIGH': { zh: '高意向', en: 'High Intention' },
    'MEDIUM': { zh: '中意向', en: 'Medium Intention' },
    'LOW': { zh: '低意向', en: 'Low Intention' }
  };
  return enumMap[enumValue]?.[locale] || enumValue;
}
```

### 枚举值过滤

部分接口支持按枚举值过滤：

```javascript
// 按状态过滤
GET /api/v1/leads?status=FOLLOWING_UP

// 按多个状态过滤
GET /api/v1/leads?status=FOLLOWING_UP,WON

// 按意向等级过滤
GET /api/v1/leads?intention_level=HIGH,MEDIUM
```

### 枚举值统计

部分接口支持按枚举值统计：

```javascript
GET /api/v1/leads/statistics?group_by=status

Response:
{
  "by_status": {
    "PENDING_ASSIGNMENT": 10,
    "FOLLOWING_UP": 50,
    "WON": 30,
    "INVALID": 10
  }
}
```

### 枚举值颜色标识

前端可以使用不同颜色标识枚举值：

```javascript
function getEnumColor(enumValue) {
  const colorMap = {
    'HIGH': 'red',
    'MEDIUM': 'orange',
    'LOW': 'green',
    'PENDING': 'gray',
    'COMPLETED': 'green',
    'CANCELLED': 'red'
  };
  return colorMap[enumValue] || 'gray';
}
```

### 枚举值图标

前端可以使用不同图标标识枚举值：

```javascript
function getEnumIcon(enumValue) {
  const iconMap = {
    'PHONE_CALL': 'phone',
    'WECHAT_CHAT': 'wechat',
    'STORE_VISIT': 'store',
    'HOME_VISIT': 'home',
    'PENDING': 'clock',
    'COMPLETED': 'check',
    'CANCELLED': 'close'
  };
  return iconMap[enumValue] || 'info';
}
```
