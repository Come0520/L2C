'use client';

import { useState, useActionState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { adjustInventory } from '@/features/supply-chain/actions/inventory-actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ActionState {
  success: boolean;
  error?: string;
}

// ... (imports)

interface Props {
  trigger: React.ReactNode;
}

export function AdjustInventoryDialog({ trigger }: Props) {
  const [open, setOpen] = useState(false);

  const [_state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prevState, formData) => {
      const values = {
        warehouseId: formData.get('warehouseId') as string,
        productId: formData.get('productId') as string,
        quantity: Number(formData.get('quantity')),
        reason: (formData.get('reason') as string) || undefined,
      };

      const result = await adjustInventory(values);

      // 直接在客户端 Action 代理中处理 UI 交互副作用
      if (result.success) {
        toast.success('库存调整成功');
        setOpen(false);
      } else if (result.error) {
        toast.error('调整失败', { description: result.error });
      }

      return {
        success: result.success ?? false,
        error: result.error,
      };
    },
    { success: false }
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>库存手动调整</DialogTitle>
          <DialogDescription>
            直接调整指定仓库和产品的库存数量。正数增加，负数减少。
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <form id="adjust-inventory-form" action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="warehouseId">仓库 ID</Label>
              <Input id="warehouseId" name="warehouseId" placeholder="输入仓库UUID" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productId">产品 ID</Label>
              <Input id="productId" name="productId" placeholder="输入产品UUID" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">调整数量 (+/-)</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                placeholder="例如: 10 或 -5"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">原因备注</Label>
              <Input id="reason" name="reason" placeholder="选填" />
            </div>

            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                提交调整
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
