import { Database } from './supabase';

export interface Customer {
  id: string;
  leadId?: string;
  name: string;
  phone: string;
  projectAddress?: string;
  customerType: 'individual' | 'company' | 'agent';
  contactInfo?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  leadId?: string;
  name: string;
  phone: string;
  projectAddress?: string;
  customerType?: 'individual' | 'company' | 'agent';
  contactInfo?: string;
  address?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  phone?: string;
  projectAddress?: string;
  customerType?: 'individual' | 'company' | 'agent';
  contactInfo?: string;
  address?: string;
}
