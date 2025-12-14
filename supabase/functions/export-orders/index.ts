// Export Orders Edge Function
// Supports CSV, Excel, and PDF formats

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { orderIds, format, includeFields, fileName } = await req.json()

        // Validate inputs
        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            throw new Error('Invalid orderIds')
        }

        const validFormats = ['csv', 'excel', 'pdf']
        if (!validFormats.includes(format)) {
            throw new Error('Invalid format. Must be csv, excel, or pdf')
        }

        // Create Supabase client with service role (bypasses RLS for testing)
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        )

        // Fetch orders data with basic fields only
        const { data: orders, error } = await supabaseClient
            .from('orders')
            .select(`
        id,
        order_number,
        customer_name,
        customer_phone,
        customer_address,
        status,
        total_amount,
        created_at,
        updated_at
      `)
            .in('id', orderIds)

        if (error) throw error
        if (!orders || orders.length === 0) {
            throw new Error('No orders found')
        }

        // Generate export file based on format
        let fileContent: Uint8Array | string
        let contentType: string
        let fileExtension: string

        if (format === 'csv') {
            fileContent = generateCSV(orders, includeFields)
            contentType = 'text/csv; charset=utf-8'
            fileExtension = 'csv'
        } else if (format === 'excel') {
            // For now, use CSV as placeholder for Excel
            // In production, use a library like xlsx
            fileContent = generateCSV(orders, includeFields)
            contentType = 'text/csv; charset=utf-8'
            fileExtension = 'csv'
        } else {
            // PDF format - placeholder
            fileContent = `PDF export not implemented yet. Order count: ${orders.length}`
            contentType = 'text/plain'
            fileExtension = 'txt'
        }

        // Upload to Storage
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const defaultFileName = `orders_export_${timestamp}.${fileExtension}`
        const filePath = `exports/${fileName || defaultFileName}`

        const { error: uploadError } = await supabaseClient.storage
            .from('order-exports')
            .upload(filePath, fileContent, {
                contentType,
                upsert: true,
            })

        if (uploadError) throw uploadError

        // Generate signed URL (valid for 1 hour)
        const { data: urlData, error: urlError } = await supabaseClient.storage
            .from('order-exports')
            .createSignedUrl(filePath, 3600)

        if (urlError) throw urlError

        return new Response(
            JSON.stringify({
                success: true,
                url: urlData.signedUrl,
                fileName: fileName || defaultFileName,
                recordCount: orders.length,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Export error:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})

// Generate CSV content
function generateCSV(orders: any[], includeFields?: string[]): string {
    const defaultFields = [
        'order_number',
        'customer_name',
        'customer_phone',
        'customer_address',
        'status',
        'total_amount',
        'created_at',
        'updated_at',
    ]

    const fields = includeFields && includeFields.length > 0 ? includeFields : defaultFields

    // CSV headers
    const headers = fields.map(field => {
        const headerMap: Record<string, string> = {
            order_number: '订单编号',
            customer_name: '客户姓名',
            customer_phone: '客户电话',
            customer_address: '客户地址',
            status: '订单状态',
            total_amount: '订单金额',
            created_at: '创建时间',
            updated_at: '更新时间',
        }
        return headerMap[field] || field
    })

    // CSV rows
    const rows = orders.map(order => {
        return fields.map(field => {
            let value: any

            switch (field) {
                case 'created_at':
                case 'updated_at':
                    value = order[field] ? new Date(order[field]).toLocaleString('zh-CN') : ''
                    break
                case 'total_amount':
                    value = order[field] ? `¥${order[field].toFixed(2)}` : '¥0.00'
                    break
                default:
                    value = order[field] || ''
            }

            // Escape CSV special characters
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                value = `"${value.replace(/"/g, '""')}"`
            }

            return value
        })
    })

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
    ].join('\n')

    // Add BOM for Excel UTF-8 compatibility
    return '\uFEFF' + csvContent
}

/* Edge Function deployed at: https://<project>.supabase.co/functions/v1/export-orders */
