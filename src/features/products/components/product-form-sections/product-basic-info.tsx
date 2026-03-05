import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import X from 'lucide-react/dist/esm/icons/x';
import { STYLE_OPTIONS } from '../../hooks/use-product-form';
import { UseFormReturn } from 'react-hook-form';
import { ProductFormValues } from '../../hooks/use-product-form';

interface ProductBasicInfoProps {
  form: UseFormReturn<ProductFormValues>;
  hidePurchaseType: boolean;
  styleInput: string;
  setStyleInput: (val: string) => void;
  currentStyles: string[];
  addStyle: (style: string) => void;
  removeStyle: (style: string) => void;
}

export function ProductBasicInfo({
  form,
  hidePurchaseType,
  styleInput,
  setStyleInput,
  currentStyles,
  addStyle,
  removeStyle,
}: ProductBasicInfoProps) {
  return (
    <section className="space-y-4">
      <h3 className="border-primary border-l-4 pl-2 text-sm font-semibold">基础信息</h3>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>产品名称</FormLabel>
              <FormControl>
                <Input placeholder="输入产品名称" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU / 型号</FormLabel>
              <FormControl>
                <Input placeholder="输入型号" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>计价单位</FormLabel>
              <FormControl>
                <Input placeholder="如：米、卷、件" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* 窗帘系列 + 墙布 Tab 已隐含采购类型 */}
        {!hidePurchaseType && (
          <FormField
            control={form.control}
            name="productType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>采购类型</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || 'FINISHED'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择采购类型" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="FINISHED">成品采购</SelectItem>
                    <SelectItem value="CUSTOM">原材料采购</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  决定转采购单时是直接购买成品还是发到加工厂二次加工
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>产品描述</FormLabel>
            <FormControl>
              <Textarea placeholder="输入产品描述" rows={2} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 风格标签（所有品类通用） */}
      <div className="space-y-2">
        <FormLabel>风格</FormLabel>
        {/* 已选风格 Badge */}
        {currentStyles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {currentStyles.map((s) => (
              <Badge key={s} variant="secondary" className="gap-1">
                {s}
                <button
                  type="button"
                  className="hover:text-destructive ml-0.5"
                  onClick={() => removeStyle(s)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        {/* 预设风格快捷按钮 */}
        <div className="flex flex-wrap gap-1.5">
          {STYLE_OPTIONS.map((opt) => {
            const isSelected = currentStyles.includes(opt);
            return (
              <Button
                key={opt}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  if (isSelected) {
                    removeStyle(opt);
                  } else {
                    addStyle(opt);
                  }
                }}
              >
                {isSelected ? opt : `+ ${opt}`}
              </Button>
            );
          })}
        </div>
        {/* 自定义风格输入 */}
        <div className="flex gap-2">
          <Input
            placeholder="自定义风格"
            value={styleInput}
            onChange={(e) => setStyleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && styleInput.trim()) {
                e.preventDefault();
                addStyle(styleInput);
                setStyleInput('');
              }
            }}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (styleInput.trim()) {
                addStyle(styleInput);
                setStyleInput('');
              }
            }}
          >
            添加
          </Button>
        </div>
      </div>
    </section>
  );
}
