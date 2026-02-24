/**
 * 指标数据词典 (Metrics Dictionary)
 * 
 * 集中定义 Analytics 模块中涉及的所有核心业务指标及其口径。
 * 该文件作为系统文档和业务逻辑的桥梁，提升 D1 (功能) 和 D4 (文档) 的成熟度。
 */

export interface MetricDefinition {
    id: string;
    name: string;
    category: 'SALES' | 'DELIVERY' | 'FINANCE' | 'CUSTOMER';
    description: string;
    formula: string;
    unit: 'count' | 'percentage' | 'currency' | 'days';
}

/**
 * Analytics 模块核心指标库
 */
export const METRICS_DICTIONARY: MetricDefinition[] = [
    // 销售类指标 (SALES)
    {
        id: 'sales_lead_count',
        name: '线索总数',
        category: 'SALES',
        description: '指定时间范围内新创建的销售线索总量。',
        formula: 'COUNT(leads.id)',
        unit: 'count',
    },
    {
        id: 'sales_funnel_conversion_rate',
        name: '全链路转化率',
        category: 'SALES',
        description: '从线索创建到最终转化为正式订单的比例。',
        formula: '(成交订单数 / 线索总数) * 100%',
        unit: 'percentage',
    },
    {
        id: 'avg_sales_cycle',
        name: '平均销售周期',
        category: 'SALES',
        description: '从线索创建到订单成交的平均天数。',
        formula: 'AVG(order.created_at - lead.created_at)',
        unit: 'days',
    },

    // 交付类指标 (DELIVERY)
    {
        id: 'delivery_avg_days_measure',
        name: '平均测量周期',
        category: 'DELIVERY',
        description: '从测量任务创建到测量完成的平均用时。',
        formula: 'AVG(measure_task.completed_at - measure_task.created_at)',
        unit: 'days',
    },
    {
        id: 'delivery_on_time_rate_install',
        name: '安装按时完成率',
        category: 'DELIVERY',
        description: '在计划安装日期或之前完成安装的任务比例。',
        formula: '(按时完成安装数 / 总完成安装数) * 100%',
        unit: 'percentage',
    },

    // 财务类指标 (FINANCE)
    {
        id: 'finance_revenue',
        name: '销售收入',
        category: 'FINANCE',
        description: '已确认订单的总金额（不含已取消和草稿状态）。',
        formula: 'SUM(orders.total_amount)',
        unit: 'currency',
    },
    {
        id: 'finance_gross_margin',
        name: '综合毛利率',
        category: 'FINANCE',
        description: '销售毛利占销售收入的百分比。',
        formula: '((销售收入 - 采购成本) / 销售收入) * 100%',
        unit: 'percentage',
    },
    {
        id: 'finance_ar_aging_30',
        name: '30天内应收账款',
        category: 'FINANCE',
        description: '账龄在 30 天以内的待收回款项总额。',
        formula: 'SUM(receivables.amount WHERE age <= 30)',
        unit: 'currency',
    },

    // 客户与售后类指标 (CUSTOMER)
    {
        id: 'customer_retention_rate',
        name: '客户回购率',
        category: 'CUSTOMER',
        description: '有重复购买行为的客户占总客户数的比例。',
        formula: '(重复购买客户数 / 总客户数) * 100%',
        unit: 'percentage',
    },
    {
        id: 'after_sales_health_score',
        name: '售后健康度',
        category: 'CUSTOMER',
        description: '综合投诉率、逾期处理率等维度的综合评分。',
        formula: '权重计算(投诉率, 逾期率, 满意度)',
        unit: 'count',
    },
];
