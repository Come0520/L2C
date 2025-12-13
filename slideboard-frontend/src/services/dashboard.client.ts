import { supabase } from '@/lib/supabase/client';
import { DashboardData, DashboardStats, RecentActivity, PendingTask } from '@/shared/types/dashboard';
import { startOfMonth, subMonths, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const dashboardService = {
  async getDashboardOverview(): Promise<DashboardData> {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now).toISOString();
    const startOfLastMonth = startOfMonth(subMonths(now, 1)).toISOString();

    // 1. Fetch Stats
    // Revenue
    const { data: currentMonthRevenue } = await supabase
      .from('sales_orders')
      .select('total_amount')
      .gte('created_at', startOfCurrentMonth);
    
    const { data: lastMonthRevenue } = await supabase
      .from('sales_orders')
      .select('total_amount')
      .gte('created_at', startOfLastMonth)
      .lt('created_at', startOfCurrentMonth);

    // Cast to any to avoid "never" type inference issues if they occur
    const currentRevenue = (currentMonthRevenue as any[])?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const lastRevenue = (lastMonthRevenue as any[])?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const revenueChange = lastRevenue === 0 ? 100 : ((currentRevenue - lastRevenue) / lastRevenue) * 100;

    // Customers
    const { count: currentCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfCurrentMonth);

    const { count: lastMonthCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfLastMonth)
      .lt('created_at', startOfCurrentMonth);
    
    const customerChange = lastMonthCustomers === 0 ? 100 : (((currentCustomers || 0) - (lastMonthCustomers || 0)) / (lastMonthCustomers || 1)) * 100;

    // Active Orders
    const { count: activeOrders } = await supabase
      .from('sales_orders')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'completed')
      .neq('status', 'cancelled');

    // Conversion Rate (Won Leads / Total Leads)
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfCurrentMonth);

    const { count: wonLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'won')
      .gte('created_at', startOfCurrentMonth);

    const conversionRate = totalLeads === 0 ? 0 : ((wonLeads || 0) / (totalLeads || 1)) * 100;


    // 2. Fetch Recent Activities (Combine Leads, Orders)
    const { data: recentLeads } = await supabase
      .from('leads')
      .select('id, name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: recentOrders } = await supabase
      .from('sales_orders')
      .select('id, sales_no, status, total_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    // Create a temporary array with raw date for sorting
    const tempActivities: (RecentActivity & { rawDate: string })[] = [];

    (recentLeads as any[])?.forEach(lead => {
      tempActivities.push({
        id: `lead-${lead.id}`,
        type: 'lead',
        title: `新线索: ${lead.name}`,
        description: `状态: ${lead.status}`,
        time: formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: zhCN }),
        status: 'info',
        rawDate: lead.created_at
      });
    });

    (recentOrders as any[])?.forEach(order => {
      tempActivities.push({
        id: `order-${order.id}`,
        type: 'order',
        title: `新订单: ${order.sales_no}`,
        description: `金额: ¥${order.total_amount}`,
        time: formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: zhCN }),
        status: 'success',
        rawDate: order.created_at
      });
    });

    // Sort by raw date descending
    const sortedActivities = tempActivities
      .sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime())
      .map(({ rawDate, ...rest }) => rest); // Remove rawDate
      
    // 3. Fetch Pending Tasks
    const { data: pendingLeads } = await supabase
      .from('leads')
      .select('id, name, status, created_at')
      .in('status', ['new', 'contacted', 'following'])
      .order('created_at', { ascending: true })
      .limit(5);

    const tasks: PendingTask[] = (pendingLeads as any[] || []).map(lead => ({
      id: `task-lead-${lead.id}`,
      title: `跟进线索: ${lead.name}`,
      priority: 'high',
      dueDate: formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: zhCN }), // Using created_at as proxy for due
      assignee: '当前用户', // Should be dynamic
      status: 'pending',
      link: `/leads/${lead.id}`
    }));


    const stats: DashboardStats[] = [
      {
        title: '本月总营收',
        value: `¥${currentRevenue.toLocaleString()}`,
        change: parseFloat(revenueChange.toFixed(1)),
        changeText: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`,
        icon: 'dollar-sign',
        color: revenueChange >= 0 ? 'success' : 'warning'
      },
      {
        title: '新增客户数',
        value: (currentCustomers || 0).toString(),
        change: parseFloat(customerChange.toFixed(1)),
        changeText: `${customerChange >= 0 ? '+' : ''}${customerChange.toFixed(1)}%`,
        icon: 'users',
        color: customerChange >= 0 ? 'info' : 'warning'
      },
      {
        title: '活跃订单',
        value: (activeOrders || 0).toString(),
        change: 0, // Need historical data for change
        changeText: '-',
        icon: 'shopping-cart',
        color: 'warning'
      },
      {
        title: '转化率',
        value: `${conversionRate.toFixed(1)}%`,
        change: 0,
        changeText: '-',
        icon: 'trending-up',
        color: 'success'
      }
    ];

    return {
      stats,
      recentActivities: sortedActivities.slice(0, 10),
      pendingTasks: tasks
    };
  }
};
