'use client';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form';
import { PhotoUpload } from '@/shared/components/photo-upload/photo-upload';
import { UseFormReturn } from 'react-hook-form';
import { ProductFormValues } from '../../hooks/use-product-form';

interface ProductGalleryProps {
  form: UseFormReturn<ProductFormValues>;
}

/**
 * 产品图库上传表单区块
 *
 * @description 支持最多 9 张产品图片的上传、预览和删除
 */
export function ProductGallery({ form }: ProductGalleryProps) {
  return (
    <section className="space-y-4">
      <h3 className="border-l-4 border-rose-500 pl-2 text-sm font-semibold">产品图片</h3>
      <FormField
        control={form.control}
        name="images"
        render={({ field }) => (
          <FormItem>
            <FormLabel>图库</FormLabel>
            <FormControl>
              <PhotoUpload
                value={(field.value as string[]) || []}
                onChange={field.onChange}
                maxFiles={9}
              />
            </FormControl>
            <FormDescription>
              第一张图片将作为产品主图在列表中展示，支持 jpg、png，单张小于 5M，最多 9 张
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </section>
  );
}
