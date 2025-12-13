export * from '@/shared/types/quote';

// Alias for snake_case DTOs used in API requests
export type CreateQuoteAPIDTO = {
  lead_id?: string;
  customer_id?: string;
  project_name: string;
  project_address?: string;
  items: Array<{
    category: string;
    space: string;
    product_name: string;
    product_id?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    description?: string;
    image_url?: string;
    attributes?: Record<string, any>;
  }>;
};

export type CreateQuoteVersionAPIDTO = {
  quote_id: string;
  version_suffix?: string;
  total_amount: number;
  items: Array<{
    category: string;
    space: string;
    product_name: string;
    product_id?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    description?: string;
    image_url?: string;
    attributes?: Record<string, any>;
  }>;
  remarks?: string;
};

export type UpdateQuoteVersionAPIDTO = {
  version_id: string;
  items?: Array<{
    category: string;
    space: string;
    product_name: string;
    product_id?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    description?: string;
    image_url?: string;
    attributes?: Record<string, any>;
  }>;
  status?: string;
  valid_until?: string;
  remarks?: string;
  total_amount?: number;
};
