# 类型与Lint集中修复计划

## 修复范围

1. **订单状态主路径文件** (`src/app/orders/status/[status]/page.tsx`)
2. **测量待分配组件** (`src/features/orders/components/measuring-pending-assignment-view.tsx`)
3. **安装待分配组件** (`src/features/orders/components/installing-pending-assignment-view.tsx`)

## 修复内容

### 1. 定义明确的接口

**在订单状态主路径文件中**：

* 定义 `Order` 接口，包含完整的订单属性

* 定义 `MeasurementOrder` 接口，明确测量订单的结构

* 定义 `Measurer` 接口，明确测量师的结构

* 替换所有内联类型和类型断言

**在测量待分配组件中**：

* 扩展 `Order` 接口，添加测量相关属性

* 修复接口属性不匹配问题

**在安装待分配组件中**：

* 扩展 `Order` 接口，添加安装相关属性

### 2. 修复 Logger 使用错误

**在测量待分配组件中**：

* 修复第153行：`error` 变量未定义，应改为 `_`

* 修复第238行：`error` 变量未定义，应改为 `_`

* 修复第281行：`error` 变量未定义，应改为 `_`

### 3. 修复属性访问错误

**在测量待分配组件中**：

* 修复第396行：`order.projectAddress` 应改为 `order.address`

* 修复第399行：`order.sales` 应改为 `order.creator`

**在订单状态主路径文件中**：

* 修复测量订单和测量师的数组访问问题，明确它们的结构

### 4. 确保使用 Logger 替代 Console

检查所有文件，确保没有直接使用 `console.log` 或 `console.error`，而是使用 `logger` 工具。

## 修复步骤

1. **第一步**：在订单状态主路径文件中定义完整的接口
2. **第二步**：修复订单状态主路径文件中的类型断言和属性访问
3. **第三步**：修复测量待分配组件中的 Logger 使用错误和属性访问错误
4. **第四步**：修复安装待分配组件中的相关问题
5. **第五步**：运行 Lint 检查，确保所有修复符合规范

## 预期结果

* 所有 `any` 类型被替换为明确的接口

* 所有 Logger 使用正确

* 所有属性访问错误被修复

* 代码符合 Lint 规范

* 类型安全得到提升，减少运行时错误风险

