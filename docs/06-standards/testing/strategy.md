# 测试策略文档 (Test Strategy)

> **目标**: 构建"金字塔型"测试体系，确保 L2C 系统在本地开发阶段的绝对稳定性，为后续部署奠定基础。

## 1. 测试分层体系 (Testing Pyramid)

我们采用经典的三层测试架构：

### 1.1 E2E 端到端测试 (Top Layer - 20%)
- **工具**: Playwright
- **目标**: 模拟真实用户行为，验证完整业务闭环。
- **覆盖**: 7 大核心业务流 (Flows)。
- **特点**: 黑盒测试，依赖真实数据库和 DOM 交互。
- **位置**: `e2e/flows/*.spec.ts`

### 1.2 集成测试 (Middle Layer - 30%)
- **工具**: Vitest + TestContainers (或独立 DB Schema)
- **目标**: 验证 Server Actions、API Routes 与数据库的交互。
- **覆盖**:
    - 复杂 SQL 查询与事务 (Transactions)。
    - 权限校验 (RBAC)。
    - 状态机流转 (State Machine Transitions)。
- **位置**: `src/features/**/__tests__/*.test.ts`

### 1.3 单元测试 (Base Layer - 50%)
- **工具**: Vitest
- **目标**: 验证纯逻辑函数的正确性，不依赖数据库。
- **覆盖**:
    - 报价计算公式 (Pricing Engines)。
    - 工具函数 (Formatters, Validators)。
    - Hook 逻辑 (useDebounce, etc.)。
- **位置**: 同上，通常以 `.spec.ts` 或 `logic.test.ts` 区分。

---

## 2. 核心测试场景 (E2E Scenarios)

以下是必须 100% 通过的七大核心链路：

### Flow 1: 销售闭环 (Sales Lifecycle)
- **Actor**: Sales
- **Steps**:
    1. 创建线索 (Lead) -> 状态: `NEW`
    2. 转换为报价 (Quick Quote) -> 状态: `DRAFT`
    3. 激活报价 (Activate) -> 状态: `ACTIVE`
    4. 转化为订单 (Convert to Order) -> 状态: `PENDING_PAYMENT`
- **Validation**: 检查订单金额是否与报价一致，线索状态是否闭环。

### Flow 2: 财务收款 (AR Lifecycle)
- **Actor**: Finance
- **Steps**:
    1. 基于订单生成对账单 (Statement)
    2. 录入定金 (Record Payment) -> 状态: `PARTIALLY_PAID`
    3. 审核收款 (Audit) -> 余额减少
    4. 录入尾款 -> 状态: `PAID`
- **Validation**: 确保订单状态自动更为 `PENDING_Production` (如配置自动流转)。

### Flow 3: 测量闭环 (Measurement)
- **Actor**: Sales -> Measurer
- **Steps**:
    1. 线索发起测量申请
    2. 派单员指派测量师 (Dispatch)
    3. 测量师接单并提交数据 (Mobile Form)
    4. 销售复核 (Review) -> 生成精准报价
- **Validation**: 测量数据是否正确回填至报价单。

### Flow 4: 供应链与采购 (Supply Chain)
- **Actor**: Supply Chain Manager
- **Steps**:
    1. 订单自动拆分为采购单 (PO Split)
    2. 发送 PO 给供应商 (Send)
    3. 供应商确认 -> 生产完成 -> 发货
    4. 仓库收货入库 (Inbound)
- **Validation**: 检查库存数量变化，订单发货状态联动。

### Flow 5: 安装执行 (Installation)
- **Actor**: Installer
- **Steps**:
    1. 订单到货触发安装任务
    2. 安装师打卡 (Check-in)
    3. 上传验收照片
    4. 客户电子签名
- **Validation**: 订单最终完成 (COMPLETED) 并触发财务结算。

### Flow 6: 售后处理 (After-Sales)
- **Actor**: Customer Service
- **Steps**:
    1. 创建售后工单 (Ticket)
    2. 判定责任 (Liability) -> 关联原订单
    3. 发起补料或退款
    4. 结案
- **Validation**: 资金流与库存流的逆向冲正。

### Flow 7: 权限边界 (Security)
- **Actor**: Multiple Roles
- **Steps**:
    1. 销售尝试访问财务报表 -> 403 Forbidden
    2. 工人尝试修改订单金额 -> 403 Forbidden
    3. 离职员工登录 -> 401 Unauthorized
- **Validation**: 确保系统安全性。

---

## 3. 测试数据管理 (Data Management)

### 3.1 种子数据 (Seeding)
- **Global Seeds**: 字典表、管理员账号、基础配置 (运行 `pnpm db:seed`)。
- **Test Seeds**: 每个测试用例**独立**创建所需数据（如创建一个临时的 Lead，而不是复用数据库中已有的）。

### 3.2 数据库清理 (Teardown)
- 采用 **Reset 策略**: 每次全量 E2E 运行前重置数据库 (`pnpm db:reset`)。
- 单元/集成测试使用 **Transaction Rollback** 策略（如 Vitest 支持的话）或更快的内存数据库模拟。

---

## 4. 执行计划 (Execution Plan)

1.  **修复阶段 (Fixing)**:
    - 运行 `pnpm test:unit`，修复所有计算逻辑错误。
    - 运行 `pnpm test:e2e --project=setup`，确保环境就绪。

2.  **逐个击破 (One by One)**:
    - 按照 Flow 1 -> Flow 7 的顺序，依次运行并修复 E2E 测试。
    - 命令: `npx playwright test flows/full-sales-flow.spec.ts`

3.  **回归阶段 (Regression)**:
    - 运行全量测试，确保无退化。
    - 开启 CI 模拟运行。

---

## 5. 常见问题排查 (Troubleshooting)

- **Hydration Error**: 通常是 Date 渲染不一致导致，检查 `suppressHydrationWarning`。
- **Timeout**: 数据库事务死锁或 API 响应过慢，尝试增加 timeout 配置。
- **403 Forbidden**: 检查 Mock Session 的 Role 设置是否正确。
