'use client';

import {
  TrendingUp,
  Users,
  DollarSign,
  ShoppingCart,
  FileText,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Layout,
  Clock
} from 'lucide-react';
import React, { useEffect } from 'react';

import DashboardLayout from '@/components/layout/dashboard-layout';
// Replace PaperCard with Linear Style Components
import SpotlightCard from '@/components/ui/spotlight-card';
import { MovingBorderCard } from '@/components/ui/moving-border-card';
import { TRACK_PAGE_VIEW } from '@/utils/analytics';

// Types remain the same
interface DashboardStats {
  title: string;
  value: string;
  change: number;
  changeText: string;
  icon: React.ReactNode;
  color: 'success' | 'warning' | 'error' | 'info';
}

interface RecentActivity {
  id: string;
  type: 'order' | 'customer' | 'payment' | 'alert';
  title: string;
  description: string;
  time: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

interface PendingTask {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  assignee: string;
  status: 'pending' | 'in-progress' | 'completed';
}

// --- Linear Style Components ---

// 1. Stats Card (Spotlight Effect)
const LinearStatsCard = React.memo(({ stat }: { stat: DashboardStats }) => {
  return (
    <SpotlightCard className="bg-theme-bg-secondary border-theme-border">
      <SpotlightCard.Content className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg bg-theme-bg-tertiary text-${stat.color}-500`}>
            {stat.icon}
          </div>
          {stat.change > 0 ? (
            <span className="flex items-center text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              {stat.changeText}
            </span>
          ) : (
            <span className="flex items-center text-xs font-medium text-rose-500 bg-rose-500/10 px-2 py-1 rounded-full">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              {stat.changeText}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-theme-text-secondary">{stat.title}</p>
          <h3 className="text-3xl font-bold text-theme-text-primary mt-1 tracking-tight">{stat.value}</h3>
        </div>
      </SpotlightCard.Content>
    </SpotlightCard>
  );
});
LinearStatsCard.displayName = 'LinearStatsCard';

// 2. Activity Item (Minimalist List)
const LinearActivityItem = React.memo(({ activity }: { activity: RecentActivity }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart className="h-4 w-4" />;
      case 'customer': return <Users className="h-4 w-4" />;
      case 'payment': return <DollarSign className="h-4 w-4" />;
      case 'alert': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="group flex items-start space-x-4 p-4 rounded-lg hover:bg-theme-bg-tertiary transition-colors duration-200 border border-transparent hover:border-theme-border">
      <div className={`mt-1 p-2 rounded-md bg-theme-bg-tertiary text-${activity.status}-500 group-hover:bg-theme-bg-secondary transition-colors`}>
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-theme-text-primary truncate group-hover:text-theme-text-primary transition-colors">
            {activity.title}
          </p>
          <span className="text-xs text-theme-text-secondary font-mono">{activity.time}</span>
        </div>
        <p className="text-sm text-theme-text-secondary mt-1 line-clamp-2 group-hover:text-theme-text-secondary transition-colors">
          {activity.description}
        </p>
      </div>
    </div>
  );
});
LinearActivityItem.displayName = 'LinearActivityItem';

// 3. Task Item (Row with Status)
const LinearTaskItem = React.memo(({ task }: { task: PendingTask }) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-theme-border last:border-0 hover:bg-theme-bg-tertiary transition-colors">
      <div className="flex items-center space-x-4">
        <div className={`h-2 w-2 rounded-full ${
          task.priority === 'high' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 
          task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
        }`} />
        <div>
          <p className="text-sm font-medium text-theme-text-primary">{task.title}</p>
          <div className="flex items-center mt-1 space-x-3 text-xs text-theme-text-secondary">
            <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {task.dueDate}</span>
            <span>•</span>
            <span>{task.assignee}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center">
         <span className={`px-2.5 py-0.5 rounded text-xs font-medium border ${
            task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
            task.status === 'in-progress' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
            'bg-theme-bg-tertiary text-theme-text-secondary border-theme-border'
         }`}>
            {task.status === 'completed' ? '已完成' :
             task.status === 'in-progress' ? '进行中' : '待处理'}
         </span>
      </div>
    </div>
  );
});
LinearTaskItem.displayName = 'LinearTaskItem';


export default function DashboardPage() {
  useEffect(() => {
    TRACK_PAGE_VIEW('dashboard', { component: 'DashboardPage' });
  }, []);

  // Mock Data (Same as before)
  const stats: DashboardStats[] = [
    {
      title: '本月总营收',
      value: '¥2,456,789',
      change: 12.5,
      changeText: '+12.5%',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'success'
    },
    {
      title: '新增客户数',
      value: '1,256',
      change: 8.2,
      changeText: '+8.2%',
      icon: <Users className="h-5 w-5" />,
      color: 'info'
    },
    {
      title: '活跃订单',
      value: '89',
      change: -3.1,
      changeText: '-3.1%',
      icon: <ShoppingCart className="h-5 w-5" />,
      color: 'warning'
    },
    {
      title: '转化率',
      value: '23.4%',
      change: 5.7,
      changeText: '+5.7%',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'success'
    }
  ];

  const recentActivities: RecentActivity[] = Array.from({ length: 6 }).map((_, i) => ({
    id: `activity-${i}`,
    type: ['order', 'customer', 'payment', 'alert'][i % 4] as any,
    title: `系统活动通知 #${i + 1}`,
    description: `自动系统检查已完成。在${['支付网关', '用户数据库', '库存系统'][i % 3]}模块中未检测到异常。`,
    time: `${i * 2 + 5}分钟前`,
    status: ['success', 'info', 'warning', 'error'][i % 4] as any
  }));

