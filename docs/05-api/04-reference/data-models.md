# 数据模型

> L2C 系统所有数据模型定义和说明

## 基础模型

### Tenant（租户）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 租户 ID |
| name | string | 是 | 租户名称 |
| code | string | 是 | 租户代码 |
| status | string | 是 | 状态：ACTIVE/INACTIVE |
| created_at | timestamp | 是 | 创建时间 |
| updated_at | timestamp | 是 | 更新时间 |

### User（用户）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 用户 ID |
| tenant_id | uuid | 是 | 租户 ID |
| name | string | 是 | 用户姓名 |
| phone | string | 是 | 手机号 |
| email | string | 否 | 邮箱 |
| avatar_url | string | 否 | 头像 URL |
| role | string | 是 | 角色：ADMIN/SALES/MANAGER/WORKER/FINANCE/SUPPLY |
| is_active | boolean | 是 | 是否激活 |
| created_at | timestamp | 是 | 创建时间 |
| updated_at | timestamp | 是 | 更新时间 |

## 客户模块

### Customer（客户）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 客户 ID |
| tenant_id | uuid | 是 | 租户 ID |
| customer_no | string | 是 | 客户编号 |
| name | string | 是 | 客户姓名 |
| type | string | 是 | 类型：INDIVIDUAL/COMPANY/DESIGNER/PARTNER |
| phone | string | 是 | 手机号 |
| phone_secondary | string | 否 | 备用手机号 |
| wechat | string | 否 | 微信号 |
| gender | string | 否 | 性别：MALE/FEMALE |
| birthday | timestamp | 否 | 生日 |
| level | string | 是 | 等级：A/B/C/D |
| lifecycle_stage | string | 是 | 生命周期阶段：LEAD/OPPORTUNITY/SIGNED/DELIVERED/LOST |
| pipeline_status | string | 是 | 流水线状态：UNASSIGNED/PENDING_FOLLOWUP/PENDING_MEASUREMENT/PENDING_QUOTE/QUOTE_SENT/IN_PRODUCTION/PENDING_DELIVERY/PENDING_INSTALLATION/COMPLETED |
| referrer_customer_id | uuid | 否 | 推荐人客户 ID |
| source_lead_id | uuid | 否 | 来源线索 ID |
| loyalty_points | integer | 是 | 积分 |
| referral_code | string | 否 | 推荐码 |
| total_orders | integer | 是 | 总订单数 |
| total_amount | decimal | 是 | 总金额 |
| avg_order_amount | decimal | 是 | 平均订单金额 |
| first_order_at | timestamp | 否 | 首次订单时间 |
| last_order_at | timestamp | 否 | 最后订单时间 |
| preferences | jsonb | 否 | 偏好设置 |
| notes | text | 否 | 备注 |
| tags | string[] | 否 | 标签 |
| is_merged | boolean | 是 | 是否已合并 |
| merged_from | uuid[] | 否 | 合并来源 |
| assigned_sales_id | uuid | 否 | 分配的销售 ID |
| created_by | uuid | 是 | 创建人 ID |
| created_at | timestamp | 是 | 创建时间 |
| updated_at | timestamp | 是 | 更新时间 |
| deleted_at | timestamp | 否 | 删除时间 |

### CustomerAddress（客户地址）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 地址 ID |
| tenant_id | uuid | 是 | 租户 ID |
| customer_id | uuid | 是 | 客户 ID |
| address | text | 是 | 地址 |
| community | string | 否 | 小区名称 |
| is_default | boolean | 是 | 是否默认地址 |
| created_at | timestamp | 是 | 创建时间 |
| updated_at | timestamp | 是 | 更新时间 |

## 线索模块

