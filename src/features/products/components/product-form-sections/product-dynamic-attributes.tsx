import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { ProductFormValues } from '../../hooks/use-product-form';

/**
 * 动态属性字段定义（与 attribute-template-manager.tsx / templates.ts 中保持一致）
 */
interface AttributeField {
  key: string;
  label: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'SELECT' | 'RANGE' | 'TEXTAREA';
  required?: boolean;
  options?: string[];
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  maxLength?: number;
  description?: string;
}

interface ProductDynamicAttributesProps {
  form: UseFormReturn<ProductFormValues>;
  dynamicAttributes: AttributeField[] | undefined;
}

export function ProductDynamicAttributes({
  form,
  dynamicAttributes,
}: ProductDynamicAttributesProps) {
  if (!dynamicAttributes || dynamicAttributes.length === 0) return null;

  return (
    <section className="space-y-4">
      <h3 className="border-l-4 border-indigo-500 pl-2 text-sm font-semibold">扩展属性</h3>
      <div className="grid grid-cols-2 gap-4">
        {dynamicAttributes.map((attr) => (
          <FormField
            key={attr.key}
            control={form.control}
            name={`attributes.${attr.key}` as 'attributes'}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {attr.label}
                  {attr.required && <span className="text-destructive ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    type={attr.type === 'NUMBER' ? 'number' : 'text'}
                    placeholder={`输入${attr.label}`}
                    {...field}
                    value={(field.value as unknown as string | number) || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (attr.type === 'NUMBER') {
                        field.onChange(val === '' ? undefined : Number(val));
                      } else {
                        field.onChange(val);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    </section>
  );
}
