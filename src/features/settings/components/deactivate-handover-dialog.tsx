'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import type { UserInfo } from '@/features/settings/actions/user-actions';
import { AlertTriangle } from 'lucide-react';

interface DeactivateHandoverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 被停用的员工 */
  targetUser: UserInfo;
  /** 可选作为接管人的其他活跃成员 */
  activeMembers: UserInfo[];
  /** 确认停用并交接，传入选中的接管人 ID */
  onConfirm: (handoverToUserId: string) => Promise<void>;
}

/**
 * 员工停用 + 资产交接对话框
 * Base 版专用：停用员工前必须指定线索接管人
 */
export function DeactivateHandoverDialog({
  open,
  onOpenChange,
  targetUser,
  activeMembers,
  onConfirm,
}: DeactivateHandoverDialogProps) {
  const [handoverUserId, setHandoverUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!handoverUserId) return;
    setLoading(true);
    try {
      await onConfirm(handoverUserId);
      // 成功后关闭
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            停用员工并交接资产
          </DialogTitle>
          <DialogDescription>
            停用 <strong>{targetUser.name}</strong> 之前，需要将其名下的未结线索转交给其他成员。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            此操作将把该员工名下所有活跃线索转移给接管人，且账号将被停用。此操作不可逆。
          </div>

          <div className="space-y-2">
            <Label htmlFor="handover-select">选择接管人</Label>
            <Select value={handoverUserId} onValueChange={setHandoverUserId}>
              <SelectTrigger id="handover-select">
                <SelectValue placeholder="请选择线索接管人" />
              </SelectTrigger>
              <SelectContent>
                {activeMembers.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    暂无其他活跃成员
                  </SelectItem>
                ) : (
                  activeMembers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!handoverUserId || loading || activeMembers.length === 0}
          >
            {loading ? '处理中...' : '确认停用并交接'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
