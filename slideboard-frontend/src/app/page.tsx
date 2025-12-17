'use client';

import {
  Plus,
  Search,
  Clock,
  Users,
  TrendingUp,
  DollarSign,
  Package,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { useAuth } from '@/contexts/auth-context';
import { TodoCategory, TodoItem } from '@/shared/types/todo';
import { UserRole } from '@/shared/types/user';
import { TRACK_PAGE_VIEW } from '@/utils/analytics';

// 内联的 TodoCategories 组件（原组件已删除）
const TodoCategories = ({ categories, onTodoAction }: { categories: TodoCategory[], onTodoAction: () => void }) => (
  <div className="space-y-4">
    {categories.length === 0 ? (
      <p className="text-center text-ink-500 py-8">暂无待办事项</p>
    ) : (
      categories.map((category) => (
        <div key={category.id} className="border border-paper-400 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-ink-800">{category.name}</h3>
            <span className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full">{category.count}</span>
          </div>
          <ul className="space-y-2">
            {category.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between p-2 bg-paper-200 rounded hover:bg-paper-300 transition-colors cursor-pointer" onClick={onTodoAction}>
                <span className="text-sm text-ink-700">{item.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${item.priority === 'high' ? 'bg-error-100 text-error-700' : item.priority === 'medium' ? 'bg-warning-100 text-warning-700' : 'bg-info-100 text-info-700'}`}>
                  {item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))
    )}
  </div>
);

/**
 * 快速统计数据接口定义
 * 用于定义仪表盘顶部的 KPI 卡片数据结构
 */
interface QuickStat {
  title: string;          // 统计标题
  value: string;          // 统计数值
  change: string;         // 变化幅度
  trend: 'up' | 'down';   // 趋势方向 (上升/下降)
  icon: React.ReactNode;  // 图标组件
}

// 导入用户角色类型

/**
 * 主页组件 (HomePage)
 * 
 * 这是系统的核心仪表盘页面，主要负责展示：
 * 1. 用户欢迎信息和角色切换（演示用）
 * 2. 核心业务指标 (KPI) 的快速统计
 * 3. 最近的系统活动动态
 * 4. 常用功能的快速导航入口
 * 5. 基于当前用户角色的待办事项列表
 */
// 导入 router

export default function HomePage() {
  // 从认证上下文获取加载状态和用户
  const { user, loading } = useAuth();
  const router = useRouter();

  // 状态：当前选中的角色
  // 注意：这是一个用于演示的功能，允许用户在不重新登录的情况下切换不同角色的视图
  // 默认角色为 'SALES_STORE' (驻店销售)
  const [currentRole, setCurrentRole] = useState<UserRole>('SALES_STORE');

  // Effect: 当角色发生变化时，记录页面浏览数据到分析系统
  // 这有助于分析用户对不同角色视图的使用情况
  useEffect(() => {
    TRACK_PAGE_VIEW('Dashboard', { role: currentRole });
  }, [currentRole]);

  // 登录检查，如果未登录则跳转到登录页
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // 如果认证信息正在加载，显示加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">加载中...</h2>
          <p className="text-gray-600">正在获取您的数据</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // 模拟数据区域 (Mock Data)
  // 注意：在实际生产环境中，这些数据应该通过 API 从后端获取
  // ==========================================

  // 模拟通用角色（如销售、店长等）的待办事项数据
  const mockTodoCategories: TodoCategory[] = [
    {
      id: 'tracking-leads',
      name: '跟踪中线索',
      count: 3,
      items: [
        {
          id: 'todo-1',
          type: 'lead',
          businessId: 'lead-001',
          businessType: 'lead',
          title: '跟踪客户：张三',
          status: '跟踪中',
          priority: 'high',
          createdAt: new Date('2024-01-10T10:00:00'),
          dueDate: new Date('2024-01-15T18:00:00'),
          assigneeId: 'user-001',
          assigneeName: '驻店销售',
          relatedData: {
            leadNumber: 'LEAD-20240110-001',
            customerName: '张三',
            contactPhone: '13800138001'
          }
        },
        {
          id: 'todo-2',
          type: 'lead',
          businessId: 'lead-002',
          businessType: 'lead',
          title: '跟踪客户：李四',
          status: '跟踪中',
          priority: 'medium',
          createdAt: new Date('2024-01-09T14:30:00'),
          dueDate: new Date('2024-01-16T18:00:00'),
          assigneeId: 'user-001',
          assigneeName: '驻店销售',
          relatedData: {
            leadNumber: 'LEAD-20240109-002',
            customerName: '李四',
            contactPhone: '13900139001'
          }
        },
        {
          id: 'todo-3',
          type: 'lead',
          businessId: 'lead-003',
          businessType: 'lead',
          title: '跟踪客户：王五',
          status: '跟踪中',
          priority: 'low',
          createdAt: new Date('2024-01-08T09:15:00'),
          dueDate: new Date('2024-01-17T18:00:00'),
          assigneeId: 'user-001',
          assigneeName: '驻店销售',
          relatedData: {
            leadNumber: 'LEAD-20240108-003',
            customerName: '王五',
            contactPhone: '13700137001'
          }
        }
      ]
    },
    {
      id: 'pending-sign',
      name: '待草签线索',
      count: 2,
      items: [
        {
          id: 'todo-4',
          type: 'lead',
          businessId: 'lead-004',
          businessType: 'lead',
          title: '待草签客户：赵六',
          status: '草签',
          priority: 'high',
          createdAt: new Date('2024-01-11T11:20:00'),
          dueDate: new Date('2024-01-14T18:00:00'),
          assigneeId: 'user-001',
          assigneeName: '驻店销售',
          relatedData: {
            leadNumber: 'LEAD-20240111-004',
            customerName: '赵六',
            contactPhone: '13600136001'
          }
        },
        {
          id: 'todo-5',
          type: 'lead',
          businessId: 'lead-005',
          businessType: 'lead',
          title: '待草签客户：孙七',
          status: '草签',
          priority: 'medium',
          createdAt: new Date('2024-01-10T16:45:00'),
          dueDate: new Date('2024-01-15T18:00:00'),
          assigneeId: 'user-001',
          assigneeName: '驻店销售',
          relatedData: {
            leadNumber: 'LEAD-20240110-005',
            customerName: '孙七',
            contactPhone: '13500135001'
          }
        }
      ]
    },
    {
      id: 'pending-measurement-confirm',
      name: '待确认测量单',
      count: 1,
      items: [
        {
          id: 'todo-6',
          type: 'order',
          businessId: 'order-001',
          businessType: 'order',
          title: '待确认测量单：订单 #ORD-20240101',
          status: '测量中-待确认',
          priority: 'high',
          createdAt: new Date('2024-01-11T09:00:00'),
          dueDate: new Date('2024-01-12T18:00:00'),
          assigneeId: 'user-001',
          assigneeName: '驻店销售',
          relatedData: {
            orderNumber: 'ORD-20240101',
            customerName: '周八',
            productName: '窗帘'
          }
        }
      ]
    },
    {
      id: 'pending-installation-confirm',
      name: '待确认安装',
      count: 2,
      items: [
        {
          id: 'todo-7',
          type: 'order',
          businessId: 'order-002',
          businessType: 'order',
          title: '待确认安装：订单 #ORD-20231225',
          status: '安装中-待确认',
          priority: 'high',
          createdAt: new Date('2024-01-11T14:00:00'),
          dueDate: new Date('2024-01-13T18:00:00'),
          assigneeId: 'user-001',
          assigneeName: '驻店销售',
          relatedData: {
            orderNumber: 'ORD-20231225',
            customerName: '吴九',
            productName: '墙布'
          }
        },
        {
          id: 'todo-8',
          type: 'order',
          businessId: 'order-003',
          businessType: 'order',
          title: '待确认安装：订单 #ORD-20231230',
          status: '安装中-待确认',
          priority: 'medium',
          createdAt: new Date('2024-01-11T15:30:00'),
          dueDate: new Date('2024-01-14T18:00:00'),
          assigneeId: 'user-001',
          assigneeName: '驻店销售',
          relatedData: {
            orderNumber: 'ORD-20231230',
            customerName: '郑十',
            productName: '窗帘'
          }
        }
      ]
    }
  ];

  // 模拟派单员角色的待办事项数据
  const mockDispatcherTodoCategories: TodoCategory[] = [
    {
      id: 'pending-measurement-assignment',
      name: '测量中-待分配',
      count: 1,
      items: [
        {
          id: 'dispatcher-todo-1',
          type: 'order',
          businessId: 'order-004',
          businessType: 'order',
          title: '待分配测量任务：订单 #ORD-20240110',
          status: '测量中-待分配',
          priority: 'high',
          createdAt: new Date('2024-01-11T10:00:00'),
          dueDate: new Date('2024-01-12T10:00:00'),
          assigneeId: 'dispatcher-001',
          assigneeName: '派单员',
          relatedData: {
            orderNumber: 'ORD-20240110',
            customerName: '张三',
            productName: '窗帘'
          }
        }
      ]
    },
    {
      id: 'installing-pending-assignment',
      name: '安装中-待分配',
      count: 1,
      items: [
        {
          id: 'dispatcher-todo-2',
          type: 'order',
          businessId: 'order-005',
          businessType: 'order',
          title: '待分配安装任务：订单 #ORD-20240105',
          status: '安装中-待分配',
          priority: 'high',
          createdAt: new Date('2024-01-11T09:30:00'),
          dueDate: new Date('2024-01-12T12:00:00'),
          assigneeId: 'dispatcher-001',
          assigneeName: '派单员',
          relatedData: {
            orderNumber: 'ORD-20240105',
            customerName: '李四',
            productName: '墙布'
          }
        }
      ]
    }
  ];

  // 开发阶段暂时移除登录检查，允许直接访问
  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.push('/login');
  //   }
  // }, [user, loading, router]);

  // 如果处于加载状态，显示全屏加载提示
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-200">
        <div className="text-lg text-ink-600">加载中...</div>
      </div>
    );
  }

  // 开发阶段允许未登录用户访问
  if (!user) {
    return null;
  }

  // 模拟快速统计数据 (KPIs)
  // 包含：本月销售额、新增客户、订单数量、转化率
  const quickStats: QuickStat[] = [
    {
      title: '本月销售额',
      value: '¥2,456,789',
      change: '+12.5%',
      trend: 'up',
      icon: <DollarSign className="h-6 w-6" />
    },
    {
      title: '新增客户',
      value: '156',
      change: '+8.2%',
      trend: 'up',
      icon: <Users className="h-6 w-6" />
    },
    {
      title: '订单数量',
      value: '89',
      change: '-3.1%',
      trend: 'down',
      icon: <Package className="h-6 w-6" />
    },
    {
      title: '转化率',
      value: '23.4%',
      change: '+5.7%',
      trend: 'up',
      icon: <BarChart3 className="h-6 w-6" />
    }
  ];

  // 角色映射表：将英文角色代码映射为中文名称，用于界面显示
  const roleMap: Record<UserRole, string> = {
    // 基础角色
    'user': '普通用户',
    'pro': '专业用户',
    'admin': '管理员',
    // 销售类角色
    'SALES_STORE': '驻店销售',
    'SALES_REMOTE': '远程销售',
    'SALES_CHANNEL': '业务',
    // 设计师角色
    'DESIGNER': '设计师',
    'PARTNER_DESIGNER': '合作设计师',
    // 客户角色
    'CUSTOMER': '客户',
    'OTHER_CUSTOMER': '其他客户',
    // 领导类角色
    'LEAD_SALES': '销售负责人',
    'LEAD_CHANNEL': '渠道负责人',
    'LEAD_GENERAL': '领导',
    'LEAD_ADMIN': '系统管理员',
    'LEAD_VIEWER': '领导查看角色',
    // 审批类角色
    'APPROVER_BUSINESS': '业务审批人',
    'APPROVER_FINANCIAL': '财务审批人',
    'APPROVER_MANAGEMENT': '管理审批人',
    // 交付类角色
    'DELIVERY_SERVICE': '订单客服',
    // 服务模块角色
    'SERVICE_DISPATCH': '派单员',
    'SERVICE_MEASURE': '测量师',
    'SERVICE_INSTALL': '安装师',
    // 其他角色
    'OTHER_FINANCE': '财务',
    'PARTNER_GUIDE': '合作导购'
  };

  // 获取当前角色的中文名称
  const currentRoleName = roleMap[currentRole];

  // 角色待办数据映射表
  // 定义了不同角色应该看到哪一套待办事项数据
  const roleTodoData: Record<UserRole, TodoCategory[]> = {
    // 基础角色
    'user': mockTodoCategories,
    'pro': mockTodoCategories,
    'admin': mockTodoCategories,
    // 销售类角色
    'SALES_STORE': mockTodoCategories,
    'SALES_REMOTE': mockTodoCategories,
    'SALES_CHANNEL': mockTodoCategories,
    // 设计类角色
    'DESIGNER': mockTodoCategories,
    // 客户角色
    'CUSTOMER': mockTodoCategories,
    // 领导类角色
    'LEAD_SALES': mockTodoCategories,
    'LEAD_CHANNEL': mockTodoCategories,
    'LEAD_GENERAL': mockTodoCategories,
    'LEAD_ADMIN': mockTodoCategories,
    'LEAD_VIEWER': mockTodoCategories,
    // 审批类角色
    'APPROVER_BUSINESS': mockTodoCategories,
    'APPROVER_FINANCIAL': mockTodoCategories,
    'APPROVER_MANAGEMENT': mockTodoCategories,
    // 交付类角色
    'DELIVERY_SERVICE': mockTodoCategories,
    // 服务模块角色
    'SERVICE_DISPATCH': mockDispatcherTodoCategories, // 派单员使用特定的待办数据
    'SERVICE_MEASURE': mockTodoCategories,
    'SERVICE_INSTALL': mockTodoCategories,
    // 其他角色
    'OTHER_FINANCE': mockTodoCategories,
    'OTHER_CUSTOMER': mockTodoCategories,
    'PARTNER_DESIGNER': mockTodoCategories,
    'PARTNER_GUIDE': mockTodoCategories
  };

  // 根据当前选择的角色动态显示不同的待办事项数据
  // 如果该角色没有定义数据，则显示空数组
  const currentTodoCategories = roleTodoData[currentRole] || [];

  // 处理待办事项操作的回调函数
  const handleTodoAction = () => {
    // 待实现：跳转到详情页或执行特定操作
    // console.log('Todo action triggered');
  };

  return (
    <div className="min-h-screen bg-theme-bg-primary">
      <main id="main" className="p-6 space-y-6" aria-label="主页">
        {/* 
        ==========================================
        角色切换控制台 (仅用于演示/开发)
        */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-theme-text-primary">开始战斗！{currentRoleName}</h1>
            <p className="text-theme-text-secondary mt-1">今天是 {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}</p>
            <p className="text-theme-text-secondary mt-1">当前角色：{currentRoleName} ({currentRole})</p>
          </div>
          <div className="flex space-x-3">
            {/* 角色切换下拉框 - 演示功能 */}
            <div className="flex items-center space-x-2">
              <label htmlFor="roleSelect" className="text-sm text-theme-text-primary">角色切换：</label>
              <select
                id="roleSelect"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as UserRole)}
                className="border border-theme-border rounded-md px-3 py-2 text-sm bg-theme-bg-tertiary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-success-500"
              >
                {/* 销售类角色 */}
                <optgroup label="销售类角色">
                  <option value="SALES_STORE">驻店销售</option>
                  <option value="SALES_REMOTE">远程销售</option>
                  <option value="SALES_CHANNEL">业务</option>
                </optgroup>
                {/* 领导类角色 */}
                <optgroup label="领导类角色">
                  <option value="LEAD_SALES">销售负责人</option>
                  <option value="LEAD_CHANNEL">渠道负责人</option>
                  <option value="LEAD_GENERAL">领导</option>
                  <option value="LEAD_ADMIN">系统管理员</option>
                  <option value="LEAD_VIEWER">领导查看角色</option>
                </optgroup>
                {/* 审批类角色 */}
                <optgroup label="审批类角色">
                  <option value="APPROVER_BUSINESS">业务审批人</option>
                  <option value="APPROVER_FINANCIAL">财务审批人</option>
                  <option value="APPROVER_MANAGEMENT">管理审批人</option>
                </optgroup>
                {/* 交付类角色 */}
                <optgroup label="交付类角色">
                  <option value="DELIVERY_SERVICE">订单客服</option>
                </optgroup>
                {/* 服务模块角色 */}
                <optgroup label="服务模块角色">
                  <option value="SERVICE_DISPATCH">派单员</option>
                  <option value="SERVICE_MEASURE">测量师</option>
                  <option value="SERVICE_INSTALL">安装师</option>
                </optgroup>
                {/* 其他角色 */}
                <optgroup label="其他角色">
                  <option value="OTHER_FINANCE">财务</option>
                  <option value="PARTNER_DESIGNER">设计师</option>
                  <option value="PARTNER_GUIDE">导购</option>
                </optgroup>
              </select>
            </div>
            <PaperButton variant="outline">
              <Search className="h-4 w-4 mr-2" />
              全局搜索
            </PaperButton>
            <Link href="/quotes/create">
              <PaperButton variant="primary">
                <Plus className="h-4 w-4 mr-2" />
                快速创建
              </PaperButton>
            </Link>
          </div>
        </div>

        {/* 
          2. 快速统计区域 (KPI Cards)
          展示关键业务指标，如销售额、新增客户等。
          在移动端单列显示，平板双列，桌面端四列。
        */}
        <section className="@container grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-4 gap-6" aria-label="快速统计">
          {quickStats.map((stat, index) => (
            <PaperCard key={index} hover>
              <PaperCardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-theme-text-secondary">{stat.title}</p>
                    <p className="text-2xl font-bold text-theme-text-primary">{stat.value}</p>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className={`h-4 w-4 ${stat.trend === 'up' ? 'text-success-600' : 'text-error-600 rotate-180'
                        }`} />
                      <span className={`text-sm ${stat.trend === 'up' ? 'text-success-600' : 'text-error-600'
                        }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full ${stat.trend === 'up' ? 'bg-success-100' : 'bg-error-100'
                    }`}>
                    {stat.icon}
                  </div>
                </div>
              </PaperCardContent>
            </PaperCard>
          ))}
        </section>

        {/* 
          3. 快速操作区域 
          包含"最近活动"列表和"快速导航"按钮网格
        */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 最近活动 */}
          <PaperCard>
            <PaperCardHeader>
              <PaperCardTitle>最近活动</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <section aria-label="最近活动">
                <ul role="list" className="space-y-4">
                  <li role="listitem" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-paper-300 transition-colors">
                    <div className="p-2 bg-success-100 rounded-full">
                      <Users aria-hidden="true" className="h-4 w-4 text-success-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink-800">新客户注册</p>
                      <p className="text-xs text-ink-800">张总装修公司 - 2分钟前</p>
                    </div>
                  </li>
                  <li role="listitem" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-paper-300 transition-colors">
                    <div className="p-2 bg-info-100 rounded-full">
                      <Package aria-hidden="true" className="h-4 w-4 text-info-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink-800">新订单确认</p>
                      <p className="text-xs text-ink-800">订单 #ORD-2024-001 - 15分钟前</p>
                    </div>
                  </li>
                  <li role="listitem" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-paper-300 transition-colors">
                    <div className="p-2 bg-warning-100 rounded-full">
                      <BarChart3 aria-hidden="true" className="h-4 w-4 text-warning-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink-800">库存预警</p>
                      <p className="text-xs text-ink-800">瓷砖库存低于安全线 - 1小时前</p>
                    </div>
                  </li>
                </ul>
              </section>
            </PaperCardContent>
          </PaperCard>

          {/* 快速导航 */}
          <PaperCard>
            <PaperCardHeader>
              <PaperCardTitle>快速导航</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <nav aria-label="快速导航" className="grid grid-cols-2 gap-4">
                <PaperButton type="button" variant="outline" className="justify-start">
                  <Users aria-hidden="true" className="h-4 w-4 mr-2" />
                  客户管理
                </PaperButton>
                <PaperButton type="button" variant="outline" className="justify-start">
                  <Package aria-hidden="true" className="h-4 w-4 mr-2" />
                  商品管理
                </PaperButton>
                <PaperButton type="button" variant="outline" className="justify-start">
                  <BarChart3 aria-hidden="true" className="h-4 w-4 mr-2" />
                  销售报表
                </PaperButton>
                <PaperButton type="button" variant="outline" className="justify-start">
                  <Clock aria-hidden="true" className="h-4 w-4 mr-2" />
                  待办事项
                </PaperButton>
              </nav>
            </PaperCardContent>
          </PaperCard>
        </div>

        {/* 
          4. 待办事项分类展示区域 
          根据当前选择的角色 (currentRole) 动态渲染不同的待办任务列表
        */}
        <PaperCard>
          <PaperCardHeader>
            <div className="flex items-center justify-between">
              <PaperCardTitle>待办事项</PaperCardTitle>
              <PaperButton variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                添加任务
              </PaperButton>
            </div>
          </PaperCardHeader>
          <PaperCardContent>
            {/* 待办事项列表组件 */}
            <TodoCategories
              categories={currentTodoCategories}
              onTodoAction={handleTodoAction}
            />
          </PaperCardContent>
        </PaperCard>
      </main>
    </div>
  );
}
