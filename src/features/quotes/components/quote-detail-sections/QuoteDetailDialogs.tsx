'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
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
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { approveQuote, rejectQuote, createRoom } from '@/features/quotes/actions/mutations';
import { QUOTE_DIALOGS as DIALOGS } from '@/features/quotes/constants/dialogs';

const MeasureDataImportDialog = dynamic(
  () => import('../measure-data-import-dialog').then((mod) => mod.MeasureDataImportDialog),
  { ssr: false }
);
const QuoteExcelImportDialog = dynamic(
  () => import('../quote-excel-import-dialog').then((mod) => mod.QuoteExcelImportDialog),
  { ssr: false }
);
const SaveAsTemplateDialog = dynamic(
  () => import('../save-as-template-dialog').then((mod) => mod.SaveAsTemplateDialog),
  { ssr: false }
);
const RejectQuoteDialog = dynamic(
  () => import('../reject-quote-dialog').then((mod) => mod.RejectQuoteDialog),
  { ssr: false }
);

interface QuoteDetailDialogsProps {
  /** 报价单 ID */
  quoteId: string;
  /** 当前激活的 dialog 名称（来自 URL state） */
  activeDialog: string | null;
  /** 关闭 dialog 的回调 */
  onClose: () => void;
  /** 新空间名称 state */
  newRoomName: string;
  /** 更新新空间名称的回调 */
  onRoomNameChange: (name: string) => void;
  /** 创建空间的回调 */
  onCreateRoom: () => Promise<void>;
}

/**
 * 报价单 Dialogs 集中管理组件
 *
 * @description 将所有弹窗渲染集中在一处，避免主组件因大量 Dialog 而臃肿。
 * 包含：导入测量数据、Excel 导入、保存为模板、驳回报价、批准报价、添加空间
 */
export function QuoteDetailDialogs({
  quoteId,
  activeDialog,
  onClose,
  newRoomName,
  onRoomNameChange,
  onCreateRoom,
}: QuoteDetailDialogsProps) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState(false);

  const handleRejectConfirm = async (reason: string) => {
    try {
      setActionLoading(true);
      const res = await rejectQuote({ id: quoteId, rejectReason: reason });
      if (res?.error) throw new Error(res.error);
      toast.success('报价单已驳回');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await approveQuote({ id: quoteId });
      if (res?.error) throw new Error(res.error);
      toast.success('报价单已批准');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      {/* 导入测量数据 */}
      <MeasureDataImportDialog
        open={activeDialog === DIALOGS.MEASURE_IMPORT}
        onOpenChange={(v: boolean) => !v && onClose()}
        quoteId={quoteId}
        onSuccess={() => router.refresh()}
      />

      {/* Excel 导入 */}
      <QuoteExcelImportDialog
        open={activeDialog === DIALOGS.EXCEL_IMPORT}
        onOpenChange={(v: boolean) => !v && onClose()}
        quoteId={quoteId}
        onSuccess={() => router.refresh()}
      />

      {/* 保存为模板（在主组件外层渲染，以便不影响布局） */}
      <SaveAsTemplateDialog
        quoteId={quoteId}
        open={activeDialog === DIALOGS.SAVE_TEMPLATE}
        onOpenChange={(isOpen) => !isOpen && onClose()}
        onSuccess={() => router.refresh()}
      />

      {/* 驳回 */}
      <RejectQuoteDialog
        open={activeDialog === DIALOGS.REJECT}
        onOpenChange={(v: boolean) => !v && onClose()}
        loading={actionLoading}
        onConfirm={handleRejectConfirm}
      />

      {/* 批准确认 */}
      <AlertDialog
        open={activeDialog === DIALOGS.APPROVE}
        onOpenChange={(v: boolean) => !v && onClose()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认批准</AlertDialogTitle>
            <AlertDialogDescription>
              批准后，报价单将标记为已批准，且不可再修改。是否继续？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleApproveConfirm} disabled={actionLoading}>
              {actionLoading ? '批准中...' : '确认批准'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 添加空间 */}
      <Dialog
        open={activeDialog === DIALOGS.ADD_ROOM}
        onOpenChange={(isOpen) => !isOpen && onClose()}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>添加空间</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="输入空间名称"
              value={newRoomName}
              onChange={(e) => onRoomNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onCreateRoom();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button onClick={onCreateRoom}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