### Lead（线索）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 线索 ID |
| tenant_id | uuid | 是 | 租户 ID |
| lead_no | string | 是 | 线索编号 |
| customer_name | string | 是 | 客户姓名 |
| customer_phone | string | 是 | 客户手机号 |
| customer_wechat | string | 否 | 客户微信 |
| address | text | 否 | 客户地址 |
| community | string | 否 | 小区名称 |
| house_type | string | 否 | 房屋类型 |
| status | string | 是 | 状态：PENDING_ASSIGNMENT/PENDING_FOLLOWUP/FOLLOWING_UP/INVALID/WON |
| intention_level | string | 否 | 意向等级：HIGH/MEDIUM/LOW |
| channel_id | uuid | 否 | 渠道 ID |
| channel_contact_id | uuid | 否 | 渠道联系人 ID |
| source_channel_id | uuid | 否 | 来源渠道 ID |
| source_sub_id | uuid | 否 | 来源子渠道 ID |
| distribution_rule_id | uuid | 否 | 分配规则 ID |
| source_detail | string | 否 | 来源详情 |
| url_params | jsonb | 否 | URL 参数 |
| referrer_name | string | 否 | 推荐人姓名 |
| referrer_customer_id | uuid | 否 | 推荐人客户 ID |
| estimated_amount | decimal | 否 | 预估金额 |
| tags | string[] | 否 | 标签 |
| notes | text | 否 | 备注 |
| lost_reason | text | 否 | 流失原因 |
| assigned_sales_id | uuid | 否 | 分配的销售 ID |
| assigned_at | timestamp | 否 | 分配时间 |
| last_activity_at | timestamp | 否 | 最后活动时间 |
| next_followup_at | timestamp | 否 | 下次跟进时间 |
| next_followup_recommendation | timestamp | 否 | 系统推荐跟进时间 |
| decoration_progress | string | 否 | 装修进度：WATER_ELECTRIC/MUD_WOOD/INSTALLATION/PAINTING/COMPLETED |
| quoted_at | timestamp | 否 | 报价时间 |
| visited_store_at | timestamp | 否 | 到店时间 |
| won_at | timestamp | 否 | 成交时间 |
| customer_id | uuid | 否 | 关联客户 ID |
| created_by | uuid | 是 | 创建人 ID |
| created_at | timestamp | 是 | 创建时间 |
| updated_at | timestamp | 是 | 更新时间 |

### LeadActivity（跟进记录）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 记录 ID |
| tenant_id | uuid | 是 | 租户 ID |
| lead_id | uuid | 是 | 线索 ID |
| quote_id | uuid | 否 | 报价单 ID |
| purchase_intention | string | 否 | 购买意向：HIGH/MEDIUM/LOW |
| customer_level | string | 否 | 客户等级：A/B/C/D |
| activity_type | string | 是 | 活动类型：PHONE_CALL/WECHAT_CHAT/STORE_VISIT/HOME_VISIT/QUOTE_SENT/SYSTEM |
| content | text | 是 | 活动内容 |
| location | string | 否 | 活动地点 |
| next_followup_date | timestamp | 否 | 下次跟进日期 |
| created_by | uuid | 是 | 创建人 ID |
| created_at | timestamp | 是 | 创建时间 |

### LeadStatusHistory（线索状态历史）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 历史 ID |
| tenant_id | uuid | 是 | 租户 ID |
| lead_id | uuid | 是 | 线索 ID |
| old_status | string | 否 | 旧状态 |
| new_status | string | 是 | 新状态 |
| changed_by | uuid | 是 | 变更人 ID |
| changed_at | timestamp | 是 | 变更时间 |
| reason | text | 否 | 变更原因 |

## 报价单模块

### Quote（报价单）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 报价单 ID |
| tenant_id | uuid | 是 | 租户 ID |
| quote_no | string | 是 | 报价单编号 |
| customer_id | uuid | 是 | 客户 ID |
| lead_id | uuid | 否 | 线索 ID |
| measure_variant_id | uuid | 否 | 测量版本 ID |
| parent_quote_id | uuid | 否 | 父报价单 ID |
| is_active | boolean | 是 | 是否激活 |
| title | string | 否 | 标题 |
| total_amount | decimal | 是 | 总金额 |
| discount_rate | decimal | 否 | 折扣率 |
| discount_amount | decimal | 否 | 折扣金额 |
| final_amount | decimal | 是 | 最终金额 |
| status | string | 是 | 状态：DRAFT/SUBMITTED/ACCEPTED/REJECTED/EXPIRED |
| version | integer | 是 | 版本号 |
| valid_until | timestamp | 否 | 有效期至 |
| notes | text | 否 | 备注 |
| locked_at | timestamp | 否 | 锁定时间 |
| created_by | uuid | 是 | 创建人 ID |
| created_at | timestamp | 是 | 创建时间 |
| updated_at | timestamp | 是 | 更新时间 |

