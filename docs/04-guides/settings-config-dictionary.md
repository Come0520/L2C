# L2C 平台系统设置配置字典

> **版本：** 1.0 (L5 级文档)
> **适用范围：** 租户管理员 / 系统运维

本模块提供整套 SaaS 应用的租户级动态配置。配置项分为：系统键值配置、租户业务配置、报价模式配置及个人偏好。

---

## 1. 系统键值配置 (System Settings)

存储于 `system_settings` 表。所有配置项按分类分组，支持动态类型解析。

### 1.1 线索设置 (LEAD)

| 配置键 (`key`)                      | 类型    | 默认值        | 业务含义与影响                               |
| :---------------------------------- | :------ | :------------ | :------------------------------------------- |
| `ENABLE_LEAD_AUTO_RECYCLE`          | BOOLEAN | `true`        | 是否启用线索自动回收进公海池。               |
| `LEAD_AUTO_RECYCLE_TIMEOUT`         | INTEGER | `24`          | 认领后超过 X 小时未首访则回收。              |
| `LEAD_AUTO_RECYCLE_DAYS`            | INTEGER | `30`          | 线索录入超过 X 天未成交则回收。              |
| `LEAD_DAILY_CLAIM_LIMIT`            | INTEGER | `10`          | 每名员工每日从公海池认领上限。               |
| `LEAD_AUTO_ASSIGN_RULE`             | ENUM    | `ROUND_ROBIN` | 线索分配策略，可选：`ROUND_ROBIN` (轮询)。   |
| `LEAD_DUPLICATE_STRATEGY`           | ENUM    | `AUTO_LINK`   | 重复线索处理，可选：`AUTO_LINK` (自动关联)。 |
| `ENABLE_SECOND_KEY_DUPLICATE_CHECK` | BOOLEAN | `true`        | 是否启用详细地址/经纬度查重。                |
| `LEAD_FOLLOW_UP_INTERVALS`          | JSON    | `{...}`       | 各品类跟进间隔配置（小时）。                 |

### 1.2 渠道设置 (CHANNEL)

| 配置键 (`key`)              | 类型    | 默认值  | 业务含义与影响                     |
| :-------------------------- | :------ | :------ | :--------------------------------- |
| `CHANNEL_PROTECTION_PERIOD` | INTEGER | `30`    | 报备生效后的保护期时长（天）。     |
| `CHANNEL_LEVEL_RULES`       | JSON    | `[...]` | 渠道等级定义及对应的业绩达成标准。 |

### 1.3 收款设置 (PAYMENT)

| 配置键 (`key`)                  | 类型    | 默认值          | 业务含义与影响                         |
| :------------------------------ | :------ | :-------------- | :------------------------------------- |
| `ENABLE_PAYMENT_APPROVAL`       | BOOLEAN | `true`          | 收款流水是否需经过财务/店长审批。      |
| `PAYMENT_APPROVER_ROLE`         | ENUM    | `STORE_MANAGER` | 负责收款审批的系统角色代码。           |
| `EARNEST_MONEY_MAX_RATIO`       | DECIMAL | `0.5`           | 定金金额占订单总额的最大不允许比例。   |
| `ENABLE_FREE_MEASURE_APPROVAL`  | BOOLEAN | `true`          | 后台生成的免费测量单是否需审批。       |
| `FREE_MEASURE_APPROVAL_TIMEOUT` | INTEGER | `24`            | 免费测量审批任务自动过期时间（小时）。 |

### 1.4 测量与安装 (MEASURE/ORDER)

| 配置键 (`key`)                 | 类型    | 默认值          | 业务含义与影响                      |
| :----------------------------- | :------ | :-------------- | :---------------------------------- |
| `ENABLE_MEASURE_FEE_CHECK`     | BOOLEAN | `true`          | 派发测量任务时是否强制核算测量费。  |
| `MEASURE_LATE_THRESHOLD`       | INTEGER | `30`            | 测量员签到经纬度偏差/时间偏差阈值。 |
| `ENABLE_ORDER_CANCEL_APPROVAL` | BOOLEAN | `true`          | 订单提交后申请撤销是否需审批。      |
| `ORDER_CANCEL_APPROVER_ROLE`   | ENUM    | `STORE_MANAGER` | 负责订单撤销审批的角色。            |

### 1.5 审批流增强 (APPROVAL)

