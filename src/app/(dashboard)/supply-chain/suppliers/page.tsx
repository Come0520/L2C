import { SuppliersClient } from './suppliers-client';
import { getSuppliers } from '@/features/supply-chain/actions/supplier-actions';

export default async function SuppliersPage() {
  const result = await getSuppliers({ page: 1, pageSize: 100 });
  const initialData = result.data?.data || [];

  return <SuppliersClient initialData={initialData} />;
}
