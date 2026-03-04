import { ProductsClient } from './products-client';
import { getProducts } from '@/features/products/actions/queries';
import { Product } from '@/features/products/types';

export default async function ProductsPage() {
  const result = await getProducts({ page: 1, pageSize: 50 });
  const initialData = (result.data?.data || []) as unknown as Product[];

  return <ProductsClient initialData={initialData} />;
}
