import { logger } from "@/shared/lib/logger";
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Edit, MoreHorizontal, Power, PowerOff, Trash2, Box } from 'lucide-react';
import Image from 'next/image';
import { Product } from '../types';

interface ProductCardProps {
  item: Product;
  onEdit: (product: Product) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
}

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    WALLPAPER: '墙纸',
    WALLCLOTH: '墙布',
    CURTAIN_FABRIC: '窗帘面料',
    CURTAIN_ACCESSORY: '窗帘配件',
    STANDARD: '标准成品',
    CURTAIN: '窗帘',
    MATTRESS: '床垫',
    OTHER: '其他',
    CURTAIN_SHEER: '窗纱',
    CURTAIN_TRACK: '窗帘轨道',
    MOTOR: '电机',
    WALLPANEL: '墙咔',
    WINDOWPAD: '飘窗垫',
    SERVICE: '服务/费用',
  };
  return labels[category] || category;
};

export function ProductCard({ item, onEdit, onToggleStatus, onDelete }: ProductCardProps) {
  return (
    <Card className="group border-border/50 bg-card/50 overflow-hidden backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="bg-muted/30 relative flex aspect-square items-center justify-center overflow-hidden">
        {item.images && item.images.length > 0 ? (
          <Image
            src={item.images[0]}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Box className="text-muted-foreground/30 h-16 w-16" />
        )}

        <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <Edit className="mr-2 h-4 w-4" /> 编辑
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus(item.id, !!item.isActive)}>
                {item.isActive ? (
                  <>
                    <PowerOff className="mr-2 h-4 w-4" /> 下架
                  </>
                ) : (
                  <>
                    <Power className="mr-2 h-4 w-4" /> 上架
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(item.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> 删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <Badge
            variant={item.isActive ? 'success' : 'secondary'}
            className="shadow-sm/50 backdrop-blur-md"
          >
            {item.isActive ? '上架中' : '已下架'}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="w-full truncate pr-2 font-semibold" title={item.name}>
              {item.name}
            </h3>
            <p className="text-muted-foreground truncate text-xs">{item.sku}</p>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-normal">
            {getCategoryLabel(item.category)}
          </Badge>
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-muted-foreground text-xs">零售 </span>
            <span className="text-primary text-lg font-bold">¥{item.retailPrice}</span>
          </div>
          <div className="text-muted-foreground text-xs">采购 ¥{item.purchasePrice}</div>
        </div>
      </CardContent>
    </Card>
  );
}
