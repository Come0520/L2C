# 库存系统实施细则

## 1. Schema 设计 (`src/shared/api/schema/inventory.ts`)
- **Warehouses**: 仓库定义
- **Inventory**: 产品库存 (ProductId + WarehouseId)
- **InventoryLogs**: 变更日志 (Type: IN/OUT/ADJUST/TRANSFER)

## 2. Server Actions (`src/features/supply-chain/actions/inventory-actions.ts`)
- `adjustInventory`: 盘点/调整
- `transferInventory`: 调拨
- `recordStockIn`: 采购入库

## 3. UI Components
- `InventoryList`: 库存列表
- `StockInButton`: 采购单入库按钮
