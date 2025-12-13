'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  FileText,
  Search,
  Filter,
  Clock,
  ChevronRight,
  Download,
  X,
  Check,
  ArrowRight
} from 'lucide-react';
import React, { useState } from 'react';

import { cn } from '@/lib/utils';

// --- Types (保持不变) ---
interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sender: string;
  recipient: string;
  createdAt: string;
  readAt?: string;
  status: 'unread' | 'read' | 'archived';
  relatedEntity?: {
    type: 'order' | 'invoice' | 'customer' | 'project';
    id: string;
    name: string;
  };
}

interface ApprovalRequest {
  id: string;
  title: string;
  description: string;
  type: 'order' | 'expense' | 'discount' | 'contract' | 'leave' | 'procurement';
  requester: string;
  requesterDepartment: string;
  amount?: number;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  currentStep: number;
  totalSteps: number;
  approvers: {
    step: number;
    name: string;
    department: string;
    status: 'pending' | 'approved' | 'rejected';
    comment?: string;
    actionAt?: string;
  }[];
  attachments?: {
    name: string;
    url: string;
    size: string;
  }[];
}

// --- Visual Helpers ---

const PRIORITY_STYLES = {
  urgent: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  high: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  medium: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  low: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
};

const STATUS_STYLES = {
  unread: "bg-blue-500",
  read: "bg-theme-text-secondary",
  archived: "bg-theme-border",
  pending: "text-amber-500",
  approved: "text-emerald-500",
  rejected: "text-rose-500",
  withdrawn: "text-theme-text-secondary",
};

const getIcon = (type: string) => {
  switch (type) {
    case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    case 'error': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
    case 'system': return <Bell className="w-5 h-5 text-blue-500" />;
    default: return <Info className="w-5 h-5 text-theme-text-secondary" />;
  }
};

// --- Sub-Components ---

