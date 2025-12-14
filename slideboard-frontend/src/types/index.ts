// Temporary types index file to fix import errors
// These types will be replaced with proper types from Supabase or other sources

export interface Lead {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  project_name: string;
  project_address: string;
  project_area: number;
  lead_source: string;
  lead_status: string;
  assigned_to: string;
  assigned_at: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  priority: string;
  notes: string;
  tags: string[];
  expected_budget: number;
  follow_up_date: string;
  quotes?: Array<{
    id: string;
    lead_id: string;
    quote_number: string;
    quote_date: string;
    quote_amount: number;
    quote_status: string;
    created_at: string;
    updated_at: string;
  }>;
  order?: {
    id: string;
    lead_id: string;
    order_number: string;
    order_date: string;
    order_amount: number;
    order_status: string;
    created_at: string;
    updated_at: string;
  };
}

export interface Order {
  id: string;
  lead_id?: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  order_number: string;
  order_date: string;
  order_amount?: number;
  total_amount?: number;
  order_status: string;
  payment_status?: string;
  payment_method?: string;
  discount_amount?: number;
  tax_amount?: number;
  final_amount?: number;
  shipping_address?: string;
  billing_address?: string;
  contact_person?: string;
  contact_phone?: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string | null;
  assigned_to?: string;
  created_by?: string;
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  measurement?: any;
  installation?: any;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_code: string;
  product_category: string;
  quantity: number;
  price: number;
  unit_price?: number;
  total_price: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  full_name: string;
  phone: string;
  avatar_url: string;
  password?: string;
  created_at: string;
  updated_at: string;
  last_login: string;
  join_date: string;
  role?: string;
  team_id?: string;
  department?: string;
  status?: string;
  position?: string;
  permissions?: Record<string, any>;
  settings?: {
    notifications: boolean;
    theme: string;
    language: string;
  };
}

export interface Team {
  id: string;
  name: string;
  description: string;
  manager_id: string;
  members_count: number;
  status: string;
  created_at: string;
  updated_at: string;
  members?: User[];
}