### QuoteRoom（报价单房间）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 房间 ID |
| tenant_id | uuid | 是 | 租户 ID |
| quote_id | uuid | 是 | 报价单 ID |
| name | string | 是 | 房间名称 |
| measure_room_id | uuid | 否 | 测量房间 ID |
| sort_order | integer | 是 | 排序 |
| created_at | timestamp | 是 | 创建时间 |

### QuoteItem（报价单项）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 报价单项 ID |
| tenant_id | uuid | 是 | 租户 ID |
| quote_id | uuid | 是 | 报价单 ID |
| parent_id | uuid | 否 | 父项 ID |
| room_id | uuid | 否 | 房间 ID |
| category | string | 是 | 分类：CURTAIN_FABRIC/TRACK/WALLPAPER/MOTOR/CURTAIN_ACCESSORY |
| product_id | uuid | 否 | 商品 ID |
| product_name | string | 是 | 商品名称 |
| product_sku | string | 否 | 商品 SKU |
| room_name | string | 否 | 房间名称 |
| unit | string | 否 | 单位 |
| unit_price | decimal | 是 | 单价 |
| quantity | decimal | 是 | 数量 |
| width | decimal | 否 | 宽度 |
| height | decimal | 否 | 高度 |
| fold_ratio | decimal | 否 | 折叠比 |
| process_fee | decimal | 否 | 加工费 |
| subtotal | decimal | 是 | 小计 |
| attributes | jsonb | 否 | 属性 |
| calculation_params | jsonb | 否 | 计算参数 |
| remark | text | 否 | 备注 |
| sort_order | integer | 是 | 排序 |
| created_at | timestamp | 是 | 创建时间 |

## 订单模块

### Order（订单）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 订单 ID |
| tenant_id | uuid | 是 | 租户 ID |
| order_no | string | 是 | 订单编号 |
| quote_id | uuid | 是 | 报价单 ID |
| quote_version_id | uuid | 是 | 报价单版本 ID |
| lead_id | uuid | 否 | 线索 ID |
| customer_id | uuid | 是 | 客户 ID |
| customer_name | string | 是 | 客户姓名（冗余） |
| customer_phone | string | 是 | 客户手机号（冗余） |
| delivery_address | text | 否 | 送货地址 |
| total_amount | decimal | 是 | 订单总金额 |
| paid_amount | decimal | 是 | 已付金额 |
| balance_amount | decimal | 是 | 欠款金额 |
| settlement_type | string | 是 | 结算类型：PREPAID/CREDIT/CASH |
| confirmation_img | text | 否 | 确认凭证 |
| payment_proof_img | text | 否 | 付款凭证 |
| payment_amount | decimal | 否 | 立即支付金额 |
| payment_method | string | 否 | 支付方式：CASH/WECHAT/ALIPAY/BANK |
| payment_time | timestamp | 否 | 支付时间 |
| prepaid_payment_id | uuid | 否 | 预收款单 ID |
| status | string | 是 | 订单状态：DRAFT/PENDING_MEASURE/MEASURED/QUOTED/SIGNED/PAID/PENDING_PRODUCTION/IN_PRODUCTION/PENDING_DELIVERY/PENDING_INSTALL/COMPLETED/CANCELLED |
| is_locked | boolean | 是 | 是否锁定 |
| locked_at | timestamp | 否 | 锁定时间 |
| sales_id | uuid | 否 | 销售人员 ID |
| remark | text | 否 | 备注 |
| created_by | uuid | 是 | 创建人 ID |
| created_at | timestamp | 是 | 创建时间 |
| updated_at | timestamp | 是 | 更新时间 |
| completed_at | timestamp | 否 | 完成时间 |
| closed_at | timestamp | 否 | 关闭时间 |
| deleted_at | timestamp | 否 | 删除时间 |

