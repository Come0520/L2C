# 数据分析指标词典 (Metrics Dictionary)

> 版本：v1.0 | 最后更新：2026-02-23
> 所有指标均以**含税**口径计算，除非特别注明

---

## 一、现金流指标 (Cash Flow)

| 指标名称 | 英文代码 | 计算公式 | 数据来源 |
|:---|:---|:---|:---|
| 本月收款总额 | `total_collected` | SUM(payment_amount) WHERE month=? | `finance.payments` |
| 本月应收账款 | `total_ar` | SUM(ar_amount - collected) | `finance.ar_records` |
| 账款回收率 | `collection_rate` | total_collected / total_billed × 100% | 计算值 |
| 逾期账款金额 | `overdue_amount` | SUM(ar_amount) WHERE due_date < NOW() | `finance.ar_records` |

---

## 二、销售漏斗指标 (Sales Funnel)

| 指标名称 | 英文代码 | 计算公式 | 数据来源 |
|:---|:---|:---|:---|
| 线索数量 | `lead_count` | COUNT(leads) | `leads` |
| 线索转化率 | `lead_conversion` | COUNT(quotes) / COUNT(leads) × 100% | 计算值 |
| 报价通过率 | `quote_win_rate` | COUNT(orders) / COUNT(quotes) × 100% | 计算值 |
| 平均成交周期 | `avg_deal_cycle` | AVG(order.created_at - lead.created_at) | 计算值 |
| 客均成交金额 | `avg_deal_size` | SUM(order.total) / COUNT(DISTINCT customer) | 计算值 |

---

## 三、销售人员效能指标 (Sales Efficiency)

| 指标名称 | 英文代码 | 计算公式 | 数据来源 |
|:---|:---|:---|:---|
| 目标达成率 | `target_achievement` | actual_sales / target_amount × 100% | `sales_targets` + `orders` |
| 人均成交金额 | `sales_per_person` | total_sales / active_sales_count | 计算值 |
| 月度同比增长 | `mom_growth` | (current_month - last_month) / last_month × 100% | 计算值 |

---

## 四、交付效能指标 (Delivery Efficiency)

| 指标名称 | 英文代码 | 计算公式 | 数据来源 |
|:---|:---|:---|:---|
| 平均量尺周期 | `avg_measure_days` | AVG(measure_completed_at - order_created_at) | `measure_tasks` |
| 平均安装完成周期 | `avg_install_days` | AVG(install_completed_at - measure_completed_at) | `install_tasks` |
| 按时完成率 | `on_time_rate` | COUNT(completed<=deadline) / COUNT(all) × 100% | 计算值 |

---

## 五、数据说明

> [!NOTE]
> 全部指标按**租户隔离**，同一 SQL 查询必须包含 `WHERE tenant_id = ?`。

> [!IMPORTANT]
> 历史数据（6个月以上）建议通过 Postgres Materialized View 预计算，而非实时聚合，避免对数据库造成压力。
