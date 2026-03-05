'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { useConfirmState, confirmStore } from '@/shared/hooks/use-confirm';

export function GlobalConfirmProvider() {
  const { isOpen, options } = useConfirmState();

  if (!options) return null;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      confirmStore.close(false);
    }
  };

  const handleConfirm = () => {
    confirmStore.close(true);
  };

  const handleCancel = () => {
    confirmStore.close(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{options.title}</DialogTitle>
          {options.description && <DialogDescription>{options.description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleCancel}>
            {options.cancelText || '取消'}
          </Button>
          <Button
            variant={options.variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
          >
            {options.confirmText || '确定'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
