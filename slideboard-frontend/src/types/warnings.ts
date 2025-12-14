export type WarningSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Warning {
    id: number;
    type: string;
    severity: WarningSeverity;
    lead_id?: number;
    order_id?: number;
    message: string;
    action_required: string;
    metadata?: Record<string, any>;
    created_at: string;
    resolved_at?: string | null;
    resolved_by?: string | null;
}

export interface WarningStats {
    type: string;
    count: number;
    severity: WarningSeverity;
}
