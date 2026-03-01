'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { toast } from 'sonner';

/**
 * 安装完工表单组件
 * 用于师傅提交安装任务的最终完工信息（如照片、签名等）
 *
 * @param {string} _taskId - 安装任务 ID (暂未集成完工存盘逻辑)
 */
export function InstallationCompletionForm({ taskId: _taskId }: { taskId: string }) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success('Installation completion submitted (mock)');
    }, 1000);
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="text-lg font-bold">Installation Completion Form</h3>
      <div className="text-muted-foreground rounded-lg border-2 border-dashed py-8 text-center">
        Completion form details not available in recovery mode.
      </div>
      <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Submitting...' : 'Confirm Completion'}
      </Button>
    </div>
  );
}
