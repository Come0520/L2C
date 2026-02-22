import { logger } from "@/shared/lib/logger";
export interface Channel {
    id: string;
    name: string;
    isActive: boolean;
    type: string; // 'ONLINE' | 'OFFLINE' | 'REFERRAL' | ...
}

export interface SalesUser {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    role?: string;
}

export interface AssignLeadDialogProps {
    leadId: string;
    currentAssignedId?: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export interface FollowupDialogProps {
    leadId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}