### OrderItem（订单项）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 订单项 ID |
| tenant_id | uuid | 是 | 租户 ID |
| order_id | uuid | 是 | 订单 ID |
| quote_item_id | uuid | 是 | 报价单项 ID |
| room_name | string | 是 | 房间名称 |
| product_id | uuid | 是 | 商品 ID |
| product_name | string | 是 | 商品名称 |
| category | string | 是 | 商品分类 |
| quantity | decimal | 是 | 数量 |
| width | decimal | 否 | 宽度 |
| height | decimal | 否 | 高度 |
| unit_price | decimal | 是 | 单价 |
| subtotal | decimal | 是 | 小计 |
| po_id | uuid | 否 | 采购单 ID |
| supplier_id | uuid | 否 | 供应商 ID |
| status | string | 是 | 状态：PENDING/PO_CREATED/PO_CONFIRMED/SHIPPED/RECEIVED |
| remark | text | 否 | 备注 |
| sort_order | integer | 是 | 排序 |
| created_at | timestamp | 是 | 创建时间 |

### PaymentSchedule（付款计划）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 付款计划 ID |
| tenant_id | uuid | 是 | 租户 ID |
| order_id | uuid | 是 | 订单 ID |
| statement_id | uuid | 否 | 对账单 ID |
| name | string | 是 | 名称 |
| amount | decimal | 是 | 金额 |
| expected_date | date | 否 | 预期日期 |
| actual_date | date | 否 | 实际日期 |
| status | string | 是 | 状态：PENDING/PAID |
| proof_img | text | 否 | 凭证图片 |
| created_at | timestamp | 是 | 创建时间 |
| updated_at | timestamp | 是 | 更新时间 |

## 测量模块

### MeasureTask（测量任务）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 测量任务 ID |
| tenant_id | uuid | 是 | 租户 ID |
| measure_no | string | 是 | 测量编号 |
| lead_id | uuid | 是 | 线索 ID |
| customer_id | uuid | 是 | 客户 ID |
| status | string | 是 | 状态：PENDING/DISPATCHING/PENDING_VISIT/PENDING_CONFIRM/COMPLETED/CANCELLED |
| scheduled_at | timestamp | 否 | 预约时间 |
| check_in_at | timestamp | 否 | 打卡时间 |
| check_in_location | jsonb | 否 | 打卡位置 |
| type | string | 是 | 类型：QUOTE_BASED/BLIND/SALES_SELF |
| assigned_worker_id | uuid | 否 | 分配的测量师 ID |
| round | integer | 是 | 轮次 |
| remark | text | 否 | 备注 |
| reject_count | integer | 是 | 拒绝次数 |
| reject_reason | text | 否 | 拒绝原因 |
| is_fee_exempt | boolean | 是 | 是否免测量费 |
| fee_check_status | string | 是 | 费用检查状态：NONE/PENDING/PAID/WAIVED/REFUNDED |
| fee_approval_id | uuid | 否 | 费用审批 ID |
| created_at | timestamp | 是 | 创建时间 |
| updated_at | timestamp | 是 | 更新时间 |
| completed_at | timestamp | 否 | 完成时间 |

### MeasureSheet（测量数据）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 测量数据 ID |
| tenant_id | uuid | 是 | 租户 ID |
| task_id | uuid | 是 | 测量任务 ID |
| status | string | 是 | 状态：DRAFT/CONFIRMED/ARCHIVED |
| round | integer | 是 | 轮次 |
| variant | string | 是 | 版本：A/B/C |
| site_photos | jsonb | 否 | 现场照片 |
| sketch_map | text | 否 | 草图 |
| created_at | timestamp | 是 | 创建时间 |
| updated_at | timestamp | 是 | 更新时间 |