  const pendingTasks: PendingTask[] = Array.from({ length: 5 }).map((_, i) => ({
    id: `task-${i}`,
    title: `第三季度财务报表审核 #${i + 1}`,
    priority: ['high', 'medium', 'low'][i % 3] as any,
    dueDate: '10月24日',
    assignee: `张三`,
    status: ['pending', 'in-progress', 'completed'][i % 3] as any
  }));

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary p-8 font-sans selection:bg-blue-500/30">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-theme-text-primary tracking-tight">总览仪表盘</h1>
              <p className="text-theme-text-secondary mt-1">实时业务洞察与核心指标监控。</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 bg-theme-bg-secondary hover:bg-theme-bg-tertiary text-theme-text-secondary hover:text-theme-text-primary text-sm font-medium rounded-lg border border-theme-border transition-all duration-200 flex items-center">
                <Layout className="h-4 w-4 mr-2" />
                自定义视图
              </button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all duration-200 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                新建推广活动
              </button>
            </div>
          </div>

          {/* Bento Grid - Stats Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {/* Moving Border Card for Primary Stat */}
             <div className="md:col-span-2 lg:col-span-1">
               <MovingBorderCard className="h-full">
                 <div className="p-6 flex flex-col justify-between h-full relative z-10">
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-medium text-emerald-500 uppercase tracking-wider">实时状态</span>
                      </div>
                      <h3 className="text-lg font-semibold text-theme-text-primary">系统运行正常</h3>
                      <p className="text-sm text-theme-text-secondary mt-1">所有服务均在正常运行中。</p>
                    </div>
                    <div className="mt-4">
                      <div className="w-full bg-theme-bg-tertiary rounded-full h-1.5 mb-1">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '98%' }}></div>
                      </div>
                      <div className="flex justify-between text-xs text-theme-text-secondary">
                        <span>在线率</span>
                        <span>99.9%</span>
                      </div>
                    </div>
                 </div>
               </MovingBorderCard>
             </div>

             {/* Standard Stats */}
             {stats.slice(0, 3).map((stat, index) => (
               <LinearStatsCard key={index} stat={stat} />
             ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Activity Feed - Large Spotlight Card */}
            <div className="lg:col-span-2">
              <SpotlightCard className="h-full bg-theme-bg-secondary border-theme-border">
                <SpotlightCard.Header className="border-b border-theme-border pb-4">
                  <div className="flex items-center justify-between">
                    <SpotlightCard.Title>最近活动</SpotlightCard.Title>
                    <button className="text-xs text-blue-500 hover:text-blue-400 transition-colors">查看全部</button>
                  </div>
                </SpotlightCard.Header>
                <SpotlightCard.Content className="p-2">
                  <div className="space-y-1">
                    {recentActivities.map((activity) => (
                      <LinearActivityItem key={activity.id} activity={activity} />
                    ))}
                  </div>
                </SpotlightCard.Content>
              </SpotlightCard>
            </div>

            {/* Pending Tasks - Compact List */}
            <div>
              <SpotlightCard className="h-full bg-theme-bg-secondary border-theme-border">
                <SpotlightCard.Header className="border-b border-theme-border pb-4">
                  <div className="flex items-center justify-between">
                    <SpotlightCard.Title>待办任务</SpotlightCard.Title>
                    <span className="bg-theme-bg-tertiary text-theme-text-secondary text-xs px-2 py-0.5 rounded-full">5</span>
                  </div>
                </SpotlightCard.Header>
                <SpotlightCard.Content className="p-0">
                  <div className="divide-y divide-theme-border">
                    {pendingTasks.map((task) => (
                      <LinearTaskItem key={task.id} task={task} />
                    ))}
                  </div>
                  <div className="p-4">
                    <button className="w-full py-2 text-sm text-theme-text-secondary hover:text-theme-text-primary border border-dashed border-theme-border hover:border-theme-border-light rounded-lg transition-all duration-200">
                      + 新建任务
                    </button>
                  </div>
                </SpotlightCard.Content>
              </SpotlightCard>
            </div>

          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
