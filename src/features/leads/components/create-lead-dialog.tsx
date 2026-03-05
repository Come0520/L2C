'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import Plus from 'lucide-react/dist/esm/icons/plus';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const LeadForm = dynamic(() => import('./lead-form').then((mod) => mod.LeadForm), { ssr: false });

interface CreateLeadDialogProps {
  tenantId: string;
  trigger?: React.ReactNode;
}

export function CreateLeadDialog({ tenantId, trigger }: CreateLeadDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="create-lead-btn">
            <Plus className="mr-2 h-4 w-4" />
            新建线索
          </Button>
        )}
      </DialogTrigger>
      <DialogContent resizable className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>新建线索</DialogTitle>
        </DialogHeader>
        {open && <LeadForm onSuccess={() => setOpen(false)} tenantId={tenantId} />}
      </DialogContent>
    </Dialog>
  );
}
