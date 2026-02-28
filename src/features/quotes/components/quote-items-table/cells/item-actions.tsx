'use client';

import { memo } from 'react';
import { TableCell } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';

import Settings from 'lucide-react/dist/esm/icons/settings';
import Trash2 from 'lucide-react/dist/esm/icons/trash';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import { cn } from '@/shared/lib/utils';

interface ItemActionsCellProps {
  level: number;
  isCurtain: boolean;
  isExpanded: boolean;
  readOnly: boolean;
  onAddAccessory: () => void;
  onToggleExpand: () => void;
  onAdvancedEdit: () => void;
  onDelete: () => void;
}

export const ItemActionsCell = memo(function ItemActionsCell({
  level,
  isCurtain,
  isExpanded,
  readOnly,
  onToggleExpand,
  onAdvancedEdit,
  onDelete,
}: ItemActionsCellProps) {
  if (readOnly) return null;

  return (
    <TableCell className="p-2 text-center">
      <div className="flex items-center justify-center space-x-1">

        {level === 0 && isCurtain && (
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              'h-7 w-7',
              isExpanded ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary'
            )}
            onClick={onToggleExpand}
            title={isExpanded ? '收起高级配置' : '展开高级配置'}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="text-muted-foreground hover:text-primary h-7 w-7"
          onClick={onAdvancedEdit}
          title="高级配置"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 w-7"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </TableCell>
  );
});
