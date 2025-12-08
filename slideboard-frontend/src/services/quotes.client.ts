import { createClient } from '@/lib/supabase/client';

export interface QuoteItem {
    id: string
    quoteId: string
    versionId?: string // Optional in DB for now, but good to keep in type
    category: string
    space: string
    productName: string
    productId?: string
    variantId?: string
    quantity: number
    unitPrice: number
    totalPrice: number
    description?: string
    imageUrl?: string
    width?: number
    height?: number
    unit?: string
}

export interface QuoteVersion {
    id: string
    quoteId: string
    version: number
    quoteNo: string
    totalAmount: number
    status: 'draft' | 'published' | 'confirmed' | 'expired' | 'cancelled'
    validUntil?: string
    items: QuoteItem[]
    createdAt: string
    updatedAt: string
}

export interface Quote {
    id: string
    leadId: string
    customerId?: string
    projectName: string
    projectAddress: string
    salesPerson: string
    status: 'draft' | 'active' | 'confirmed' | 'closed'
    versions: QuoteVersion[]
    currentVersion?: QuoteVersion
    createdAt: string
    updatedAt: string
    type: 'budget' | 'formal'
}

/**
 * Derive quote status from its versions
 */
const deriveQuoteStatus = (versions: QuoteVersion[]): Quote['status'] => {
    if (!versions || versions.length === 0) {
        return 'draft';
    }

    // Sort versions by version number (descending)
    const sortedVersions = [...versions].sort((a, b) => b.version - a.version);
    const latestVersion = sortedVersions[0] as QuoteVersion; // Type assertion since we checked versions.length > 0
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
    
    if (latestVersionStatus === 'published') {
        return 'active';
    }
    
    if (allExpiredOrCancelled) {
        return 'closed';
    }
    
    return 'draft';
};

