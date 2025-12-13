'use client';

import dynamic from 'next/dynamic';
import React from 'react';

import { leadService } from '@/services/leads.client';
import { LeadItem } from '@/shared/types/lead';

const AssignmentDialog = dynamic(() => import('@/features/leads/components/AssignmentDialog'));

interface LeadAssignmentControllerProps {
  lead: LeadItem | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function LeadAssignmentController({
  lead,
  isOpen,
  onOpenChange,
  onSuccess
}: LeadAssignmentControllerProps) {
  if (!lead) return null;

  return (
    <AssignmentDialog
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
      onAssign={async (data) => {
        await leadService.assignLead(data.leadId, data.assigneeId, data.reason);
        await leadService.updateLeadStatus(data.leadId, 'PENDING_FOLLOW_UP');
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      }}
    />
  );
}