### MeasureItem（测量项）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 测量项 ID |
| tenant_id | uuid | 是 | 租户 ID |
| sheet_id | uuid | 是 | 测量数据 ID |
| room_name | string | 是 | 房间名称 |
| window_type | string | 是 | 窗户类型：STRAIGHT/L_SHAPE/U_SHAPE/ARC |
| width | decimal | 是 | 宽度 |
| height | decimal | 是 | 高度 |
| install_type | string | 否 | 安装类型：TOP/SIDE |
| bracket_dist | decimal | 否 | 支架离地 |
| wall_material | string | 否 | 墙面材质：CONCRETE/WOOD/GYPSUM |
| has_box | boolean | 否 | 是否有窗帘盒 |
| box_depth | decimal | 否 | 窗帘盒深度 |
| is_electric | boolean | 否 | 是否电动 |
| remark | text | 否 | 备注 |
| segment_data | jsonb | 否 | 分段数据 |
| created_at | timestamp | 是 | 创建时间 |

## 安装模块

### InstallTask（安装任务）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 安装任务 ID |
| tenant_id | uuid | 是 | 租户 ID |
| task_no | string | 是 | 任务编号 |
| order_id | uuid | 是 | 订单 ID |
| customer_id | uuid | 是 | 客户 ID |
| status | string | 是 | 状态：PENDING/DISPATCHING/PENDING_VISIT/PENDING_CONFIRM/COMPLETED/CANCELLED |
| scheduled_at | timestamp | 否 | 预约时间 |
| completed_at | timestamp | 否 | 完成时间 |
| installer_id | uuid | 否 | 安装师 ID |
| address | text | 否 | 地址 |
| notes | text | 否 | 备注 |
| created_at | timestamp | 是 | 创建时间 |
| updated_at | timestamp | 是 | 更新时间 |

## 供应链模块

### Supplier（供应商）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 供应商 ID |
| tenant_id | uuid | 是 | 租户 ID |
| supplier_no | string | 是 | 供应商编号 |
| name | string | 是 | 供应商名称 |
| contact_person | string | 否 | 联系人 |
| phone | string | 否 | 电话 |
| payment_period | string | 否 | 结算周期：CASH/MONTHLY |
| is_active | boolean | 是 | 是否激活 |
| address | text | 否 | 地址 |
| remark | text | 否 | 备注 |
| created_by | uuid | 是 | 创建人 ID |
| created_at | timestamp | 是 | 创建时间 |
| updated_at | timestamp | 是 | 更新时间 |

### PurchaseOrder（采购单）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 采购单 ID |
| tenant_id | uuid | 是 | 租户 ID |
| po_no | string | 是 | 采购单编号 |
| order_id | uuid | 否 | 订单 ID |
| supplier_id | uuid | 否 | 供应商 ID |
| supplier_name | string | 是 | 供应商名称 |
| type | string | 是 | 类型：FINISHED/FABRIC/STOCK |
| split_rule_id | uuid | 否 | 拆单规则 ID |
| status | string | 是 | 状态：DRAFT/IN_PRODUCTION/READY/SHIPPED/DELIVERED |
| total_amount | decimal | 是 | 总金额 |
| expected_date | timestamp | 否 | 预期日期 |
| created_by | uuid | 是 | 创建人 ID |
| created_at | timestamp | 是 | 创建时间 |
| updated_at | timestamp | 是 | 更新时间 |

### PurchaseOrderItem（采购单项）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 采购单项 ID |
| tenant_id | uuid | 是 | 租户 ID |
| po_id | uuid | 是 | 采购单 ID |
| product_name | string | 是 | 商品名称 |
| quantity | decimal | 是 | 数量 |
| unit_price | decimal | 是 | 单价 |
| quote_item_id | uuid | 否 | 报价单项 ID |
| created_at | timestamp | 是 | 创建时间 |

### WorkOrder（加工单）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 加工单 ID |
| tenant_id | uuid | 是 | 租户 ID |
| wo_no | string | 是 | 加工单编号 |
| order_id | uuid | 是 | 订单 ID |
| po_id | uuid | 是 | 采购单 ID |
| supplier_id | uuid | 是 | 供应商 ID |
| status | string | 是 | 状态：PENDING/PROCESSING/COMPLETED/CANCELLED |
| start_at | timestamp | 否 | 开始时间 |
| completed_at | timestamp | 否 | 完成时间 |
| remark | text | 否 | 备注 |
| created_by | uuid | 是 | 创建人 ID |
| created_at | timestamp | 是 | 创建时间 |
| updated_at | timestamp | 是 | 更新时间 |
| deleted_at | timestamp | 否 | 删除时间 |

