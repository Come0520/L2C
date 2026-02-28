'use client';

import { useState, useTransition } from 'react';
import { Textarea } from '@/shared/ui/textarea';
import { Button } from '@/shared/ui/button';
import { updateCustomer } from '../actions/mutations';
import { toast } from 'sonner';
import Edit from 'lucide-react/dist/esm/icons/edit';

interface InlineNotesEditorProps {
  /** 客户 ID */
  customerId: string;
  /** 当前备注内容 */
  initialNotes: string;
}

/**
 * 内联备注编辑器
 *
 * 在客户详情页中直接编辑备注，无需打开对话框。
 * 支持点击编辑、保存和取消操作。
 */
export function InlineNotesEditor({ customerId, initialNotes }: InlineNotesEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateCustomer({ id: customerId, data: { notes } });
        toast.success('备注已更新');
        setIsEditing(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : '更新备注失败';
        toast.error(message);
      }
    });
  };

  const handleCancel = () => {
    setNotes(initialNotes);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="输入备注信息..."
          rows={3}
          maxLength={500}
          autoFocus
          disabled={isPending}
        />
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? '保存中...' : '保存'}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isPending}>
            取消
          </Button>
          <span className="text-muted-foreground ml-auto text-xs">{notes.length}/500</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative cursor-pointer rounded bg-gray-50 p-2 text-sm whitespace-pre-wrap text-gray-900 transition-colors hover:bg-gray-100"
      onClick={() => setIsEditing(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setIsEditing(true);
      }}
    >
      {notes || '暂无备注'}
      <Edit className="absolute top-2 right-2 h-3.5 w-3.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}