// 1. Notification Item
const NotificationItem = ({ notification }: { notification: Notification }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className={cn(
      "group relative p-4 rounded-lg border border-transparent transition-all duration-200",
      "hover:bg-theme-bg-tertiary hover:border-theme-border",
      notification.status === 'unread' ? "bg-theme-bg-secondary/50" : "bg-transparent"
    )}
  >
    <div className="flex gap-4">
      <div className="mt-1">{getIcon(notification.type)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className={cn(
            "text-sm font-medium truncate pr-4",
            notification.status === 'unread' ? "text-theme-text-primary" : "text-theme-text-secondary"
          )}>
            {notification.title}
          </h4>
          <span className="text-xs text-theme-text-secondary whitespace-nowrap">{notification.createdAt}</span>
        </div>
        <p className="text-sm text-theme-text-secondary line-clamp-2 mb-2">{notification.content}</p>
        
        <div className="flex items-center gap-3 text-xs text-theme-text-secondary">
          <span className={cn("px-2 py-0.5 rounded-full border text-[10px] font-medium uppercase", PRIORITY_STYLES[notification.priority as keyof typeof PRIORITY_STYLES])}>
            {notification.priority === 'low' ? '低' : notification.priority === 'medium' ? '中' : notification.priority === 'high' ? '高' : '紧急'}
          </span>
          <span>发送者: {notification.sender}</span>
        </div>
      </div>
      
      {/* Unread Indicator Dot */}
      {notification.status === 'unread' && (
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
      )}
    </div>
  </motion.div>
);

// 2. Approval Item (Expanded Visuals)
const ApprovalItem = ({ approval }: { approval: ApprovalRequest }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-5 rounded-xl border border-theme-border bg-theme-bg-secondary hover:bg-theme-bg-tertiary/50 transition-colors group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-theme-bg-tertiary text-theme-text-primary">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-theme-text-primary">{approval.title}</h4>
          <p className="text-xs text-theme-text-secondary mt-0.5">
            {approval.requester} • {approval.requesterDepartment}
          </p>
        </div>
      </div>
      <div className={cn("px-2.5 py-1 rounded text-xs font-medium border",
        approval.status === 'pending' ? "text-amber-500 bg-amber-500/10 border-amber-500/20" :
        approval.status === 'approved' ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" :
        approval.status === 'rejected' ? "text-rose-500 bg-rose-500/10 border-rose-500/20" :
        "text-theme-text-secondary bg-theme-bg-tertiary border-theme-border"
      )}>
        {approval.status === 'pending' ? '审批中' : approval.status === 'approved' ? '已通过' : approval.status === 'rejected' ? '已拒绝' : '已撤回'}
      </div>
    </div>

    {/* Amount & Description */}
    <div className="mb-4 pl-[52px]">
      {approval.amount && (
        <div className="text-2xl font-bold text-theme-text-primary mb-2 tracking-tight">
          ¥{approval.amount.toLocaleString()}
        </div>
      )}
      <p className="text-sm text-theme-text-secondary line-clamp-2">{approval.description}</p>
    </div>

    {/* Minimalist Timeline */}
    <div className="pl-[52px] relative mb-4">
      <div className="absolute left-[-28px] top-2 bottom-2 w-px bg-theme-border" />
      <div className="space-y-4">
        {approval.approvers.map((approver, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="absolute left-[-28px] w-6 h-6 -translate-x-1/2 rounded-full flex items-center justify-center text-[10px] font-bold border z-10" style={{ top: idx * 40 + 8 }}>
              <div className={cn(
                "w-full h-full rounded-full flex items-center justify-center",
                approver.status === 'approved' ? "bg-emerald-500 border-emerald-500 text-black" :
                approver.status === 'rejected' ? "bg-rose-500 border-rose-500 text-black" :
                approver.status === 'pending' && approver.step === approval.currentStep ? "bg-amber-500 border-amber-500 text-black animate-pulse" :
                "bg-theme-bg-tertiary border-theme-border text-theme-text-secondary"
              )}>
                {approver.status === 'approved' ? <Check className="w-3 h-3" /> : approver.step}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={cn("text-xs font-medium", approver.status === 'pending' && approver.step === approval.currentStep ? "text-theme-text-primary" : "text-theme-text-secondary")}>
                  {approver.name}
                </span>
                <span className="text-xs text-theme-text-secondary">({approver.department})</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs">
                <span className={cn(
                  "text-xs font-medium",
                  approver.status === 'approved' ? "text-emerald-500" :
                  approver.status === 'rejected' ? "text-rose-500" :
                  approver.status === 'pending' ? "text-amber-500" :
                  "text-theme-text-secondary"
                )}>
                  {approver.status === 'approved' ? '已批准' : approver.status === 'rejected' ? '已拒绝' : approver.status === 'pending' ? '待处理' : '未开始'}
                </span>
                {approver.actionAt && (
                  <span className="text-xs text-theme-text-secondary">{approver.actionAt}</span>
                )}
              </div>
              {approver.comment && (
                <div className="mt-1 text-xs text-theme-text-secondary pl-2 border-l border-theme-border">
                  {approver.comment}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Attachments */}
    {approval.attachments && approval.attachments.length > 0 && (
      <div className="mb-4 pl-[52px]">
        <div className="text-xs text-theme-text-secondary mb-2">附件</div>
        <div className="flex flex-wrap gap-2">
          {approval.attachments.map((attachment, idx) => (
            <button key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-bg-tertiary hover:bg-theme-bg-tertiary/80 border border-theme-border rounded-lg text-xs text-theme-text-secondary transition-colors">
              <Download className="w-3 h-3" />
              <span>{attachment.name}</span>
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Actions */}
    {approval.status === 'pending' && (
      <div className="mt-4 pl-[52px] flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors">
          <Check className="w-3 h-3 mr-1.5" /> 批准
        </button>
        <button className="flex items-center px-4 py-2 bg-theme-bg-tertiary hover:bg-rose-900/20 text-theme-text-secondary hover:text-rose-400 text-xs font-medium rounded-lg transition-colors border border-theme-border">
          <X className="w-3 h-3 mr-1.5" /> 驳回
        </button>
      </div>
    )}
  </motion.div>
);

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'notifications' | 'approvals' | 'sent'>('notifications');
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread' | 'read' | 'archived'>('all');
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const notifications: Notification[] = [
    {
      id: 'NOT001',
      title: '新订单提醒',
      content: '客户"现代家居有限公司"提交了新的装修项目订单，订单编号：ORD20240115001，项目金额：¥85,000',
      type: 'info',
      priority: 'medium',
      sender: '系统',
      recipient: '销售部',
      createdAt: '2024-01-15 14:30:25',
      status: 'unread',
      relatedEntity: {
        type: 'order',
        id: 'ORD20240115001',
        name: '现代家居装修项目'
      }
    },
    {
      id: 'NOT002',
      title: '库存预警',
      content: '商品"欧式瓷砖-米白色"库存已降至安全库存以下，当前库存：15件，建议及时补货',
      type: 'warning',
      priority: 'high',
      sender: '库存管理系统',
      recipient: '采购部',
      createdAt: '2024-01-15 13:45:12',
      status: 'unread',
      relatedEntity: {
        type: 'project',
        id: 'PROD001',
        name: '欧式瓷砖-米白色'
      }
    },
    {
      id: 'NOT003',
      title: '付款确认',
      content: '客户"张总"已完成项目B阶段付款，金额：¥120,000，付款方式：银行转账',
      type: 'success',
      priority: 'medium',
      sender: '财务系统',
      recipient: '项目经理',
      createdAt: '2024-01-15 11:20:45',
      readAt: '2024-01-15 11:25:30',
      status: 'read'
    },
    {
      id: 'NOT004',
      title: '系统维护通知',
      content: '系统将于今晚22:00-24:00进行例行维护，期间可能影响部分功能使用，请提前做好准备',
      type: 'system',
      priority: 'low',
      sender: '系统管理员',
      recipient: '全体用户',
      createdAt: '2024-01-15 09:00:00',
      readAt: '2024-01-15 09:30:15',
      status: 'read'
    },
    {
      id: 'NOT005',
      title: '供应商评价提醒',
      content: '请对供应商"金牌建材"的服务进行评价，您的反馈将帮助我们提升服务质量',
      type: 'info',
      priority: 'low',
      sender: '供应商管理系统',
      recipient: '采购部',
      createdAt: '2024-01-14 16:45:20',
      status: 'archived'
    }
  ];

  const approvalRequests: ApprovalRequest[] = [
    {
      id: 'APP001',
      title: '项目A阶段费用报销',
      description: '项目A阶段施工费用报销申请，包含材料费、人工费等，总计金额：¥45,000',
      type: 'expense',
      requester: '李工程师',
      requesterDepartment: '工程部',
      amount: 45000,
      submittedAt: '2024-01-15 15:20:10',
      status: 'pending',
      priority: 'medium',
      currentStep: 2,
      totalSteps: 3,
      approvers: [
        {
          step: 1,
          name: '王项目经理',
          department: '项目部',
          status: 'approved',
          comment: '费用合理，同意报销',
          actionAt: '2024-01-15 16:30:25'
        },
        {
          step: 2,
          name: '财务经理',
          department: '财务部',
          status: 'pending'
        },
        {
          step: 3,
          name: '总经理',
          department: '管理层',
          status: 'pending'
        }
      ],
      attachments: [
        { name: '费用明细表.pdf', url: '#', size: '2.3MB' },
        { name: '发票扫描件.zip', url: '#', size: '15.6MB' }
      ]
    },
    {
      id: 'APP002',
      title: '大额订单折扣申请',
      description: '客户"创新科技"订单金额超过¥100,000，申请10%折扣优惠',
      type: 'discount',
      requester: '张销售',
      requesterDepartment: '销售部',
      amount: 12000,
      submittedAt: '2024-01-15 14:15:30',
      status: 'pending',
      priority: 'high',
      currentStep: 1,
      totalSteps: 2,
      approvers: [
        {
          step: 1,
          name: '销售总监',
          department: '销售部',
          status: 'pending'
        },
        {
          step: 2,
          name: '总经理',
          department: '管理层',
          status: 'pending'
        }
      ]
    },
    {
      id: 'APP003',
      title: '采购合同审批',
      description: '与"金牌建材"签订年度采购合同，合同金额：¥500,000',
      type: 'contract',
      requester: '采购专员',
      requesterDepartment: '采购部',
      amount: 500000,
      submittedAt: '2024-01-14 10:30:45',
      status: 'approved',
      priority: 'urgent',
      currentStep: 3,
      totalSteps: 3,
      approvers: [
        {
          step: 1,
          name: '采购经理',
          department: '采购部',
          status: 'approved',
          comment: '合同条款合理',
          actionAt: '2024-01-14 11:45:20'
        },
        {
          step: 2,
          name: '法务专员',
          department: '法务部',
          status: 'approved',
          comment: '法律条款无问题',
          actionAt: '2024-01-14 14:20:15'
        },
        {
          step: 3,
          name: '总经理',
          department: '管理层',
          status: 'approved',
          comment: '同意签署',
          actionAt: '2024-01-15 09:15:30'
        }
      ],
      attachments: [
        { name: '采购合同.pdf', url: '#', size: '3.2MB' },
        { name: '供应商资质证明.pdf', url: '#', size: '1.8MB' }
      ]
    }
  ];

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = notificationFilter === 'all' || notification.status === notificationFilter;
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           notification.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredApprovals = approvalRequests.filter(approval => {
    const matchesFilter = approvalFilter === 'all' || approval.status === approvalFilter;
    const matchesSearch = approval.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           approval.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleApprove = (approvalId: string) => {
    void approvalId;
  };

  const handleReject = (approvalId: string) => {
    void approvalId;
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const pendingApprovalCount = approvalRequests.filter(a => a.status === 'pending').length;

  return (
      <div className="max-w-5xl mx-auto p-6 space-y-8 min-h-screen bg-theme-bg-primary text-theme-text-primary font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">通知中心</h1>
            <p className="text-theme-text-secondary mt-1">管理消息提醒与业务审批流</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg bg-theme-bg-secondary border border-theme-border text-theme-text-secondary hover:text-theme-text-primary transition-colors">
              <Filter className="w-4 h-4" />
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-secondary" />
              <input
                type="text"
                placeholder="搜索通知或审批..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-theme-bg-secondary border border-theme-border rounded-lg text-sm text-theme-text-primary focus:outline-none focus:ring-1 focus:ring-theme-text-secondary w-64"
              />
            </div>
          </div>
        </div>

        {/* Custom Tabs */}
        <div className="flex space-x-1 bg-theme-bg-secondary p-1 rounded-lg border border-theme-border w-fit">
          {(['notifications', 'approvals', 'sent'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "relative px-6 py-2 text-sm font-medium rounded-md transition-colors z-10",
                activeTab === tab ? "text-white" : "text-theme-text-secondary hover:text-theme-text-primary"
              )}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-theme-bg-tertiary border border-theme-border/50 rounded-md shadow-sm -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {tab === 'notifications' ? '消息通知' : tab === 'approvals' ? '待办审批' : '已发送'}
              {tab === 'notifications' && unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-black">
                  {unreadCount}
                </span>
              )}
              {tab === 'approvals' && pendingApprovalCount > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black">
                  {pendingApprovalCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {activeTab === 'notifications' ? (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                {/* Filter Buttons */}
                <div className="flex gap-2">
                  {(['all', 'unread', 'read', 'archived'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setNotificationFilter(filter)}
                      className={cn(
                        "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                        notificationFilter === filter ? "bg-theme-bg-tertiary text-theme-text-primary" : "bg-theme-bg-secondary text-theme-text-secondary hover:text-theme-text-primary"
                      )}
                    >
                      {filter === 'all' ? '全部' : filter === 'unread' ? '未读' : filter === 'read' ? '已读' : '已归档'}
                    </button>
                  ))}
                </div>
                
                {/* List Container */}
                <div className="rounded-xl border border-theme-border bg-theme-bg-secondary/30 overflow-hidden divide-y divide-theme-border">
                  {filteredNotifications.map(n => <NotificationItem key={n.id} notification={n} />)}
                </div>
              </motion.div>
            ) : activeTab === 'approvals' ? (
              <motion.div
                key="approvals"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Filter Buttons */}
                <div className="flex gap-2">
                  {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setApprovalFilter(filter)}
                      className={cn(
                        "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                        approvalFilter === filter ? "bg-theme-bg-tertiary text-theme-text-primary" : "bg-theme-bg-secondary text-theme-text-secondary hover:text-theme-text-primary"
                      )}
                    >
                      {filter === 'all' ? '全部' : filter === 'pending' ? '审批中' : filter === 'approved' ? '已通过' : '已拒绝'}
                    </button>
                  ))}
                </div>
                
                {/* Approvals Grid */}
                <div className="grid gap-4">
                  {filteredApprovals.map(a => <ApprovalItem key={a.id} approval={a} />)}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="sent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-theme-border bg-theme-bg-secondary p-12 text-center"
              >
                <div className="text-4xl mb-4 text-theme-text-secondary">📤</div>
                <h3 className="text-lg font-medium text-theme-text-primary mb-2">暂无已发送的通知</h3>
                <p className="text-theme-text-secondary">您发送的通知将在这里显示</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
  );
}
