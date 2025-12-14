import { supabase as supabaseClient } from '@/lib/supabase/client';
import { 
    Quote, 
    QuoteVersion, 
    QuoteItem, 
    CreateQuoteRequest, 
    CreateQuoteVersionRequest, 
    UpdateQuoteVersionRequest,
    QuoteStatus,
    QuoteVersionStatus
} from '@/shared/types/quote';

const supabase = supabaseClient;

/**
 * Database row interface for quote items
 */
interface QuoteItemRow {
    id: string;
    quote_version_id: string;
    category: string;
    space: string;
    product_name: string;
    product_id: string | null;
    variant_id: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    description: string | null;
    image_url: string | null;
    width: number | null;
    height: number | null;
    unit: string | null;
    attributes: Record<string, any> | null;
    created_at: string;
}

/**
 * Database row interface for quote versions
 */
interface QuoteVersionRow {
    id: string;
    quote_id: string;
    version_number: number;
    version_suffix: string | null;
    total_amount: number;
    status: string;
    valid_until: string | null;
    remarks: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    items?: QuoteItemRow[];
    quote?: { quote_no: string };
}

/**
 * Database row interface for quotes
 */
interface QuoteRow {
    id: string;
    quote_no: string;
    lead_id: string | null;
    customer_id: string | null;
    project_name: string | null;
    project_address: string | null;
    salesperson_id: string | null;
    current_version_id: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    versions?: (QuoteVersionRow & { items?: QuoteItemRow[] })[];
    current_version?: QuoteVersionRow;
}

/**
 * Quote Service Interface defining all available quote operations
 */
interface QuoteService {
    /**
     * Creates a new budget quote
     * @param data - The quote creation data
     * @returns Promise resolving to the created Quote
     */
    createBudgetQuote(data: CreateQuoteRequest): Promise<Quote>;
    
    /**
     * Gets all quotes for a specific lead
     * @param leadId - The ID of the lead
     * @returns Promise resolving to an array of Quotes
     */
    getQuotesByLead(leadId: string): Promise<Quote[]>;
    
    /**
     * Gets quotes with optional filters
     * @param filters - Optional filters for the quotes query
     * @returns Promise resolving to an array of Quotes
     */
    getQuotes(filters?: { leadId?: string; customerId?: string; status?: string }): Promise<Quote[]>;
    
    /**
     * Gets a single quote by ID with all versions and items
     * @param id - The ID of the quote
     * @returns Promise resolving to the Quote with all related data
     */
    getQuote(id: string): Promise<Quote>;
    
    /**
     * Creates a new version for an existing quote
     * @param data - The quote version creation data
     * @returns Promise resolving to the created QuoteVersion
     */
    createVersion(data: CreateQuoteVersionRequest): Promise<QuoteVersion>;
    
    /**
     * Updates an existing quote version
     * @param versionId - The ID of the version to update
     * @param data - The update data
     * @returns Promise resolving when the update is complete
     */
    updateVersion(versionId: string, data: UpdateQuoteVersionRequest): Promise<void>;
    
    /**
     * Confirms a quote version
     * @param quoteId - The ID of the quote
     * @param versionId - The ID of the version to confirm
     * @returns Promise resolving when the confirmation is complete
     */
    confirmVersion(quoteId: string, versionId: string): Promise<void>;
    
    /**
     * Publishes a quote version
     * @param quoteId - The ID of the quote
     * @param versionId - The ID of the version to publish
     * @returns Promise resolving when the publication is complete
     */
    publishVersion(quoteId: string, versionId: string): Promise<void>;
    
    /**
     * Updates the status of a quote version
     * @param versionId - The ID of the version to update
     * @param status - The new status
     * @returns Promise resolving when the status update is complete
     */
    updateVersionStatus(versionId: string, status: QuoteVersionStatus): Promise<void>;
    
    /**
     * Converts a quote version to an order
     * @param request - The conversion request data
     * @returns Promise resolving to the created order
     */
    convertQuoteVersionToOrder(request: ConvertQuoteVersionToOrderRequest): Promise<any>;
}

/**
 * Derive quote status from its versions
 */
const deriveQuoteStatus = (versions: QuoteVersion[]): QuoteStatus => {
    if (!versions || versions.length === 0) {
        return 'draft';
    }

    // Sort versions by version number (descending)
    const sortedVersions = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);
    const latestVersion = sortedVersions[0];
    if (!latestVersion) {
        return 'draft';
    }
    const latestVersionStatus = latestVersion.status;

    // Check if any version is confirmed
    const hasConfirmedVersion = versions.some(v => v.status === 'confirmed');
    
    // Check if all versions are expired or cancelled
    const allExpiredOrCancelled = versions.every(v => 
        v.status === 'expired' || v.status === 'cancelled'
    );

    // Derive status based on version statuses
    if (hasConfirmedVersion) {
        return 'confirmed';
    }
    
    if (latestVersionStatus === 'published' || latestVersionStatus === 'presented') {
        return 'active';
    }
    
    if (allExpiredOrCancelled) {
        return 'closed';
    }
    
    if (latestVersionStatus === 'accepted') {
        return 'won';
    }

    if (latestVersionStatus === 'rejected') {
        return 'lost';
    }
    
    return 'draft';
};

