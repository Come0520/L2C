'use client';

import dynamic from 'next/dynamic';
import React from 'react';

import { LeadItem, FollowUpRecord } from '@/shared/types/lead';

const FollowUpDialog = dynamic(() => import('@/features/leads/components/FollowUpDialog'));

interface LeadFollowUpControllerProps {
  lead: LeadItem | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (record: Omit<FollowUpRecord, 'id' | 'createdAt' | 'createdBy'>) => void;
}

export function LeadFollowUpController({
  lead,
  isOpen,
  onOpenChange,
  onSave
}: LeadFollowUpControllerProps) {
  if (!lead) return null;

  return (
    <FollowUpDialog
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      lead={{
        id: lead.id,
        customerName: lead.customerName,
        phone: lead.phone,
        requirements: lead.requirements,
        leadNumber: lead.leadNumber,
        projectAddress: lead.projectAddress,
        customerLevel: lead.customerLevel,
        status: lead.status,
        source: lead.source,
        createdAt: lead.createdAt,
        lastFollowUpAt: lead.lastFollowUpAt
      }}
      onSave={(record) => {
        if (onSave) {
          onSave(record);
        }
        onOpenChange(false);
      }}
    />
  );
}
