'use client'

import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, CheckCircle, FileText, ChevronRight, Search, Filter, AlertTriangle, ArrowRight } from 'lucide-react'
import React, { useMemo, useState } from 'react'

import { PaperBadge } from '@/components/ui/paper-badge'
import { PaperButton } from '@/components/ui/paper-button'
import { Skeleton } from '@/components/ui/skeleton'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { useTodos, STATUS_CONFIG, PRIORITY_CONFIG, ROLE_MAP, TodoItem } from '@/features/dashboard/hooks/useTodos'
import { cn } from '@/lib/utils'

// 提取颜色配置，使用语义化映射
const PRIORITY_STYLES = {
  high: 'text-error-600 bg-error-50 border-error-200 dark:bg-error-900/20 dark:border-error-800',
  medium: 'text-warning-600 bg-warning-50 border-warning-200 dark:bg-warning-900/20 dark:border-warning-800',
  low: 'text-info-600 bg-info-50 border-info-200 dark:bg-info-900/20 dark:border-info-800',
}

// --- 子组件：单个任务卡片 ---
const TodoItemCard = ({ todo }: { todo: TodoItem }) => {
  return (
    <motion.div
      layout // ✨ 加上 layout 属性，当过滤导致卡片重新排布时会有平滑动画
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {/* 复用 SpotlightCard 增加交互质感 */}
      <SpotlightCard className="h-full bg-theme-bg-secondary border-theme-border/60 hover:border-theme-border transition-colors group">
        <div className="p-5 flex flex-col h-full">
          {/* 头部：图标与标题 */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex gap-3 overflow-hidden">
              <div className="mt-0.5 min-w-[36px] h-9 rounded-lg bg-theme-bg-tertiary flex items-center justify-center text-theme-text-secondary border border-theme-border/50">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-theme-text-primary truncate leading-tight mb-1">
                  {todo.title}
                </h4>
                <p className="text-xs text-theme-text-secondary">
                  {ROLE_MAP[todo.role] || todo.role}
                </p>
              </div>
            </div>
            
            {/* 优先级圆点 (Linear 风格) */}
            <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0", 
              todo.priority === 'high' ? 'bg-error-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 
              todo.priority === 'medium' ? 'bg-warning-500' : 'bg-blue-500' 
            )} title={`优先级: ${todo.priority}`} />
          </div>

          {/* 中间：信息标签 */}
          <div className="flex flex-wrap items-center gap-2 mb-6 flex-1">
             <span className="inline-flex items-center text-[10px] text-theme-text-secondary bg-theme-bg-tertiary px-2 py-1 rounded border border-theme-border/50">
                <Clock className="w-3 h-3 mr-1" />
                {todo.dueDate}
             </span>
             {/* 状态 Tag */}
             <PaperBadge variant={todo.status === 'completed' ? 'success' : todo.status === 'in-progress' ? 'warning' : 'info'} size="sm">
                {todo.status === 'completed' ? '已完成' : todo.status === 'in-progress' ? '进行中' : '待办'}
             </PaperBadge>
          </div>

          {/* 底部：隐式操作栏 (Hover 显示) */}
          <div className="flex items-center justify-between pt-4 border-t border-theme-border/40">
             <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded border uppercase", PRIORITY_STYLES[todo.priority])}>
               {todo.priority} Priority
             </span>
             
             <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform translate-x-2 group-hover:translate-x-0">
                <button className="text-xs font-medium text-theme-text-secondary hover:text-theme-text-primary transition-colors">
                  查看
                </button>
                <button className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors shadow-sm">
                  <ArrowRight className="w-3 h-3" />
                </button>
             </div>
          </div>
        </div>
      </SpotlightCard>
    </motion.div>
  )
}

// 移除自定义骨架屏组件，直接使用通用 Skeleton 组件

export default function TodosPage() {
  // 使用自定义hook获取数据
  const { todos, searchTerm, setSearchTerm, isLoading, isError, refetch } = useTodos()

  // ✨ 1. 补全搜索逻辑
  const filteredTodos = useMemo(() => {
    if (!searchTerm) return todos;
    return todos.filter(t =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ROLE_MAP[t.role]?.includes(searchTerm)
    );
  }, [todos, searchTerm]);

  return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-theme-text-primary tracking-tight">待办清单</h1>
            <p className="text-theme-text-secondary mt-1">集中处理您的所有业务待办项</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-secondary group-focus-within:text-primary-500 transition-colors" />
              <input 
                type="text" 
                placeholder="搜索任务..." 
                className="w-full pl-9 pr-4 py-2 bg-theme-bg-secondary border border-theme-border rounded-lg text-sm text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <PaperButton variant="outline" icon={<Filter className="w-4 h-4" />}>
              筛选
            </PaperButton>
            <PaperButton variant="primary" icon={<CheckCircle className="w-4 h-4" />}>
              新建
            </PaperButton>
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* ✨ 2. 使用标准 Skeleton 组件 */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-5 rounded-xl border border-theme-border bg-theme-bg-secondary space-y-4">
                   <div className="flex gap-3">
                      <Skeleton className="w-9 h-9 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                   </div>
                   <Skeleton className="h-20 w-full rounded-md" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-64 text-center rounded-xl border border-dashed border-theme-border bg-theme-bg-secondary/50">
              <div className="p-3 bg-error-50 rounded-full mb-3 text-error-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-medium text-theme-text-primary">加载失败</h3>
              <PaperButton variant="ghost" size="sm" onClick={() => refetch()} className="mt-2">
                重试
              </PaperButton>
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center rounded-xl border border-dashed border-theme-border bg-theme-bg-secondary/50">
              <div className="p-3 bg-theme-bg-tertiary rounded-full mb-3 text-theme-text-secondary">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-medium text-theme-text-primary">
                {searchTerm ? '未找到相关任务' : '暂无待办任务'}
              </h3>
              {searchTerm && (
                <p className="text-sm text-theme-text-secondary mt-1">尝试更换搜索关键词</p>
              )}
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence mode='popLayout'>
                {filteredTodos.map((todo) => (
                  <TodoItemCard key={todo.id} todo={todo} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
  )
}