### WorkOrderItem（加工单项）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 加工单项 ID |
| wo_id | uuid | 是 | 加工单 ID |
| order_item_id | uuid | 是 | 订单项 ID |
| status | string | 是 | 状态：PENDING/PROCESSING/COMPLETED |
| created_at | timestamp | 是 | 创建时间 |

## 财务模块

### FinanceAccount（财务账户）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 账户 ID |
| tenant_id | uuid | 是 | 租户 ID |
| account_no | string | 是 | 账户编号 |
| account_name | string | 是 | 账户名称 |
| account_type | string | 是 | 账户类型：BANK/WECHAT/ALIPAY/CASH |
| account_number | string | 否 | 账号/卡号 |
| bank_name | string | 否 | 开户行 |
| branch_name | string | 否 | 开户支行 |
| holder_name | string | 是 | 持有人 |
| balance | decimal | 是 | 余额 |
| is_active | boolean | 是 | 是否激活 |
| is_default | boolean | 是 | 是否默认 |
| remark | text | 否 | 备注 |
| created_at | timestamp | 是 | 创建时间 |
| updated_at | timestamp | 是 | 更新时间 |

### PaymentOrder（收款单）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 收款单 ID |
| tenant_id | uuid | 是 | 租户 ID |
| payment_no | string | 是 | 收款单编号 |
| type | string | 是 | 类型：PREPAID/NORMAL |
| customer_id | uuid | 否 | 客户 ID |
| customer_name | string | 是 | 客户姓名 |
| customer_phone | string | 是 | 客户手机号 |
| total_amount | decimal | 是 | 总金额 |
| used_amount | decimal | 是 | 已用金额 |
| remaining_amount | decimal | 是 | 剩余金额 |
| status | string | 是 | 状态：DRAFT/PENDING/VERIFIED/REJECTED/PARTIAL_USED/FULLY_USED |
| payment_method | string | 是 | 支付方式：CASH/WECHAT/ALIPAY/BANK |
| account_id | uuid | 否 | 账户 ID |
| proof_url | text | 是 | 凭证 URL |
| received_at | timestamp | 是 | 收款时间 |
| remark | text | 否 | 备注 |
| created_by | uuid | 是 | 创建人 ID |
| verified_by | uuid | 否 | 审核人 ID |
| verified_at | timestamp | 否 | 审核时间 |
| created_at | timestamp | 是 | 创建时间 |
| updated_at | timestamp | 是 | 更新时间 |

### PaymentBill（付款单）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 付款单 ID |
| tenant_id | uuid | 是 | 租户 ID |
| payment_no | string | 是 | 付款单编号 |
| type | string | 是 | 类型：SUPPLIER/LABOR |
| payee_type | string | 是 | 收款方类型：SUPPLIER/WORKER |
| payee_id | uuid | 是 | 收款方 ID |
| payee_name | string | 是 | 收款方姓名 |
| amount | decimal | 是 | 金额 |
| status | string | 是 | 状态：DRAFT/PENDING/VERIFIED/REJECTED/PAID |
| payment_method | string | 是 | 支付方式：CASH/WECHAT/ALIPAY/BANK |
| account_id | uuid | 否 | 账户 ID |
| proof_url | text | 是 | 凭证 URL |
| paid_at | timestamp | 否 | 付款时间 |
| recorded_by | uuid | 是 | 记录人 ID |
| remark | text | 否 | 备注 |
| is_verified | boolean | 是 | 是否已审核 |
| verified_by | uuid | 否 | 审核人 ID |
| verified_at | timestamp | 否 | 审核时间 |
| created_at | timestamp | 是 | 创建时间 |
| updated_at | timestamp | 是 | 更新时间 |

