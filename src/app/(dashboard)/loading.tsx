import { Loader2 } from 'lucide-react';
import React from 'react';

/**
 * 全局占位 Loading 组件
 * 利用 React 18 Suspense 和 Next.js 内嵌错误边界实现页面切换时的非阻塞渲染
 */
export default function DashboardLoading() {
  return (
    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="text-primary h-8 w-8 animate-spin" />
      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="text-foreground text-lg font-medium">数据准备中</h3>
        <p className="text-muted-foreground animate-pulse text-sm">正在为您构建沉浸式工作台...</p>
      </div>
    </div>
  );
}