export const quoteService = {
    /**
     * Create a new quote (budget quote)
     */
    async createBudgetQuote(leadId: string, data: Partial<Quote> & { items?: Partial<QuoteItem>[] }) {
        const supabase = createClient();

        // Get current user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // 1. Create Quote
        const { data: quote, error: quoteError } = await supabase
            .from('quotes')
            .insert({
                lead_id: leadId,
                project_name: data.projectName,
                project_address: data.projectAddress,
                type: 'budget',
                customer_id: data.customerId,
                salesperson_id: user.id
            })
            .select()
            .single();

        if (quoteError) throw new Error(quoteError.message);

        // 2. Create Initial Version
        const { data: version, error: versionError } = await supabase
            .from('quote_versions')
            .insert({
                quote_id: quote.id,
                version: 1,
                quote_no: `Q${Date.now()}`, // Simple generation for now
                total_amount: data.items ? data.items.reduce((sum, i) => sum + (i.totalPrice || 0), 0) : 0,
                status: 'draft'
            })
            .select()
            .single();

        if (versionError) throw new Error(versionError.message);

        // 3. Insert items if any
        if (data.items && data.items.length > 0) {
            const itemsToInsert = data.items.map(item => ({
                quote_version_id: version.id,
                category: item.category || 'standard',
                space: item.space || 'default',
                product_name: item.productName,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                total_price: item.totalPrice,
                description: item.description,
            }));

            const { error: itemsError } = await supabase
                .from('quote_items')
                .insert(itemsToInsert);
            
            if (itemsError) throw new Error(itemsError.message);
        }

        return { ...quote, currentVersion: version };
    },

    /**
     * Get quotes for a lead
     */
    async getQuotesByLead(leadId: string) {
        return this.getQuotes({ leadId });
    },

    /**
     * Get quotes with filters
     */
    async getQuotes(filters: { leadId?: string, customerId?: string, status?: string } = {}) {
        const supabase = createClient();
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

        const { data, error } = await query;

        if (error) throw new Error(error.message);

        return data.map(q => {
            // Transform versions
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const transformedVersions = (q.versions as unknown as any[]).map((v: any) => ({
                id: v.id,
                quoteId: v.quote_id,
                version: v.version,
                quoteNo: v.quote_no,
                totalAmount: v.total_amount,
                status: v.status,
                validUntil: v.valid_until,
                items: v.items.map((i: any) => ({
                    id: i.id,
                    quoteId: i.quote_id,
                    category: i.category,
                    space: i.space,
                    productName: i.product_name,
                    productId: i.product_id,
                    variantId: i.variant_id,
                    quantity: i.quantity,
                    unitPrice: i.unit_price,
                    totalPrice: i.total_price,
                    description: i.description,
                    imageUrl: i.image_url,
                    width: i.width,
                    height: i.height,
                    unit: i.unit
                })),
                createdAt: v.created_at,
                updatedAt: v.updated_at
            }));

            // Derive quote status from versions
            const quoteStatus = deriveQuoteStatus(transformedVersions);

            return {
            id: q.id,
            leadId: q.lead_id,
            customerId: q.customer_id,
            customerName: q.customer_name,
            projectName: q.project_name,
            projectAddress: q.project_address,
            salesPerson: q.salesperson_name || '',
            salespersonId: q.salesperson_id,
            salespersonName: q.salesperson_name,
            status: quoteStatus,
            versions: transformedVersions,
            currentVersion: q.current_version ? transformedVersions.find((v: QuoteVersion) => v.version === q.current_version) : transformedVersions[0],
            createdAt: q.created_at,
            updatedAt: q.updated_at,
            type: q.type
            };
        });
    },

    /**
     * Get quote detail
     */
    async getQuote(id: string) {
        const supabase = createClient();
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

        // Transform to frontend model
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const versions = (data.versions as unknown as any[]).map((v: any) => ({
            id: v.id,
            quoteId: v.quote_id,
            version: v.version,
            quoteNo: v.quote_no,
            totalAmount: v.total_amount,
            status: v.status,
            validUntil: v.valid_until,
            items: v.items.map((i: any) => ({
                id: i.id,
                quoteId: i.quote_id, // Note: quote_items links to quote_id in schema, but logically belongs to version? 
                category: i.category,
                space: i.space,
                productName: i.product_name,
                productId: i.product_id,
                variantId: i.variant_id,
                quantity: i.quantity,
                unitPrice: i.unit_price,
                totalPrice: i.total_price,
                description: i.description,
                imageUrl: i.image_url,
                width: i.width,
                height: i.height,
                unit: i.unit
            })),
            createdAt: v.created_at,
            updatedAt: v.updated_at
        }));

        // Derive quote status from versions
        const quoteStatus = deriveQuoteStatus(versions);

        return {
            id: data.id,
            leadId: data.lead_id,
            customerId: data.customer_id,
            customerName: data.customer_name,
            projectName: data.project_name,
            projectAddress: data.project_address,
            salesPerson: data.salesperson_name || '',
            salespersonId: data.salesperson_id,
            salespersonName: data.salesperson_name,
            status: quoteStatus,
            versions: versions,
            currentVersion: versions.find((v: any) => v.version === data.current_version) || versions[0],
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            type: data.type
        };
    },

    /**
     * Create a new version for a quote
     */
    async createVersion(quoteId: string, data: Partial<QuoteVersion>) {
        const supabase = createClient();

        // Get current max version
        const { data: currentQuote } = await supabase
            .from('quotes')
            .select('current_version')
            .eq('id', quoteId)
            .single();

        const nextVersion = (currentQuote?.current_version || 0) + 1;

        const { data: version, error } = await supabase
            .from('quote_versions')
            .insert({
                quote_id: quoteId,
                version: nextVersion,
                quote_no: data.quoteNo,
                total_amount: data.totalAmount,
                status: 'draft'
            })
            .select()
            .single();

        if (error) throw new Error(error.message);

        // Insert items
        if (data.items && data.items.length > 0) {
            const itemsToInsert = data.items.map(item => ({
                quote_version_id: version.id,
                category: item.category || 'standard',
                space: item.space || 'default',
                product_name: item.productName,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                total_price: item.totalPrice,
                description: item.description,
            }));

            const { error: itemsError } = await supabase
                .from('quote_items')
                .insert(itemsToInsert);
            
            if (itemsError) throw new Error(itemsError.message);
        }

        // Update quote current version
        await supabase.from('quotes').update({ current_version: nextVersion }).eq('id', quoteId);

        return version;
    },

    /**
     * Update a quote version (items and total amount)
     */
    async updateVersion(versionId: string, data: { items: Partial<QuoteItem>[], totalAmount: number }) {
        const supabase = createClient();
        
        // 1. Update version details
        const { error: versionError } = await supabase
            .from('quote_versions')
            .update({
                total_amount: data.totalAmount,
                updated_at: new Date().toISOString()
            })
            .eq('id', versionId);

        if (versionError) throw new Error(versionError.message);

        // 2. Update items (Delete all and re-insert for simplicity)
        const { error: deleteError } = await supabase
            .from('quote_items')
            .delete()
            .eq('quote_version_id', versionId);
            
        if (deleteError) throw new Error(deleteError.message);

        // Insert new items
        if (data.items && data.items.length > 0) {
            const itemsToInsert = data.items.map(item => ({
                quote_version_id: versionId,
                category: item.category || 'standard',
                space: item.space || 'default',
                product_name: item.productName,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                total_price: item.totalPrice,
                description: item.description,
            }));

            const { error: insertError } = await supabase
                .from('quote_items')
                .insert(itemsToInsert);

            if (insertError) throw new Error(insertError.message);
        }
    },

    /**
     * Confirm a quote version
     */
    async confirmVersion(_quoteId: string, versionId: string) {
        const supabase = createClient();
        const { error } = await supabase
            .from('quote_versions')
            .update({ status: 'confirmed' })
            .eq('id', versionId);

        if (error) throw new Error(error.message);
    },

    /**
     * Publish a quote version
     */
    async publishVersion(_quoteId: string, versionId: string) {
        const supabase = createClient();
        const { error } = await supabase
            .from('quote_versions')
            .update({ status: 'published' })
            .eq('id', versionId);

        if (error) throw new Error(error.message);
    },

    /**
     * Update version status
     */
    async updateVersionStatus(versionId: string, status: string) {
        const supabase = createClient();
        const { error } = await supabase
            .from('quote_versions')
            .update({ status })
            .eq('id', versionId);

        if (error) throw new Error(error.message);
    }
}
