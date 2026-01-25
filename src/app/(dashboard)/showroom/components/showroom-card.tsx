'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Copy, MoreHorizontal, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ShowroomItem {
  id: string;
  title: string;
  category: 'product' | 'case' | 'knowledge';
  image: string;
  price?: string;
  description?: string;
  tags?: string[];
  status: 'published' | 'draft';
}

interface ShowroomCardProps {
  item: ShowroomItem;
}

export function ShowroomCard({ item }: ShowroomCardProps) {
  const isKnowledge = item.category === 'knowledge';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="group bg-card border-border hover:shadow-primary/5 relative overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:shadow-xl"
    >
      {/* Image Section */}
      <div className={`relative overflow-hidden ${isKnowledge ? 'h-32' : 'h-48'} bg-muted`}>
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 transition-opacity group-hover:opacity-40" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge
            variant={
              item.category === 'product'
                ? 'default'
                : item.category === 'case'
                  ? 'secondary'
                  : 'outline'
            }
            className="border-white/20 bg-white/10 text-white shadow-sm backdrop-blur-md"
          >
            {item.category === 'product' && '商品'}
            {item.category === 'case' && '案例'}
            {item.category === 'knowledge' && '知识'}
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
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.id)}>
                <Copy className="mr-2 h-4 w-4" /> 复制 ID
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">删除</DropdownMenuItem>
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
          {item.category === 'product' && item.price && (
            <div className="text-gold-600 font-mono text-lg font-bold">{item.price}</div>
          )}

          {item.description && (
            <p className="text-muted-foreground line-clamp-2 text-sm">{item.description}</p>
          )}

          {/* Footer / Tags */}
          <div className="text-muted-foreground flex items-center justify-between pt-2 text-xs">
            <div className="flex gap-2">
              {item.status === 'draft' && (
                <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-600">
                  草稿
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-primary/10 hover:text-primary h-7 rounded-full px-2"
            >
              <Share2 className="mr-1 h-3 w-3" /> 分享
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
