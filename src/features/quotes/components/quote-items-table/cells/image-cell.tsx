'use client';

import { memo } from 'react';
import Image from 'next/image';
import { TableCell } from '@/shared/ui/table';
import { ImageIcon } from 'lucide-react';
import type { QuoteItem } from '../types';

interface ImageCellProps {
    item: QuoteItem;
}

export const ImageCell = memo(function ImageCell({ item }: ImageCellProps) {
    const imageUrl = item.attributes?.productImage;

    return (
        <TableCell className="p-2 text-center">
            {imageUrl ? (
                <div className="relative mx-auto h-10 w-10 overflow-hidden rounded-md border bg-muted">
                    <Image
                        src={imageUrl}
                        alt={item.productName || '商品图片'}
                        fill
                        className="object-cover"
                        sizes="40px"
                    />
                </div>
            ) : (
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-dashed bg-muted/50 text-muted-foreground/50">
                    <ImageIcon className="h-4 w-4" />
                </div>
            )}
        </TableCell>
    );
});
