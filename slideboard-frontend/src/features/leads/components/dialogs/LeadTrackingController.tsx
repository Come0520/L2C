'use client';

import dynamic from 'next/dynamic';
import React from 'react';

import { LeadItem } from '@/shared/types/lead';

const ConfirmTrackingDialog = dynamic(() => import('@/features/leads/components/ConfirmTrackingDialog'));

interface LeadTrackingControllerProps {
  lead: LeadItem | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void;
}

export function LeadTrackingController({
  lead,
  isOpen,
  onOpenChange,
  onConfirm
}: LeadTrackingControllerProps) {
  if (!lead) return null;

  return (
    <ConfirmTrackingDialog
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      lead={{
        id: lead.id,
        customerName: lead.customerName,
        phone: lead.phone,
        requirements: lead.requirements,
        budgetMin: lead.budgetMin,
        budgetMax: lead.budgetMax
      }}
      onConfirm={() => {
        onOpenChange(false);
        if (onConfirm) {
          onConfirm();
        }
      }}
    />
  );
}
