'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';

interface SmartDuplicateCheckProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  conflictData: {
    type: 'PHONE' | 'ADDRESS';
    existingEntity: { id: string; name: string; owner?: string | null };
  } | null;
  onStrategySelect: (strategy: 'LINK' | 'OVERWRITE' | 'CANCEL') => void;
}

export function SmartDuplicateCheck({
  isOpen,
  onOpenChange,
  conflictData,
  onStrategySelect,
}: SmartDuplicateCheckProps) {
  if (!conflictData) return null;

  const { type, existingEntity } = conflictData;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>检测到重复线索</AlertDialogTitle>
          <AlertDialogDescription>
            检测到该{type === 'PHONE' ? '手机号' : '地址'}已存在:
            <span className="font-semibold"> {existingEntity.name}</span>
            {existingEntity.owner && ` (负责人: ${existingEntity.owner})`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel onClick={() => onStrategySelect('CANCEL')}>取消</AlertDialogCancel>

          <AlertDialogAction onClick={() => onStrategySelect('LINK')}>查看详情</AlertDialogAction>

          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => onStrategySelect('OVERWRITE')}
          >
            继续录入
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
