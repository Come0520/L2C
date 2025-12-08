# 数据库设计文档

本目录包含项目的数据库设计文档，主要由数据字典和设计缺口分析组成。

## 📁 文件说明

| 文件名 | 说明 |
|--------|------|
| `00-数据库设计缺口分析.md` | 分析当前数据库设计与业务需求之间的差距，列出缺失的表和字段。 |
| `01-数据字典.md` | 整合了所有数据库表的定义，包括表结构、索引设计和关联关系。 |

## 🗂️ 数据字典概览

数据字典按业务模块分为以下几个部分：

1. **用户与权限 (User & Auth)**: `usr_users`
2. **线索与客户 (CRM)**: `lead_leads`, `customer_customers`, `business_customers`
3. **渠道与门店 (Channel & Store)**: `channel_channels`, `store_stores`
4. **商品与供应链 (Product & Supply Chain)**: `product_categories`, `products`, `packages`, `package_items`, `suppliers`
5. **销售订单 (Sales Order)**: `sales_orders`, `sales_order_items`, `sales_order_packages`, `sales_order_amounts`
6. **交付与服务 (Delivery & Service)**: `measurement_orders`, `installation_orders`, `reconciliation_orders`
