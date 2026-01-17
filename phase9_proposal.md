# Phase 9: Data Analytics & Reporting (Proposal)

Based on the requirements in `docs/02-requirements/modules/数据报表.md`, Phase 9 will focus on the **Data Dashboard**.

## 1. Goal
Provide a macro-view "Cockpit" for Store Managers, Financial Officers, and Sales Reps to monitor health and performance.

## 2. Key Features

### 2.1 Core Metrics Widgets (Stat Cards)
- **Sales Performance**: Total Sales (Month), New Leads, Conversion Rate.
- **Financial Health**: Accounts Receivable (AR), Accounts Payable (AP), Cash Flow.
- **Operational Efficiency**: Average Order Cycle Time, On-Time Delivery Rate.

### 2.2 Visual Charts
- **Sales Funnel**: Leads -> Measured -> Quoted -> Won.
- **Trend Analysis**: Line charts showing Order Count/Amount trends daily/weekly.
- **Leaderboard**: Top Sales Reps by Revenue/Orders.

### 2.3 Role-Based Views (Permission Service Integration)
- **Sales**: View only their own performance and ranking.
- **Manager**: View Store-wide performance and team leaderboard.
- **Finance**: View AR/AP aging analysis and cash flow.

## 3. Technology Stack
- **Charts**: `@ant-design/charts` (or Recharts if preferred).
- **Layout**: `react-grid-layout` for draggable/resizable widgets (optional for MVP).
- **Data Source**: Aggregated queries from `orders`, `leads`, `finance` tables.
