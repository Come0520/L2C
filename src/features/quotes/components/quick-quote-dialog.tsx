'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { quoteI18n as t } from '../i18n';

interface QuickQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickQuoteDialog({ open, onOpenChange }: QuickQuoteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl" aria-describedby="quick-quote-desc">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
        </DialogHeader>
        <div className="py-4" id="quick-quote-desc">
          <p className="text-muted-foreground">快速报价功能在恢复模式下暂不可用。</p>
          <p className="text-muted-foreground text-sm">
            (Quick Quote is not available in recovery mode.)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
