'use client';

/**
 * 移动端审批列表页面 (老板端)
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMobileAuth } from '@/shared/auth/mobile-auth-context';
import { mobileGet } from '@/shared/lib/mobile-api-client';
import { ChevronRight, ClipboardList, CheckCircle2 } from 'lucide-react';
import { MobileApprovalSkeleton } from '@/shared/ui/skeleton-variants';

interface ApprovalTask {
  id: string;
  approvalId: string;
  flowName: string;
  nodeName: string;
  status: string;
  requesterName: string;
  createdAt: string;
}

export default function MobileApprovalsPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useMobileAuth();
  const [tasks, setTasks] = useState<ApprovalTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 未登录跳转
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/mobile/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // 加载审批任务列表
  useEffect(() => {
    async function fetchApprovals() {
      if (!isAuthenticated) return;

      setIsLoading(true);
      interface ApprovalsResponse {
        items: ApprovalTask[];
        total: number;
      }
      const response = await mobileGet<ApprovalsResponse>('/approvals');
      if (response.success && response.data) {
        // 后端返回的是分页对象 { items, total, ... }
        setTasks(response.data.items || []);
      }
      setIsLoading(false);
    }

    fetchApprovals();
  }, [isAuthenticated]);

  // 加载状态
  if (authLoading || isLoading) {
    return <MobileApprovalSkeleton />;
  }

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">
          <ClipboardList className="h-6 w-6 text-blue-600" />
          待我审批
        </h1>
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
          {tasks.length} 单
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <CheckCircle2 className="mb-4 h-16 w-16 text-gray-200" />
          <p>暂无待处理的审批</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => router.push(`/mobile/approvals/${task.id}`)}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors active:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:active:bg-zinc-700"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  {task.flowName}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(task.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>

              <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">
                {task.requesterName} 提交的申请
              </h3>

              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  当前环节:{' '}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {task.nodeName}
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
