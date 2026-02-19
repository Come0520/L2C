'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Copy, MoreHorizontal, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DOMPurify from 'isomorphic-dompurify';
import { deleteShowroomItem } from '@/features/showroom/actions';
import { toast } from 'sonner';

// 简单的 HTML 清洗函数
// 安全的 HTML 清洗函数
function stripHtml(html: string | null | undefined) {
  if (!html) return '';
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] }).substring(0, 80) + (html.length > 80 ? '...' : '');
}

interface ShowroomItem {
  id: string;
  title: string;
  type: 'PRODUCT' | 'CASE' | 'KNOWLEDGE' | 'TRAINING';
  images: unknown; // jsonb
  content?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  product?: {
    unitPrice?: string | null;
  } | null;
}

interface ShowroomCardProps {
  item: ShowroomItem;
}

export function ShowroomCard({ item }: ShowroomCardProps) {
  const isCompact = item.type === 'KNOWLEDGE' || item.type === 'TRAINING';
  const images = Array.isArray(item.images) ? item.images as string[] : [];
  const coverImage = images[0] || 'https://via.placeholder.com/400x300?text=No+Image';
  const description = stripHtml(item.content);
  const price = item.product?.unitPrice;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      role="article"
      aria-label={`${item.type === 'PRODUCT' ? '商品' : '内容'}: ${item.title}`}
      className="group bg-card border-border hover:shadow-primary/5 relative overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:shadow-xl"
    >
      {/* Image Section */}
      <div className={`relative overflow-hidden ${isCompact ? 'h-32' : 'h-48'} bg-muted`}>
        <Image
          src={coverImage}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-60 transition-opacity group-hover:opacity-40" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge
            variant={
              item.type === 'PRODUCT'
                ? 'default'
                : item.type === 'CASE'
                  ? 'secondary'
                  : 'outline'
            }
            className="border-white/20 bg-white/10 text-white shadow-sm backdrop-blur-md"
          >
            {item.type === 'PRODUCT' && '商品'}
            {item.type === 'CASE' && '案例'}
            {item.type === 'TRAINING' && '培训'}
            {item.type === 'KNOWLEDGE' && '知识'}
          </Badge>
        </div>

        {/* Actions (Top Right) */}
        <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-full border-none bg-white/20 text-white backdrop-blur-md hover:bg-white/40"
                aria-label="更多操作"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.id)}>
                <Copy className="mr-2 h-4 w-4" /> 复制 ID
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (confirm('确定要删除且归档此内容吗？')) {
                    try {
                      await deleteShowroomItem({ id: item.id });
                      toast.success('已归档');
                    } catch (_) {
                      toast.error('操作失败');
                    }
                  }
                }}
              >
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content Section */}
      <Link href={`/showroom/${item.id}`} className="block">
        <div className="cursor-pointer space-y-2 p-4">
          <div className="flex items-start justify-between">
            <h3 className="group-hover:text-primary line-clamp-1 text-lg font-semibold transition-colors">
              {item.title}
            </h3>
          </div>

          {/* Description or Price */}
          {item.type === 'PRODUCT' && price && (
            <div className="text-gold-600 font-mono text-lg font-bold">¥{price}</div>
          )}

          {description && (
            <p className="text-muted-foreground line-clamp-2 text-sm">{description}</p>
          )}

          {/* Footer / Tags */}
          <div className="text-muted-foreground flex items-center justify-between pt-2 text-xs">
            <div className="flex gap-2">
              {item.status === 'DRAFT' && (
                <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-600">
                  草稿
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-primary/10 hover:text-primary h-7 rounded-full px-2"
              aria-label="分享"
            >
              <Share2 className="mr-1 h-3 w-3" /> 分享
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
