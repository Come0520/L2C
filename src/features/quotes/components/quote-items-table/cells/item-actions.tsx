'use client';

import { memo } from 'react';
import { TableCell } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';

import Trash2 from 'lucide-react/dist/esm/icons/trash';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Settings2 from 'lucide-react/dist/esm/icons/settings-2';
import { cn } from '@/shared/lib/utils';

interface ItemActionsCellProps {
  level: number;
  isCurtain: boolean;
  isExpanded: boolean;
  readOnly: boolean;
  onToggleExpand: () => void;
  onAddAccessory: () => void;
  onDelete: () => void;
  rowSpan?: number;
  /** 高级配置按钮回调（URL 驱动模式下传入，点击后通过 URL 参数打开 Drawer） */
  onAdvancedEdit?: () => void;
}

export const ItemActionsCell = memo(function ItemActionsCell({
  level,
  isCurtain,
  isExpanded,
  readOnly,
  onToggleExpand,
  onAddAccessory,
  onDelete,
  rowSpan,
  onAdvancedEdit,
}: ItemActionsCellProps) {
  if (readOnly) return null;

  return (
    <TableCell rowSpan={rowSpan} className="p-2 text-center">
      <div className="flex items-center justify-center space-x-1">
        {level === 0 && isCurtain && (
          <>
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground hover:text-primary h-7 w-7"
              onClick={onAddAccessory}
              title="添加附件"
              aria-label="添加附件"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Button>
            {/* 如果有外部 URL 驱动的高级配置回调，显示设置图标；否则回退到内联展开 */}
            {onAdvancedEdit ? (
              <Button
                size="icon"
                variant="ghost"
                className="text-muted-foreground hover:text-primary h-7 w-7"
                onClick={onAdvancedEdit}
                title="高级配置"
                aria-label="高级配置"
              >
                <Settings2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  'h-7 w-7',
                  isExpanded
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-primary'
                )}
                onClick={onToggleExpand}
                title={isExpanded ? '收起高级配置' : '展开高级配置'}
                aria-expanded={isExpanded}
                aria-label={isExpanded ? '收起' : '展开'}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            )}
          </>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 w-7"
          onClick={onDelete}
          aria-label="删除此项"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </TableCell>
  );
});
