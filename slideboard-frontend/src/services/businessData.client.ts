import { createClient } from '@/lib/supabase/client';

// 经营数据类型定义
export interface BusinessData {
    date: string; // 日期
    totalSales: number; // 总销售额
    totalOrders: number; // 总订单数
    newCustomers: number; // 新增客户数
    pendingOrders: number; // 待处理订单数
    completedOrders: number; // 已完成订单数
    totalLeads: number; // 总线索数
    qualifiedLeads: number; // 合格线索数
    leadConversionRate: number; // 线索转化率
    avgOrderValue: number; // 平均订单价值
    inventoryValue: number; // 库存价值
    lowStockItems: number; // 低库存商品数
}

// 销售数据类型
export interface SalesData {
    id: string;
    salesNo: string;
    customerName: string;
    totalAmount: number;
    status: string;
    createdAt: string;
}

// 线索数据类型
export interface LeadData {
    id: string;
    name: string;
    status: string;
    createdAt: string;
    // qualified: boolean; // Supabase schema might not have this exact field, need to check or infer
}

export const businessDataService = {
    /**
     * 获取销售数据
     */
    async getSalesData(dateRange?: { start: string; end: string }) {
        const supabase = createClient();
        let query = supabase
            .from('sales_orders')
            .select(`
        id,
        sales_no,
        status,
        created_at,
        customer:customers(name),
        amount:sales_order_amounts(total_amount)
      `);

        if (dateRange) {
            query = query.gte('created_at', `${dateRange.start}T00:00:00`)
                .lte('created_at', `${dateRange.end}T23:59:59`);
        }

        const { data, error } = await query;

        if (error) throw new Error(error.message);

        return (data || []).map((item: any) => ({
            id: item.id,
            salesNo: item.sales_no,
            customerName: item.customer?.name || 'Unknown',
            totalAmount: item.amount?.total_amount || 0,
            status: item.status,
            createdAt: item.created_at
        }));
    },

    /**
     * 获取线索数据
     */
    async getLeadData(dateRange?: { start: string; end: string }) {
        const supabase = createClient();
        let query = supabase
            .from('leads')
            .select('*');

        if (dateRange) {
            query = query.gte('created_at', `${dateRange.start}T00:00:00`)
                .lte('created_at', `${dateRange.end}T23:59:59`);
        }

        const { data, error } = await query;

        if (error) throw new Error(error.message);

        return (data || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            status: item.status,
            createdAt: item.created_at,
            // Assuming 'qualified' status or a specific field exists. 
            // If not, we might need to infer it from status (e.g. status != 'new' and status != 'lost')
            // For now, let's assume a status 'qualified' or similar, or just map it if the field exists.
            // Checking previous leads migration, status values were: new, contacted, qualified, proposal, negotiation, won, lost
            qualified: item.status === 'qualified' || item.status === 'won' || item.status === 'negotiation' || item.status === 'proposal'
        }));
    },

    /**
     * 获取客户数据
     */
    async getCustomerData(dateRange?: { start: string; end: string }) {
        const supabase = createClient();
        let query = supabase
            .from('customers')
            .select('*');

        if (dateRange) {
            query = query.gte('created_at', `${dateRange.start}T00:00:00`)
                .lte('created_at', `${dateRange.end}T23:59:59`);
        }

        const { data, error } = await query;

        if (error) throw new Error(error.message);

        return data || [];
    },

    /**
     * 获取库存数据
     */
    async getInventoryData() {
        const supabase = createClient();
        // Assuming 'products' table holds inventory info
        const { data, error } = await supabase
            .from('products')
            .select('id, product_name, stock_quantity, cost_price');

        if (error) throw new Error(error.message);

        return (data || []).map((item: any) => ({
            id: item.id,
            name: item.product_name,
            quantity: item.stock_quantity || 0,
            unitPrice: item.cost_price || 0, // Using cost price for inventory value
            minStock: 10 // Hardcoded or should be in DB? Assuming 10 for now as per legacy logic implication
        }));
    },

    /**
     * 计算经营数据
     */
    async calculateBusinessData(date?: string): Promise<BusinessData> {
        const targetDate: string = (date || new Date().toISOString().split('T')[0]) as string;
        const dateRange = {
            start: targetDate,
            end: targetDate
        };

        // 并行获取各类数据
        const [salesData, leadData, customerData, inventoryData] = await Promise.all([
            this.getSalesData(dateRange),
            this.getLeadData(dateRange),
            this.getCustomerData(dateRange),
            this.getInventoryData()
        ]);

        // 定义类型
        interface SalesOrder {
            totalAmount: number;
            status: string;
        }

        interface Lead {
            qualified: boolean;
        }

        interface InventoryItem {
            quantity: number;
            unitPrice: number;
            minStock: number;
        }

        // 计算销售相关指标
        const totalSales = salesData.reduce((sum: number, order: SalesOrder) => sum + order.totalAmount, 0);
        const totalOrders = salesData.length;
        const pendingOrders = salesData.filter((order: SalesOrder) => order.status === 'draft' || order.status === 'pending').length;
        const completedOrders = salesData.filter((order: SalesOrder) => order.status === 'completed').length;
        const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

        // 计算线索相关指标
        const totalLeads = leadData.length;
        const qualifiedLeads = leadData.filter((lead: Lead) => lead.qualified).length;
        const leadConversionRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;

        // 计算客户相关指标
        const newCustomers = customerData.length;

        // 计算库存相关指标
        const inventoryValue = inventoryData.reduce((sum: number, item: InventoryItem) => sum + (item.quantity * item.unitPrice), 0);
        const lowStockItems = inventoryData.filter((item: InventoryItem) => item.quantity <= item.minStock).length;

        return {
            date: targetDate,
            totalSales,
            totalOrders,
            newCustomers,
            pendingOrders,
            completedOrders,
            totalLeads,
            qualifiedLeads,
            leadConversionRate,
            avgOrderValue,
            inventoryValue,
            lowStockItems
        };
    },

    /**
     * 获取格式化的经营数据，适合录入飞书多维表格
     */
    async getFormattedBusinessData(date?: string) {
        const businessData = await this.calculateBusinessData(date);

        // 格式化为适合飞书多维表格的格式
        return {
            日期: businessData.date,
            总销售额: businessData.totalSales,
            总订单数: businessData.totalOrders,
            新增客户数: businessData.newCustomers,
            待处理订单数: businessData.pendingOrders,
            已完成订单数: businessData.completedOrders,
            总线索数: businessData.totalLeads,
            合格线索数: businessData.qualifiedLeads,
            线索转化率: businessData.leadConversionRate / 100, // Feishu percent format expects 0-1 usually, or we keep as number. Legacy had string "xx%". Let's check feishuBitable.ts. 
            // feishuBitable.ts says: formatter: 'percent'. Usually this means 0.5 for 50%. 
            // Legacy code: `${businessData.leadConversionRate.toFixed(2)}%` -> this is a string.
            // If the field type is Number with percent formatting, it might expect a number.
            // Let's stick to legacy behavior if possible, or adjust. 
            // Legacy `getFormattedBusinessData` returned a string for `线索转化率`.
            // But `feishuBitable.ts` defines the field as `type: 2` (Number) with `formatter: 'percent'`.
            // If we send a string "50.00%" to a Number field, it might fail or parse it.
            // Safest is to send the number.
            // Wait, legacy code: `线索转化率: \`\${businessData.leadConversionRate.toFixed(2)}%\``
            // If legacy worked, maybe Feishu accepts string? Or maybe legacy was wrong?
            // I will return the number value (0-1) which is standard for percent fields.
            // businessData.leadConversionRate is 0-100. So / 100.

            平均订单价值: businessData.avgOrderValue,
            库存价值: businessData.inventoryValue,
            低库存商品数: businessData.lowStockItems
        };
    }
};
