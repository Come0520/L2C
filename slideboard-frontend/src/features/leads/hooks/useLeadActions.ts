'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { toast } from '@/components/ui/toast';
import { leadService } from '@/services/leads.client';
import { Lead } from '@/shared/types/lead';

export function useLeadActions() {
  const queryClient = useQueryClient();
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  
  // Action Dialog States
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [confirmTrackingDialogOpen, setConfirmTrackingDialogOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  
  // Selection State
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  const showConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.confirm(message)) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  };

  const showNotification = (message: string, isSuccess: boolean) => {
    if (isSuccess) {
      toast.success(`成功: ${message}`);
    } else {
      toast.error(`失败: ${message}`);
    }
  };

  const handleAction = async (action: string, lead: Lead) => {
    setCurrentLead(lead);

    switch (action) {
      case 'followUp':
      case 'add_followup':
        setFollowUpDialogOpen(true);
        break;
      case 'assign':
        setAssignmentDialogOpen(true);
        break;
      case 'confirmTracking':
      case 'confirm_track':
        setConfirmTrackingDialogOpen(true);
        break;
      case 'appointment':
        setFollowUpDialogOpen(true);
        break;
      case 'view':
        setDetailDrawerOpen(true);
        break;
      case 'confirm_plan':
        if (lead.quoteVersions === 0) {
          showNotification('请先创建设计方案', false);
          return;
        }
        if (await showConfirm('确定要确认该设计方案吗？')) {
          try {
            await leadService.updateLeadStatus(lead.id, 'PENDING_PUSH');
            showNotification('方案已确认', true);
            queryClient.invalidateQueries({ queryKey: ['leads'] });
          } catch (error) {
            showNotification('确认失败', false);
          }
        }
        break;
      default:
        console.warn('Unknown action:', action);
    }
  };

  return {
    currentLead,
    handleAction,
    dialogStates: {
      followUpDialogOpen,
      setFollowUpDialogOpen,
      assignmentDialogOpen,
      setAssignmentDialogOpen,
      confirmTrackingDialogOpen,
      setConfirmTrackingDialogOpen,
      detailDrawerOpen,
      setDetailDrawerOpen,
    },
    selection: {
      selectedLeads,
      setSelectedLeads
    }
  };
}
