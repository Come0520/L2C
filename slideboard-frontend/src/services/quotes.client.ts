import { supabase } from '@/lib/supabase/client';
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
import { Database } from '@/shared/types/supabase';

type QuoteRow = Database['public']['Tables']['quotes']['Row'];
type QuoteVersionRow = Database['public']['Tables']['quote_versions']['Row'];
type QuoteItemRow = Database['public']['Tables']['quote_items']['Row'];

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

// Map DB Row to Frontend Type
function mapDbToQuoteItem(row: QuoteItemRow): QuoteItem {
    return {
        id: row.id,
        quoteVersionId: row.quote_version_id,
        category: row.category,
        space: row.space,
        productName: row.product_name,
        productId: row.product_id || undefined,
        quantity: row.quantity || 0,
        unitPrice: row.unit_price || 0,
        totalPrice: row.total_price || 0,
        description: row.description || undefined,
        imageUrl: row.image_url || undefined,
        attributes: (row.attributes as Record<string, any>) || undefined,
        createdAt: row.created_at
    };
}

function mapDbToQuoteVersion(row: QuoteVersionRow & { items?: QuoteItemRow[] }): QuoteVersion {
    return {
        id: row.id,
        quoteId: row.quote_id,
        versionNumber: row.version_number,
        versionSuffix: row.version_suffix || undefined,
        quoteNo: row.quote_id, // TODO: Fix quote_no mapping if it exists on version level
        totalAmount: row.total_amount,
        status: row.status as QuoteVersionStatus,
        validUntil: row.valid_until || undefined,
        remarks: row.remarks || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        items: row.items ? row.items.map(mapDbToQuoteItem) : []
    };
}

function mapDbToQuote(row: QuoteRow & { versions?: (QuoteVersionRow & { items?: QuoteItemRow[] })[], current_version?: QuoteVersionRow }): Quote {
    const versions = row.versions ? row.versions.map(mapDbToQuoteVersion) : [];
    
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

export const quoteService = {
    /**
     * Create a new quote (budget quote)
     */
    async createBudgetQuote(data: CreateQuoteRequest) {
        // Get current user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // 1. Create Quote Header
        const { data: quote, error: quoteError } = await supabase
            .from('quotes')
            .insert({
                lead_id: data.leadId,
                customer_id: data.customerId,
                project_name: data.projectName,
                project_address: data.projectAddress,
                salesperson_id: user.id,
                quote_no: `Q${Date.now()}`, // Temporary ID generation
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
                product_id: item.productId,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                total_price: item.totalPrice,
                description: item.description,
                image_url: item.imageUrl,
                attributes: item.attributes as any // Cast for JSONB
            }));

            const { error: itemsError } = await supabase
                .from('quote_items')
                .insert(itemsToInsert);
            
            if (itemsError) throw new Error(itemsError.message);
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

        const { data, error } = await query;

        if (error) throw new Error(error.message);

        return (data || []).map(row => mapDbToQuote(row as any));
    },

    /**
     * Get quote detail
     */
    async getQuote(id: string) {
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

        return mapDbToQuote(data as any);
    },

    /**
     * Create a new version for a quote
     */
    async createVersion(data: CreateQuoteVersionRequest) {
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
            ? Math.max(...versions.map((v: any) => v.version_number)) 
            : 0;
        const nextVersionNumber = maxVersion + 1;

        // Create new version
        const { data: version, error } = await supabase
            .from('quote_versions')
            .insert({
                quote_id: data.quoteId,
                version_number: nextVersionNumber,
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
                product_id: item.productId,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                total_price: item.totalPrice,
                description: item.description,
                image_url: item.imageUrl,
                attributes: item.attributes as any
            }));

            const { error: itemsError } = await supabase
                .from('quote_items')
                .insert(itemsToInsert);
            
            if (itemsError) throw new Error(itemsError.message);
        }

        // Update quote current version
        await supabase
            .from('quotes')
            .update({ current_version_id: version.id })
            .eq('id', data.quoteId);

        return version;
    },

    /**
     * Update a quote version (items and total amount)
     */
    async updateVersion(versionId: string, data: UpdateQuoteVersionRequest) {
        // 1. Update version details
        const updateData: any = {
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

            if (data.items.length > 0) {
                const itemsToInsert = data.items.map(item => ({
                    quote_version_id: versionId,
                    category: item.category || 'standard',
                    space: item.space || 'default',
                    product_name: item.productName,
                    product_id: item.productId,
                    quantity: item.quantity,
                    unit_price: item.unitPrice,
                    total_price: item.totalPrice,
                    description: item.description,
                    image_url: item.imageUrl,
                    attributes: item.attributes as any
                }));

                const { error: insertError } = await supabase
                    .from('quote_items')
                    .insert(itemsToInsert);

                if (insertError) throw new Error(insertError.message);
            }
        }
    },

    /**
     * Confirm a quote version
     */
    async confirmVersion(quoteId: string, versionId: string) {
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
    async publishVersion(quoteId: string, versionId: string) {
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
        const { error } = await supabase
            .from('quote_versions')
            .update({ status })
            .eq('id', versionId);

        if (error) throw new Error(error.message);
    }
};
