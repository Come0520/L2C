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
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import X from 'lucide-react/dist/esm/icons/x';
import { UseFormReturn } from 'react-hook-form';
import { ProductFormValues } from '../../hooks/use-product-form';
import {
  CURTAIN_PATTERN_OPTIONS,
  FABRIC_WIDTH_VALUES,
  WALLPAPER_ROLL_LENGTH_VALUES,
  WALLPAPER_WIDTH_VALUES,
} from '../../hooks/use-product-form';

interface ProductCategorySpecsProps {
  form: UseFormReturn<ProductFormValues>;
  hasCurtainSpecs: boolean;
  isWallcloth: boolean;
  isWallpaper: boolean;
  currentPatterns: string[];
  addPattern: (pattern: string) => void;
  removePattern: (pattern: string) => void;
  patternInput: string;
  setPatternInput: (val: string) => void;
}

export function ProductCategorySpecs({
  form,
  hasCurtainSpecs,
  isWallcloth,
  isWallpaper,
  currentPatterns,
  addPattern,
  removePattern,
  patternInput,
  setPatternInput,
}: ProductCategorySpecsProps) {
  return (
    <>
      {/* ==================== 窗帘专属规格 ==================== */}
      {hasCurtainSpecs && (
        <section className="space-y-4">
          <h3 className="border-l-4 border-amber-500 pl-2 text-sm font-semibold">窗帘规格</h3>
          {/* 幅宽 */}
          <div className="space-y-2">
            <FormLabel>幅宽</FormLabel>
            <div className="flex items-center gap-2">
              <FormField
                control={form.control}
                name="attributes.fabricWidthType"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={(field.value as string) || 'WIDTH'}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WIDTH">定宽</SelectItem>
                      <SelectItem value="HEIGHT">定高</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FormField
                control={form.control}
                name="attributes.fabricWidthValue"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value?.toString()}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="选择幅宽" />
                    </SelectTrigger>
                    <SelectContent>
                      {FABRIC_WIDTH_VALUES.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v} cm
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <span className="text-muted-foreground text-sm">
                {form.watch('attributes.fabricWidthType') === 'HEIGHT' ? 'H' : 'W'}
                {(form.watch('attributes.fabricWidthValue') as string | number) || '—'}
              </span>
            </div>
            <FormDescription>如 W280 表示定宽面料，宽幅 280cm</FormDescription>
          </div>

          {/* 纹样 */}
          <div className="space-y-2">
            <FormLabel>纹样</FormLabel>
            <div className="flex min-h-[32px] flex-wrap gap-1.5">
              {currentPatterns.map((p) => (
                <Badge key={p} variant="secondary" className="gap-1 text-xs">
                  {p}
                  <button
                    type="button"
                    onClick={() => removePattern(p)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="mb-2 flex flex-wrap gap-1">
              {CURTAIN_PATTERN_OPTIONS.filter((o) => !currentPatterns.includes(o)).map((o) => (
                <Badge
                  key={o}
                  variant="outline"
                  className="hover:bg-primary/10 cursor-pointer text-xs"
                  onClick={() => addPattern(o)}
                >
                  + {o}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="自定义纹样"
                className="h-8 text-sm"
                value={patternInput}
                onChange={(e) => setPatternInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addPattern(patternInput);
                    setPatternInput('');
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => {
                  addPattern(patternInput);
                  setPatternInput('');
                }}
              >
                添加
              </Button>
            </div>
          </div>

          {/* 材质 */}
          <FormField
            control={form.control}
            name="attributes.material"
            render={({ field }) => (
              <FormItem>
                <FormLabel>材质</FormLabel>
                <FormControl>
                  <Input
                    placeholder="如：涤纶、棉麻、雪尼尔"
                    {...field}
                    value={(field.value as string) || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>
      )}

      {/* ==================== 墙布专属规格 ==================== */}
      {isWallcloth && (
        <section className="space-y-4">
          <h3 className="border-l-4 border-amber-500 pl-2 text-sm font-semibold">墙布规格</h3>
          <div className="space-y-2">
            <FormLabel>幅宽</FormLabel>
            <div className="flex items-center gap-2">
              <FormField
                control={form.control}
                name="attributes.fabricWidthType"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={(field.value as string) || 'WIDTH'}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WIDTH">定宽</SelectItem>
                      <SelectItem value="HEIGHT">定高</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FormField
                control={form.control}
                name="attributes.fabricWidthValue"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value?.toString()}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="选择幅宽" />
                    </SelectTrigger>
                    <SelectContent>
                      {FABRIC_WIDTH_VALUES.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v} cm
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <span className="text-muted-foreground text-sm">
                {form.watch('attributes.fabricWidthType') === 'HEIGHT' ? 'H' : 'W'}
                {(form.watch('attributes.fabricWidthValue') as string | number) || '—'}
              </span>
            </div>
            <FormDescription>如 W280 表示定宽面料，宽幅 280cm</FormDescription>
          </div>
        </section>
      )}

      {/* ==================== 墙纸专属规格 ==================== */}
      {isWallpaper && (
        <section className="space-y-4">
          <h3 className="border-l-4 border-amber-500 pl-2 text-sm font-semibold">墙纸规格</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <FormLabel>宽度 (cm)</FormLabel>
              <FormField
                control={form.control}
                name="attributes.wallpaperWidth"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value?.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择宽度" />
                    </SelectTrigger>
                    <SelectContent>
                      {WALLPAPER_WIDTH_VALUES.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v} cm
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormDescription>常见：53cm（韩式）、70cm（国产）、106cm（宽幅）</FormDescription>
            </div>
            <div className="space-y-2">
              <FormLabel>每卷长度 (米)</FormLabel>
              <FormField
                control={form.control}
                name="attributes.rollLength"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value?.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择卷长" />
                    </SelectTrigger>
                    <SelectContent>
                      {WALLPAPER_ROLL_LENGTH_VALUES.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v} 米/卷
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormDescription>常见：10米/卷、7米/卷</FormDescription>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