### ARStatement（应收对账单）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 对账单 ID |
| tenant_id | uuid | 是 | 租户 ID |
| statement_no | string | 是 | 对账单编号 |
| order_id | uuid | 是 | 订单 ID |
| customer_id | uuid | 是 | 客户 ID |
| customer_name | string | 是 | 客户姓名 |
| settlement_type | string | 是 | 结算类型：PREPAID/CREDIT/CASH |
| total_amount | decimal | 是 | 总金额 |
| received_amount | decimal | 是 | 已收金额 |
| pending_amount | decimal | 是 | 待收金额 |
| status | string | 是 | 状态：PENDING_RECON/RECONCILED/INVOICED/PARTIAL/PAID/PENDING_DELIVER/COMPLETED/BAD_DEBT |
| invoice_no | string | 否 | 发票号 |
| invoiced_at | timestamp | 否 | 开票时间 |
| tax_rate | decimal | 否 | 税率 |
| tax_amount | decimal | 否 | 税额 |
| is_tax_inclusive | boolean | 否 | 是否含税 |
| completed_at | timestamp | 否 | 完成时间 |
| sales_id | uuid | 是 | 销售人员 ID |
| channel_id | uuid | 否 | 渠道 ID |
| commission_rate | decimal | 否 | 佣金率 |
| commission_amount | decimal | 否 | 佣金金额 |
| commission_status | string | 否 | 佣金状态：PENDING/CALCULATED/PAID |
| created_at | timestamp | 是 | 创建时间 |

## 商品模块

### Product（商品）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 商品 ID |
| tenant_id | uuid | 是 | 租户 ID |
| sku | string | 是 | 商品 SKU |
| name | string | 是 | 商品名称 |
| category | string | 是 | 分类：CURTAIN/WALLPAPER/WALLCLOTH/MATTRESS/OTHER/CURTAIN_FABRIC/CURTAIN_SHEER/CURTAIN_TRACK/MOTOR/CURTAIN_ACCESSORY |
| unit_price | decimal | 是 | 零售价 |
| unit | string | 是 | 单位 |
| purchase_price | decimal | 是 | 进价 |
| logistics_cost | decimal | 是 | 物流成本 |
| processing_cost | decimal | 是 | 加工成本 |
| loss_rate | decimal | 是 | 损耗率 |
| retail_price | decimal | 是 | 零售价 |
| channel_price_mode | string | 是 | 渠道价格模式：FIXED/DISCOUNT |
| channel_price | decimal | 是 | 渠道价 |
| channel_discount_rate | decimal | 是 | 渠道折扣率 |
| floor_price | decimal | 是 | 底价 |
| is_tob_enabled | boolean | 是 | 是否启用 B2B |
| is_toc_enabled | boolean | 是 | 是否启用 B2C |
| default_supplier_id | uuid | 否 | 默认供应商 ID |
| is_stockable | boolean | 是 | 是否可库存 |
| description | text | 否 | 描述 |
| specs | jsonb | 否 | 规格 |
| is_active | boolean | 是 | 是否激活 |
| created_by | uuid | 是 | 创建人 ID |
| created_at | timestamp | 是 | 创建时间 |
| updated_at | timestamp | 是 | 更新时间 |

## 渠道模块

### Channel（渠道）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 渠道 ID |
| tenant_id | uuid | 是 | 租户 ID |
| channel_no | string | 是 | 渠道编号 |
| name | string | 是 | 渠道名称 |
| type | string | 是 | 类型：DECORATION_CO/DESIGNER/CROSS_INDUSTRY |
| level | string | 是 | 等级：S/A/B/C |
| contact_person | string | 否 | 联系人 |
| phone | string | 否 | 电话 |
| address | text | 否 | 地址 |
| commission_type | string | 是 | 佣金类型：FIXED/TIERED |
| cooperation_mode | string | 是 | 合作模式：BASE_PRICE/COMMISSION |
| settlement_type | string | 是 | 结算类型：PREPAY/MONTHLY |
| is_active | boolean | 是 | 是否激活 |
| created_by | uuid | 是 | 创建人 ID |
| created_at | timestamp | 是 | 创建时间 |
| updated_at | timestamp | 是 | 更新时间 |

