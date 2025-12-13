import { Database } from './supabase';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'following'
  | 'high_intent'
  | 'quote_sent'
  | 'negotiating'
  | 'won'
  | 'lost'
  | 'invalid'
  | 'PENDING_ASSIGNMENT'
  | 'PENDING_FOLLOW_UP'
  | 'FOLLOWING_UP'
  | 'DRAFT_SIGNED'
  | 'EXPIRED'
  | 'PENDING_MEASUREMENT'
  | 'MEASURING_PENDING_ASSIGNMENT'
  | 'MEASURING_ASSIGNING'
  | 'MEASURING_PENDING_VISIT'
  | 'MEASURING_PENDING_CONFIRMATION'
  | 'PLAN_PENDING_CONFIRMATION'
  | 'PENDING_PUSH'
  | 'PENDING_ORDER'
  | 'IN_PRODUCTION'
  | 'STOCK_PREPARED'
  | 'PENDING_SHIPMENT'
  | 'INSTALLING_PENDING_ASSIGNMENT'
  | 'INSTALLING_ASSIGNING'
  | 'INSTALLING_PENDING_VISIT'
  | 'INSTALLING_PENDING_CONFIRMATION'
  | 'PENDING_RECONCILIATION'
  | 'PENDING_INVOICE'
  | 'PENDING_PAYMENT'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PAUSED'
  | 'ABNORMAL';

export type CustomerLevel = 'A' | 'B' | 'C' | 'D';
export type BusinessTag = 'quoted' | 'arrived' | 'appointment' | 'high-intent' | 'measured';

export interface Lead {
  id: string;
  leadNumber: string;
  name: string;
  phone: string;
  projectAddress?: string;
  source?: string;
  status: LeadStatus;
  customerLevel?: CustomerLevel;
  budgetMin?: number;
  budgetMax?: number;
  requirements?: string[];
  businessTags?: BusinessTag[];
  appointmentTime?: string;
  appointmentReminder?: string;
  constructionProgress?: string;
  expectedPurchaseDate?: string;
  expectedCheckInDate?: string;
  areaSize?: number;
  
  // Stats
  quoteVersions: number;
  measurementCompleted: boolean;
  installationCompleted: boolean;
  financialStatus?: string;
  expectedMeasurementDate?: string;
  expectedInstallationDate?: string;
  totalQuoteAmount?: number;
  
  // Status Tracking
  lastStatusChangeAt?: string;
  lastStatusChangeById?: string;
  isCancelled: boolean;
  cancellationReason?: string;
  isPaused: boolean;
  pauseReason?: string;
  
  // Relations
  assignedToId?: string;
  assignedToName?: string;
  designerId?: string;
  designerName?: string;
  shoppingGuideId?: string;
  shoppingGuideName?: string;
  createdById?: string;
  createdByName?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadRequest {
  name: string;
  phone: string;
  projectAddress?: string;
  source?: string;
  budgetMin?: number;
  budgetMax?: number;
  requirements?: string[];
  businessTags?: string[];
  appointmentTime?: string;
  appointmentReminder?: string;
  constructionProgress?: string;
  expectedPurchaseDate?: string;
  expectedCheckInDate?: string;
  areaSize?: number;
  assignedToId?: string;
  designerId?: string;
  shoppingGuideId?: string;
}

export interface UpdateLeadRequest {
  name?: string;
  phone?: string;
  projectAddress?: string;
  source?: string;
  status?: LeadStatus;
  customerLevel?: string;
  budgetMin?: number;
  budgetMax?: number;
  requirements?: string[];
  businessTags?: string[];
  appointmentTime?: string;
  appointmentReminder?: string;
  constructionProgress?: string;
  expectedPurchaseDate?: string;
  expectedCheckInDate?: string;
  areaSize?: number;
  assignedToId?: string;
  designerId?: string;
  shoppingGuideId?: string;
  isCancelled?: boolean;
  cancellationReason?: string;
  isPaused?: boolean;
  pauseReason?: string;
}

export interface LeadStatusConfig {
  label: string
  color: string
  bgColor: string
  borderColor: string
  visibleTo?: string[]
  actions?: LeadAction[]
}

export interface LeadAction {
  key: string
  label: string
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning'
  permission?: string[]
  confirmRequired?: boolean
}

export interface LeadFilter {
  searchTerm: string
  status: string
  businessTags: string[]
  source: string
  owner: string
  designer: string
  shoppingGuide: string
  customerLevel: string
  dateRange: {
    start: string
    end: string
  }
}

export interface AppointmentCalendarItem {
  date: string
  appointments: {
    time: string
    customerName: string
    requirement: string
    level: string
  }[]
  count: number
}

export interface FollowUpRecord {
  id: string
  leadId: string
  type: 'text' | 'voice' | 'image'
  content: string
  result: 'interested' | 'not-interested' | 'follow-up'
  note?: string
  nextFollowUpTime?: string
  appointmentTime?: string
  createdAt: string
  createdBy: string
}

export interface LeadAssignment {
  leadId: string
  assigneeId: string
  method: 'manual' | 'auto'
  reason?: string
  createdAt: string
  createdBy: string
}
export interface LeadDuplicateRecord {
  id: string
  customer_name: string
  phone: string
  project_address?: string
  lead_number: string
  created_at: string
}

export interface LeadWarnings {
  followUpStale: number
  quotedNoDraft: number
  measurementOverdue: number
  noFollowUp7Days: number
  highIntentStale: number
  budgetExceeded: number
  churnRisk: number
  competitorThreat: number
  total: number
  generated_at: string
}

export type WarningType =
  | 'all'
  | 'follow_up_stale'
  | 'quoted_no_draft'
  | 'measurement_overdue'
  | 'no_follow_up_7days'
  | 'high_intent_stale'
  | 'budget_exceeded'
  | 'churn_risk'
  | 'competitor_threat'