/**
 * Generate a unique quote number
 */
const generateQuoteNumber = async (): Promise<string> => {
    // Get current date in YYYYMMDD format
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get the count of quotes created today
    const { count, error } = await supabase
        .from('quotes')
        .select('id', { count: 'exact' })
        .gte('created_at', date.toISOString().slice(0, 10));
    
    if (error) {
        console.warn('Failed to get quote count for number generation, using fallback');
        return `Q${dateStr}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    }
    
    // Generate quote number: Q + YYYYMMDD + sequential number (3 digits)
    return `Q${dateStr}${(count + 1).toString().padStart(3, '0')}`;
};

/**
 * Reusable function to insert quote items
 */
const insertQuoteItems = async (versionId: string, items: CreateQuoteItemRequest[]): Promise<void> => {
    if (!items || items.length === 0) return;
    
    const itemsToInsert = items.map(item => ({
        quote_version_id: versionId,
        category: item.category || 'standard',
        space: item.space || 'default',
        product_name: item.productName,
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        description: item.description,
        image_url: item.imageUrl,
        width: item.width,
        height: item.height,
        unit: item.unit,
        attributes: item.attributes
    }));

    const { error } = await supabase
        .from('quote_items')
        .insert(itemsToInsert);
    
    if (error) throw new Error(error.message);
};

// Map DB Row to Frontend Type
function mapDbToQuoteItem(row: QuoteItemRow): QuoteItem {
    return {
        id: row.id,
        quoteVersionId: row.quote_version_id,
        category: row.category,
        space: row.space,
        productName: row.product_name,
        productId: row.product_id || undefined,
        variantId: row.variant_id || undefined,
        quantity: row.quantity || 0,
        unitPrice: row.unit_price || 0,
        totalPrice: row.total_price || 0,
        description: row.description || undefined,
        imageUrl: row.image_url || undefined,
        width: row.width || undefined,
        height: row.height || undefined,
        unit: row.unit || undefined,
        attributes: row.attributes || undefined,
        createdAt: row.created_at
    };
}

function mapDbToQuoteVersion(row: QuoteVersionRow & { items?: QuoteItemRow[], quote?: { quote_no: string } }, quoteNo?: string): QuoteVersion {
    return {
        id: row.id,
        quoteId: row.quote_id,
        versionNumber: row.version_number,
        versionSuffix: row.version_suffix || undefined,
        quoteNo: quoteNo || row.quote?.quote_no || `Q${row.quote_id}`, // Use quote_no from parent quote or fallback to quote_id
        totalAmount: row.total_amount,
        status: row.status as QuoteVersionStatus,
        validUntil: row.valid_until || undefined,
        remarks: row.remarks || undefined,
        createdBy: row.created_by || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        items: row.items ? row.items.map(mapDbToQuoteItem) : []
    };
}

function mapDbToQuote(row: QuoteRow & { versions?: (QuoteVersionRow & { items?: QuoteItemRow[] })[], current_version?: QuoteVersionRow }): Quote {
    const versions = row.versions ? row.versions.map(version => mapDbToQuoteVersion(version, row.quote_no)) : [];
    
    // Determine current version
    let currentVersion: QuoteVersion | undefined;
    if (row.current_version_id && versions.length > 0) {
        currentVersion = versions.find(v => v.id === row.current_version_id);
    }
    if (!currentVersion && versions.length > 0) {
        // Fallback to latest version
        currentVersion = [...versions].sort((a, b) => b.versionNumber - a.versionNumber)[0];
    }

    // Determine derived status if not set in DB
    const derivedStatus = versions.length > 0 ? deriveQuoteStatus(versions) : (row.status as QuoteStatus || 'draft');

    return {
        id: row.id,
        quoteNo: row.quote_no,
        leadId: row.lead_id || undefined,
        customerId: row.customer_id || undefined,
        projectName: row.project_name || '',
        projectAddress: row.project_address || '',
        salespersonId: row.salesperson_id || '',
        currentVersionId: row.current_version_id || undefined,
        status: derivedStatus,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        versions: versions,
        currentVersion: currentVersion
    };
}

export const quoteService: QuoteService = {
    /**
     * Create a new quote (budget quote)
     */
    async createBudgetQuote(data: CreateQuoteRequest) {
        // Validate input
        if (!data) throw new Error('CreateQuoteRequest data is required');
        if (!data.projectName) throw new Error('Project name is required');
        
        // Get current user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Generate unique quote number
        const quoteNo = await generateQuoteNumber();

        // 1. Create Quote Header
        const { data: quote, error: quoteError } = await supabase
            .from('quotes')
            .insert({
                lead_id: data.leadId,
                customer_id: data.customerId,
                project_name: data.projectName,
                project_address: data.projectAddress,
                salesperson_id: user.id,
                quote_no: quoteNo,
                status: 'draft'
            })
            .select()
            .single();

        if (quoteError) throw new Error(quoteError.message);

        // 2. Create Initial Version (v1)
        const { data: version, error: versionError } = await supabase
            .from('quote_versions')
            .insert({
                quote_id: quote.id,
                version_number: 1,
                total_amount: data.items ? data.items.reduce((sum, i) => sum + (i.totalPrice || 0), 0) : 0,
                status: 'draft',
                created_by: user.id
            })
            .select()
            .single();

        if (versionError) throw new Error(versionError.message);

        // 3. Insert items if any
        if (data.items) {
            await insertQuoteItems(version.id, data.items);
        }

        // 4. Update quote current version
        await supabase
            .from('quotes')
            .update({ current_version_id: version.id })
            .eq('id', quote.id);

        return this.getQuote(quote.id);
    },

    /**
     * Get quotes for a lead
     */
    async getQuotesByLead(leadId: string) {
        // Validate input
        if (!leadId) throw new Error('Lead ID is required');
        
        return this.getQuotes({ leadId });
    },

    /**
     * Get quotes with filters
     */
    async getQuotes(filters: { leadId?: string, customerId?: string, status?: string } = {}) {
        let query = supabase
            .from('quotes')
            .select(`
                *,
                versions:quote_versions(
                    *,
                    items:quote_items(*)
                )
            `)
            .order('created_at', { ascending: false });

        if (filters.leadId) {
            query = query.eq('lead_id', filters.leadId);
        }

        if (filters.customerId) {
            query = query.eq('customer_id', filters.customerId);
        }

        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        const { data, error } = await query;

        if (error) throw new Error(error.message);

        return (data || []).map((row: QuoteRow & { versions?: (QuoteVersionRow & { items?: QuoteItemRow[] })[] }) => mapDbToQuote(row));
    },

    /**
     * Get quote detail
     */
    async getQuote(id: string) {
        // Validate input
        if (!id) throw new Error('Quote ID is required');
        
        const { data, error } = await supabase
            .from('quotes')
            .select(`
                *,
                versions:quote_versions(
                    *,
                    items:quote_items(*)
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw new Error(error.message);
        if (!data) throw new Error('Quote not found');

        return mapDbToQuote(data);
    },

    /**
     * Create a new version for a quote
     */
    async createVersion(data: CreateQuoteVersionRequest) {
        // Validate input
        if (!data) throw new Error('CreateQuoteVersionRequest data is required');
        if (!data.quoteId) throw new Error('Quote ID is required');
        if (data.totalAmount === undefined || data.totalAmount < 0) throw new Error('Valid total amount is required');
        
        // Get current max version
        const { data: currentQuote } = await supabase
            .from('quotes')
            .select(`
                id,
                versions:quote_versions(version_number)
            `)
            .eq('id', data.quoteId)
            .single();

        const versions = currentQuote?.versions || [];
        const maxVersion = versions.length > 0 
            ? Math.max(...versions.map((v) => v.version_number)) 
            : 0;
        const nextVersionNumber = maxVersion + 1;

        // Get current user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Create new version
        const { data: version, error } = await supabase
            .from('quote_versions')
            .insert({
                quote_id: data.quoteId,
                version_number: nextVersionNumber,
                total_amount: data.totalAmount,
                status: 'draft',
                created_by: user.id
            })
            .select()
            .single();

        if (error) throw new Error(error.message);

        // Insert items
        if (data.items) {
            await insertQuoteItems(version.id, data.items);
        }

        // Update quote current version
        await supabase
            .from('quotes')
            .update({ current_version_id: version.id })
            .eq('id', data.quoteId);

        // Return fully mapped QuoteVersion
        return this.getQuote(data.quoteId).then(quote => {
            const createdVersion = quote.versions?.find(v => v.id === version.id);
            if (!createdVersion) {
                throw new Error('Version not found after creation');
            }
            return createdVersion;
        });
    },

    /**
     * Update a quote version (items and total amount)
     */
    async updateVersion(versionId: string, data: UpdateQuoteVersionRequest) {
        // Validate input
        if (!versionId) throw new Error('Version ID is required');
        if (!data) throw new Error('UpdateQuoteVersionRequest data is required');
        if (data.totalAmount !== undefined && data.totalAmount < 0) throw new Error('Total amount cannot be negative');
        
        // 1. Update version details
        const updateData = {
            updated_at: new Date().toISOString()
        };
        if (data.totalAmount !== undefined) updateData.total_amount = data.totalAmount;
        if (data.status) updateData.status = data.status;
        if (data.validUntil) updateData.valid_until = data.validUntil;
        if (data.remarks) updateData.remarks = data.remarks;

        const { error: versionError } = await supabase
            .from('quote_versions')
            .update(updateData)
            .eq('id', versionId);

        if (versionError) throw new Error(versionError.message);

        // 2. Update items (Delete all and re-insert for simplicity)
        if (data.items) {
            const { error: deleteError } = await supabase
                .from('quote_items')
                .delete()
                .eq('quote_version_id', versionId);
            
            if (deleteError) throw new Error(deleteError.message);

            await insertQuoteItems(versionId, data.items);
        }
    },

    /**
     * Confirm a quote version
     */
    async confirmVersion(quoteId: string, versionId: string) {
        // Validate input
        if (!quoteId) throw new Error('Quote ID is required');
        if (!versionId) throw new Error('Version ID is required');
        
        const { error } = await supabase
            .from('quote_versions')
            .update({ status: 'confirmed' })
            .eq('id', versionId);

        if (error) throw new Error(error.message);
        
        // Also update quote status to active/won based on business logic
        // For now, let's keep it simple
        await supabase
            .from('quotes')
            .update({ status: 'confirmed', current_version_id: versionId })
            .eq('id', quoteId);
    },

    /**
     * Publish a quote version
     */
    async publishVersion(_quoteId: string, versionId: string) {
        // Validate input
        if (!versionId) throw new Error('Version ID is required');
        
        const { error } = await supabase
            .from('quote_versions')
            .update({ status: 'published' })
            .eq('id', versionId);

        if (error) throw new Error(error.message);
    },

    /**
     * Update version status
     */
    async updateVersionStatus(versionId: string, status: QuoteVersionStatus) {
        // Validate input
        if (!versionId) throw new Error('Version ID is required');
        if (!status) throw new Error('Status is required');
        
        const { error } = await supabase
            .from('quote_versions')
            .update({ status })
            .eq('id', versionId);

        if (error) throw new Error(error.message);
    },

    /**
     * Convert a quote version to an order
     */
    async convertQuoteVersionToOrder(request: ConvertQuoteVersionToOrderRequest) {
        // Validate input
        if (!request) throw new Error('ConvertQuoteVersionToOrderRequest is required');
        if (!request.quoteVersionId) throw new Error('Quote version ID is required');
        if (!request.orderDate) throw new Error('Order date is required');
        
        // Get quote version with details
        const { data: quoteVersion, error: quoteVersionError } = await supabase
            .from('quote_versions')
            .select(`
                *, 
                quote:quotes(*),
                items:quote_items(*)
            `)
            .eq('id', request.quoteVersionId)
            .single();

        if (quoteVersionError) throw new Error(quoteVersionError.message);
        if (!quoteVersion) throw new Error('Quote version not found');

        // Get current user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Create order header
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                quote_id: quoteVersion.quote_id,
                quote_version_id: quoteVersion.id,
                customer_id: quoteVersion.quote.customer_id,
                lead_id: quoteVersion.quote.lead_id,
                project_name: quoteVersion.quote.project_name,
                project_address: quoteVersion.quote.project_address,
                total_amount: quoteVersion.total_amount,
                order_date: request.orderDate,
                expected_delivery_date: request.expectedDeliveryDate,
                expected_installation_date: request.expectedInstallationDate,
                salesperson_id: quoteVersion.quote.salesperson_id,
                status: 'pending',
                created_by: user.id
            })
            .select()
            .single();

        if (orderError) throw new Error(orderError.message);

        // Create order items
        if (quoteVersion.items && quoteVersion.items.length > 0) {
            const orderItems = quoteVersion.items.map(item => ({
                order_id: order.id,
                quote_item_id: item.id,
                category: item.category,
                space: item.space,
                product_name: item.product_name,
                product_id: item.product_id,
                variant_id: item.variant_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
                description: item.description,
                image_url: item.image_url,
                width: item.width,
                height: item.height,
                unit: item.unit,
                attributes: item.attributes
            }));

            const { error: orderItemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (orderItemsError) throw new Error(orderItemsError.message);
        }

        // Update quote version status to indicate it has been converted
        await this.updateVersionStatus(request.quoteVersionId, 'accepted');

        // Update quote status to won
        await supabase
            .from('quotes')
            .update({ status: 'won' })
            .eq('id', quoteVersion.quote_id);

        return order;
    }
};
