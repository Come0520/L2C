import { ProductCard } from './product-card';

interface ProductGridProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEdit: (product: any) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
}

export function ProductGrid({ data, onEdit, onToggleStatus, onDelete }: ProductGridProps) {
  if (data.length === 0) {
    return (
      <div className="bg-muted/20 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12">
        <div className="text-muted-foreground text-center">
          <p className="text-lg font-medium">暂无产品</p>
          <p className="text-sm">尝试调整筛选条件或添加新产品</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {data.map((item) => (
        <ProductCard
          key={item.id}
          item={item}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