| 配置键 (`key`)                   | 类型    | 默认值 | 业务含义与影响                       |
| :------------------------------- | :------ | :----- | :----------------------------------- |
| `APPROVAL_TIMEOUT_REMINDER`      | INTEGER | `2`    | 距离审批超时 X 小时向审批人发通知。  |
| `APPROVAL_TIMEOUT_DAYS`          | INTEGER | `3`    | 审批任务在待办列表中留存的最大天数。 |
| `ENABLE_APPROVAL_AUTO_ESCALATE`  | BOOLEAN | `true` | 是否开启审批超时自动流转至上一级。   |
| `APPROVAL_AUTO_ESCALATE_TIMEOUT` | INTEGER | `24`   | 自动流转触发的超时时间（小时）。     |
| `QUOTE_DISCOUNT_THRESHOLD`       | DECIMAL | `0.8`  | 报价折率低于此值时触发风险警告审批。 |
| `QUOTE_LOW_MARGIN_THRESHOLD`     | DECIMAL | `0.15` | 毛利率低于此值时强制要求财务联签。   |

### 1.6 通知与报表 (NOTIFICATION/REPORT)

| 配置键 (`key`)               | 类型    | 默认值       | 业务含义与影响                       |
| :--------------------------- | :------ | :----------- | :----------------------------------- |
| `ENABLE_SYSTEM_NOTIFICATION` | BOOLEAN | `true`       | 启用 PC/移动端站内信通知。           |
| `ENABLE_SMS_NOTIFICATION`    | BOOLEAN | `false`      | 是否开启短信通道（需配置 API Key）。 |
| `ENABLE_WECHAT_NOTIFICATION` | BOOLEAN | `true`       | 是否开启企业微信/公众号通知。        |
| `NOTIFICATION_CHANNELS`      | JSON    | `["IN_APP"]` | 默认全开或仅部分开启的通知渠道。     |
| `NOTIFICATION_RETRY_COUNT`   | INTEGER | `3`          | 发送失败后的最大重试次数。           |
| `DASHBOARD_UPDATE_FREQUENCY` | ENUM    | `DAILY`      | 指标统计结果的聚合频率。             |
| `ENABLE_MANUAL_REFRESH`      | BOOLEAN | `true`       | 管理端是否可见"即时更新"按钮。       |

---

## 2. 租户业务配置 (Tenant Config)

这些配置项存储于 `tenants` 表的结构化字段中，通过 `tenant-config.ts` 进行管理。

### 2.1 收款规则 (ARPaymentConfig)

- `enableInstallment`: 是否允许分期付款。
- `minDepositRatio`: 最低首付/定金比例 (0-1)。
- `minDepositAmount`: 最低定金固定金额。
- `depositCalcRule`: 定金计算规则 (`HIGHER` | `LOWER` | `RATIO_ONLY` | `AMOUNT_ONLY`)。
- `allowDebtInstallCash`: 允许欠费情况下进行现金结算。
- `requireDebtInstallApproval`: 欠费安装是否需要申请特批流程。

### 2.2 付款策略 (APPaymentConfig)

- `prepaidBonusType`: 预付赠送类型 (`BALANCE` 余额 / `GOODS` 赠品)。
- `prepaidBonusRatio`: 赠送价值比例。

### 2.3 工作流模式 (WorkflowModeConfig)

- `enableLeadAssignment`: 自动分配线索开关。
- `measureDispatchMode`: 测量派单模式 (`SELF` 员工自抢 / `DISPATCHER` 平台派发 / `SALES` 业务员指定)。
- `installDispatchMode`: 安装派单模式 (同上)。
- `enableLaborFeeCalc`: 启用劳务费用自动化结算。
- `enableOutsourceProcessing`: 允许将工序外包给外部工厂。
- `enablePurchaseApproval`: 采购入库/直发操作是否需通过审批。

---

## 3. 报价配置 (Quote Config)

- `defaultMode`: 默认报价模式 (`QUICK` 快速报价 / `ADVANCED` 深度精算)。
- `quickModeFields`: 快速报价页面展示的字段组合。
- `defaultValues`:
  - `installPosition`: 默认安装位置 (例如: 顶装)。
  - `groundClearance`: 默认离地距离 (cm)。
  - `foldRatio`: 默认褶皱比例 (例如: 2.0)。

---

## 4. 用户个人偏好 (User Preferences)

- `quoteMode`: 用户进入报价页时的默认交互视图 (`PRODUCT_FIRST` 按产品选空间 / `SPACE_FIRST` 按空间选产品)。
