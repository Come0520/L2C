'use server'

import { createClient } from '@/lib/supabase/server';
import {
    CreateQuoteAPIDTO,
    CreateQuoteVersionAPIDTO,
    UpdateQuoteVersionAPIDTO
} from '../types';

/**
 * Generate a unique quote number (Simple implementation)
 * Format: Q-YYYYMMDD-Random
 */
const generateQuoteNo = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `Q-${date}-${random}`;
};

export const createQuote = async (data: CreateQuoteAPIDTO) => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const quoteNo = generateQuoteNo();

    // Convert camelCase to snake_case for DB
    const snakeCaseData = {
        quote_no: quoteNo,
        lead_id: data.lead_id,
        customer_id: data.customer_id,
        project_name: data.project_name,
        project_address: data.project_address,
        salesperson_id: user.id,
        status: 'draft'
    };

    // 1. Create Quote
    const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert(snakeCaseData)
        .select()
        .single();

    if (quoteError) throw new Error(`Failed to create quote: ${quoteError.message}`);

    // Convert items to snake_case
    const snakeCaseItems = data.items.map((item: any) => ({
        category: item.category,
        space: item.space,
        product_name: item.product_name,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        description: item.description,
        image_url: item.image_url,
        attributes: item.attributes
    }));

    // 2. Create Initial Version (V1)
    const totalAmount = data.items.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);
    
    const initialVersion = {
        quote_id: quote.id,
        items: snakeCaseItems,
        version_suffix: 'V1',
        total_amount: totalAmount
    };

    const version = await createVersionInternal(supabase, initialVersion, 1);

    // 3. Update Quote with current version
    await supabase
        .from('quotes')
        .update({ current_version_id: version.id })
        .eq('id', quote.id);

    return { quoteId: quote.id };
};

export const createVersion = async (dto: CreateQuoteVersionAPIDTO) => {
    const supabase = await createClient();

    // Get current max version number
    const { data: versions } = await supabase
        .from('quote_versions')
        .select('version_number')
        .eq('quote_id', dto.quote_id)
        .order('version_number', { ascending: false })
        .limit(1);

    const nextVersionNumber = (versions?.[0]?.version_number || 0) + 1;
    const version = await createVersionInternal(supabase, dto, nextVersionNumber);

    // Set as current? Usually yes for new drafts
    await supabase
        .from('quotes')
        .update({ current_version_id: version.id })
        .eq('id', dto.quote_id);

    return version;
};

const createVersionInternal = async (supabase: any, dto: CreateQuoteVersionAPIDTO, versionNumber: number) => {
    // 1. Create Version
    const { data: version, error: versionError } = await supabase
        .from('quote_versions')
        .insert({
            quote_id: dto.quote_id,
            version_number: versionNumber,
            version_suffix: dto.version_suffix || `V${versionNumber}`,
            total_amount: dto.total_amount,
            status: 'draft',
            remarks: dto.remarks
        })
        .select()
        .single();

    if (versionError) throw new Error(`Failed to create version: ${versionError.message}`);

    // 2. Create Items
    if (dto.items && dto.items.length > 0) {
        const itemsToInsert = dto.items.map((item: any) => ({
            quote_version_id: version.id,
            category: item.category,
            space: item.space,
            product_name: item.product_name,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            description: item.description,
            image_url: item.image_url,
            attributes: item.attributes
        }));

        const { error: itemsError } = await supabase
            .from('quote_items')
            .insert(itemsToInsert);

        if (itemsError) throw new Error(`Failed to create items: ${itemsError.message}`);
    }

    return version;
};

// Helper to map DB result to Quote type
const mapDbToQuote = (row: any): Quote => {
    return {
        id: row.id,
        quoteNo: row.quote_no,
        leadId: row.lead_id,
        customerId: row.customer_id,
        projectName: row.project_name,
        projectAddress: row.project_address,
        salespersonId: row.salesperson_id,
        currentVersionId: row.current_version_id,
        status: row.status as any,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        versions: row.versions?.map((v: any) => mapDbToQuoteVersion(v)),
        currentVersion: row.current_version ? mapDbToQuoteVersion(row.current_version) : undefined
    };
};

const mapDbToQuoteVersion = (row: any): QuoteVersion => {
    return {
        id: row.id,
        quoteId: row.quote_id,
        versionNumber: row.version_number,
        versionSuffix: row.version_suffix,
        quoteNo: row.quote_no || '', // Might not be in version table, but QuoteVersion type has it? Check type.
        totalAmount: row.total_amount,
        validUntil: row.valid_until,
        status: row.status as any,
        remarks: row.remarks,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        items: row.items?.map((i: any) => mapDbToQuoteItem(i)) || []
    };
};