### ChannelContact（渠道联系人）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 联系人 ID |
| tenant_id | uuid | 是 | 租户 ID |
| channel_id | uuid | 是 | 渠道 ID |
| name | string | 是 | 姓名 |
| phone | string | 是 | 电话 |
| wechat | string | 否 | 微信 |
| email | string | 否 | 邮箱 |
| position | string | 否 | 职位 |
| is_primary | boolean | 是 | 是否主要联系人 |
| created_at | timestamp | 是 | 创建时间 |
| updated_at | timestamp | 是 | 更新时间 |

## 售后模块

### AfterSales（售后工单）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 售后工单 ID |
| tenant_id | uuid | 是 | 租户 ID |
| as_no | string | 是 | 售后工单编号 |
| order_id | uuid | 否 | 订单 ID |
| customer_id | uuid | 是 | 客户 ID |
| type | string | 是 | 类型：QUALITY/INSTALLATION/DELIVERY/OTHER |
| priority | string | 是 | 优先级：HIGH/MEDIUM/LOW |
| description | text | 是 | 描述 |
| status | string | 是 | 状态：PENDING/INVESTIGATING/PROCESSING/PENDING_VISIT/PENDING_CALLBACK/PENDING_VERIFY/CLOSED/REJECTED |
| assigned_to | uuid | 否 | 分配给 |
| resolved_at | timestamp | 否 | 解决时间 |
| created_by | uuid | 是 | 创建人 ID |
| created_at | timestamp | 是 | 创建时间 |
| updated_at | timestamp | 是 | 更新时间 |

### LiabilityNotice（定责单）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 定责单 ID |
| tenant_id | uuid | 是 | 租户 ID |
| notice_no | string | 是 | 定责单编号 |
| after_sales_id | uuid | 是 | 售后工单 ID |
| liable_party_type | string | 是 | 责任方类型：COMPANY/FACTORY/INSTALLER/MEASURER/LOGISTICS/CUSTOMER |
| liable_party_id | uuid | 是 | 责任方 ID |
| liable_party_name | string | 是 | 责任方姓名 |
| status | string | 是 | 状态：DRAFT/PENDING_CONFIRM/CONFIRMED/DISPUTED/ARBITRATED |
| reason_category | string | 是 | 原因分类：PRODUCTION_QUALITY/CONSTRUCTION_ERROR/DATA_ERROR/SALES_ERROR/LOGISTICS_ISSUE/CUSTOMER_REASON |
| amount | decimal | 否 | 金额 |
| created_by | uuid | 是 | 创建人 ID |
| created_at | timestamp | 是 | 创建时间 |
| updated_at | timestamp | 是 | 更新时间 |

## 审批模块

### Approval（审批）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 审批 ID |
| tenant_id | uuid | 是 | 租户 ID |
| approval_no | string | 是 | 审批编号 |
| type | string | 是 | 类型：MEASURE_FEE/ORDER_CANCEL/OTHER |
| title | string | 是 | 标题 |
| description | text | 是 | 描述 |
| status | string | 是 | 状态：PENDING/APPROVED/REJECTED/ESCALATED |
| applicant_id | uuid | 是 | 申请人 ID |
| approver_id | uuid | 否 | 审批人 ID |
| approved_at | timestamp | 否 | 审批时间 |
| rejection_reason | text | 否 | 拒绝原因 |
| created_at | timestamp | 是 | 创建时间 |
| updated_at | timestamp | 是 | 更新时间 |

### ApprovalFlow（审批流程）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 审批流程 ID |
| tenant_id | uuid | 是 | 租户 ID |
| name | string | 是 | 流程名称 |
| type | string | 是 | 类型 |
| steps | jsonb | 是 | 步骤 |
| is_active | boolean | 是 | 是否激活 |
| created_by | uuid | 是 | 创建人 ID |
| created_at | timestamp | 是 | 创建时间 |
| updated_at | timestamp | 是 | 更新时间 |
