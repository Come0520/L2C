import { createClient } from '@/lib/supabase/server'
import { Database } from '@/shared/types/supabase'

type CustomerRow = Database['public']['Tables']['customers']['Row']

export interface Customer {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  level: 'A' | 'B' | 'C' | 'D';
  status: 'active' | 'inactive' | 'potential';
  totalAmount: number;
  orderCount: number;
  lastOrderDate: string;
  createdAt: string;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  potentialCustomers: number;
  totalAmount: number;
}

export async function getAllCustomers(
  page: number = 1,
  pageSize: number = 10,
  searchTerm?: string
): Promise<{ customers: Customer[]; total: number }> {
  const supabase = await createClient()
  
  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (searchTerm) {
    query = query.or(`name.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  
  const { data, count, error } = await query
    .range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  return {
    customers: (data || []).map(mapDbToCustomer),
    total: count || 0
  }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }

  return mapDbToCustomer(data)
}

export async function getCustomerStats(): Promise<CustomerStats> {
  const supabase = await createClient()
  
  // 获取总客户数
  const { count: totalCount, error: totalError } = await supabase
    .from('customers')
    .select('id', { count: 'exact' })

  // 获取活跃客户数
  const { count: activeCount, error: activeError } = await supabase
    .from('customers')
    .select('id', { count: 'exact' })
    .eq('status', 'active')

  // 获取潜在客户数
  const { count: potentialCount, error: potentialError } = await supabase
    .from('customers')
    .select('id', { count: 'exact' })
    .eq('status', 'potential')

  // 获取总交易额
  const { data: totalAmountData, error: totalAmountError } = await supabase
    .from('customers')
    .select('total_amount')
    .single()

  if (totalError || activeError || potentialError || totalAmountError) {
    const errors = [totalError, activeError, potentialError, totalAmountError].filter(Boolean)
    throw new Error(errors.map(e => (e as Error).message).join(', '))
  }

  return {
    totalCustomers: totalCount || 0,
    activeCustomers: activeCount || 0,
    potentialCustomers: potentialCount || 0,
    totalAmount: totalAmountData?.total_amount || 0
  }
}

function mapDbToCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    company: row.company || '',
    phone: row.phone,
    email: row.email,
    address: row.address || '',
    level: (row.level as 'A' | 'B' | 'C' | 'D') || 'D',
    status: (row.status as 'active' | 'inactive' | 'potential') || 'inactive',
    totalAmount: row.total_amount || 0,
    orderCount: row.order_count || 0,
    lastOrderDate: row.last_order_date || '',
    createdAt: row.created_at
  }
}