const mapDbToQuoteItem = (row: any): any => { // Return type inferred or explicit
    return {
        id: row.id,
        quoteVersionId: row.quote_version_id,
        category: row.category,
        space: row.space,
        productName: row.product_name,
        productId: row.product_id,
        quantity: row.quantity,
        unitPrice: row.unit_price,
        totalPrice: row.total_price,
        description: row.description,
        imageUrl: row.image_url,
        attributes: row.attributes,
        createdAt: row.created_at
    };
};

export const getQuote = async (id: string): Promise<Quote | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('quotes')
        .select(`
      *,
      current_version:quote_versions!quotes_current_version_id_fkey(*),
      versions:quote_versions(
        *,
        items:quote_items(*)
      )
    `)
        .eq('id', id)
        .single();

    if (error) return null;
    return mapDbToQuote(data);
};

// ... (previous code)

export const getQuotes = async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('quotes')
        .select(`
      *,
      current_version:quote_versions!quotes_current_version_id_fkey(*)
    `)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(mapDbToQuote);
};

export const updateVersion = async (dto: UpdateQuoteVersionAPIDTO) => {
    const supabase = await createClient();

    // 1. Update Version fields
    if (dto.status || dto.remarks || dto.valid_until || dto.total_amount !== undefined) {
        const updateData: any = {};
        if (dto.status) updateData.status = dto.status;
        if (dto.remarks) updateData.remarks = dto.remarks;
        if (dto.valid_until) updateData.valid_until = dto.valid_until;
        if (dto.total_amount !== undefined) updateData.total_amount = dto.total_amount;

        const { error } = await supabase
            .from('quote_versions')
            .update(updateData)
            .eq('id', dto.version_id);

        if (error) throw new Error(error.message);
    }

    // 2. Update Items (Replace strategy for simplicity in MVP)
    if (dto.items) {
        // Delete old
        await supabase.from('quote_items').delete().eq('quote_version_id', dto.version_id);

        // Insert new
        if (dto.items.length > 0) {
            const itemsToInsert = dto.items.map((item: any) => ({
                quote_version_id: dto.version_id,
                category: item.category,
                space: item.space,
                product_name: item.product_name,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
                description: item.description,
                image_url: item.image_url,
                attributes: item.attributes
            }));

            const { error } = await supabase.from('quote_items').insert(itemsToInsert);
            if (error) throw new Error(error.message);
        }
    }
};

/**
 * Convert a confirmed quote to a sales order
 * This performs a deep copy of quote data into sales_orders and sales_order_items
 */
export const convertToOrder = async (quoteId: string) => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    // 1. Get the quote with its current version and items
    const quote = await getQuote(quoteId);
    if (!quote) {
        throw new Error('Quote not found');
    }

    const currentVersion = quote.currentVersion || quote.versions?.find(v => v.id === quote.currentVersionId);
    if (!currentVersion) {
        throw new Error('No version found for this quote');
    }

    if (currentVersion.status !== 'accepted') {
        throw new Error('Only accepted quotes can be converted to orders');
    }

    // 2. Generate sales order number
    const salesNo = `SO-${Date.now()}`;

    // 3. Create sales order
    const { data: salesOrder, error: orderError } = await supabase
        .from('sales_orders')
        .insert({
            sales_no: salesNo,
            lead_id: quote.leadId,
            customer_id: quote.customerId,
            sales_person: user.id,
            create_time: new Date().toISOString().split('T')[0],
            status: 'draft',
            source_quote_id: quoteId
        })
        .select()
        .single();

    if (orderError) throw new Error(`Failed to create sales order: ${orderError.message}`);

    // 4. Copy quote items to sales order items
    if (currentVersion.items && currentVersion.items.length > 0) {
        const itemsToInsert = currentVersion.items.map(item => ({
            sales_order_id: salesOrder.id,
            category: item.category,
            space: item.space,
            product_name: item.product_name,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            description: item.description
        }));

        const { error: itemsError } = await supabase
            .from('sales_order_items')
            .insert(itemsToInsert);

        if (itemsError) throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    // 5. Update quote status to 'won'
    await supabase
        .from('quotes')
        .update({ status: 'won' })
        .eq('id', quoteId);

    return { salesOrderId: salesOrder.id, salesNo: salesOrder.sales_no };
};
