import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form';
import { Switch } from '@/shared/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { ProductFormValues } from '../../hooks/use-product-form';

interface MinimalSupplier {
  id: string;
  name: string;
  contactName?: string | null;
}

interface ProductSupplyAndInventoryProps {
  form: UseFormReturn<ProductFormValues>;
  suppliers: MinimalSupplier[];
}

export function ProductSupplyAndInventory({ form, suppliers }: ProductSupplyAndInventoryProps) {
  return (
    <section className="space-y-4">
      <h3 className="border-l-4 border-purple-500 pl-2 text-sm font-semibold">供应链与库存</h3>
      <div className="grid grid-cols-2 gap-4">
        {/* 供应商选择 */}
        <FormField
          control={form.control}
          name="defaultSupplierId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>默认供应商 (可选)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || undefined}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="选择供应商" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none" className="text-muted-foreground italic">
                    无默认供应商
                  </SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.contactName ? `(${s.contactName})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* 是否可囤货 */}
        <FormField
          control={form.control}
          name="isStockable"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 pt-4 pb-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>允许库存备货</FormLabel>
                <FormDescription>标记该产品是否为主力款式且支持囤货</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </section>
  );
}
