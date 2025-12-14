export type QuoteStatus = 'draft' | 'active' | 'won' | 'lost' | 'expired';
export type QuoteVersionStatus = 'draft' | 'presented' | 'rejected' | 'accepted';

export interface QuoteItem {
    id: string;
    quote_version_id: string;
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
    created_at: string;
}

export interface QuoteVersion {
    id: string;
    quote_id: string;
    version_number: number;
    version_suffix?: string;
    total_amount: number;
    status: QuoteVersionStatus;
    valid_until?: string;
    remarks?: string;
    items?: QuoteItem[];
    created_at: string;
    updated_at: string;
}

export interface Quote {
    id: string;
    quote_no: string;
    lead_id?: string;
    customer_id?: string;
    project_name?: string;
    project_address?: string;
    salesperson_id?: string;
    current_version_id?: string;
    status: QuoteStatus;
    current_version?: QuoteVersion; // Joined data
    versions?: QuoteVersion[];      // Joined data
    created_at: string;
    updated_at: string;
}

// DTOs
export interface CreateQuoteDTO {
    lead_id?: string;
    customer_id?: string;
    project_name: string;
    project_address?: string;
    items: Omit<QuoteItem, 'id' | 'quote_version_id' | 'created_at'>[];
}

export interface CreateQuoteVersionDTO {
    quote_id: string;
    version_suffix?: string;
    items: Omit<QuoteItem, 'id' | 'quote_version_id' | 'created_at'>[];
    remarks?: string;
}

export interface UpdateQuoteVersionDTO {
    version_id: string;
    items?: Omit<QuoteItem, 'id' | 'quote_version_id' | 'created_at'>[];
    status?: QuoteVersionStatus;
    valid_until?: string;
    remarks?: string;
}
