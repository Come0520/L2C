import { createClient } from '@/lib/supabase/server'
import { OrderFormData, CurtainItem, WallcoveringItem, BackgroundWallItem, WindowCushionItem, StandardProductItem } from '@/shared/types/order'
import { fromDbFields } from '@/utils/db-mapping'

export async function getSalesOrders(page: number = 1, pageSize: number = 10, status?: string): Promise<{ orders: OrderFormData[], total: number }> {
    const supabase = await createClient()
    
    let query = supabase
        .from('orders')
        .select(`
            id, status, customer_id, sales_id,
            total_amount, created_at, updated_at,
            customer:users!customer_id(name, phone), 
            sales:users!sales_id(name)
        `, { count: 'exact' })

    if (status) {
        query = query.eq('status', status)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    
    const { data, count, error } = await query
        .range(from, to)
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(error.message)
    }

    const orders = (data || []).map((item: typeof data[0]) => mapDbToSalesOrder(item))
    return { orders, total: count || 0 }
}

export async function getSalesOrderById(id: string): Promise<OrderFormData | null> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
        .from('orders')
        .select(`
            id, status, total_amount, created_at, updated_at, customer_id, sales_id,
            customer:users!customer_id(name, phone), 
            sales:users!sales_id(name), 
            items:order_items(id, order_id, product_id, quantity, unit_price)
        `)
        .eq('id', id)
        .single()

    if (error || !data) {
        if (error && error.code === 'PGRST116') return null
        throw new Error(error?.message || 'Failed to fetch order')
    }

    return mapDbToSalesOrder(data)
}

export async function getSalesUsers(): Promise<Array<{ id: string; name: string }>> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .in('role', ['sales', 'sales_manager', 'admin']) 
        .order('name')
    
    if (error) {
        console.error('Error fetching sales users:', error)
        return []
    }
    
    return (data as any[] || []).map(u => ({
        id: String(u.id),
        name: u.name || 'Unknown'
    }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbToSalesOrder(dbRecord: Record<string, any>): OrderFormData {
    const base = fromDbFields<OrderFormData>(dbRecord)

    // Ensure items is an array
    const rawItems = Array.isArray(dbRecord.items) ? dbRecord.items : []
    
    // Map items using fromDbFields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = rawItems.map((item: Record<string, any>) => 
        fromDbFields<CurtainItem>(item)
    )

    // Split items by category
    // We cast to any to access 'category' because CurtainItem type might not strictly have it 
    // (though it comes from DB)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const curtains = items.filter((i: any) => i.category === 'curtain') as CurtainItem[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wallcoverings = items.filter((i: any) => i.category === 'wallcovering') as WallcoveringItem[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const backgroundWalls = items.filter((i: any) => i.category === 'background-wall') as BackgroundWallItem[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const windowCushions = items.filter((i: any) => i.category === 'window-cushion') as WindowCushionItem[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const standardProducts = items.filter((i: any) => i.category === 'standard-product') as StandardProductItem[]

    // Construct the full OrderFormData
    return {
        ...base,
        leadId: base.leadId || '',
        leadNumber: base.leadNumber || '',
        
        items,
        curtains,
        wallcoverings,
        backgroundWalls,
        windowCushions,
        standardProducts,

        spacePackages: base.spacePackages || {},
        subtotals: base.subtotals || {
            curtain: 0,
            wallcovering: 0,
            'background-wall': 0,
            'window-cushion': 0,
            'standard-product': 0
        },
        packageUsage: base.packageUsage || { cloth: 0, gauze: 0, track: 0 },
        packageAmount: base.packageAmount || 0,
        packageExcessAmount: base.packageExcessAmount || 0,
        upgradeAmount: base.upgradeAmount || 0,
        totalAmount: base.totalAmount || 0
    }
}
