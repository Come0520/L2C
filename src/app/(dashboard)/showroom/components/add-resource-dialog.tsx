'use client';

import { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export function AddResourceDialog() {
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here we would call the API to create the resource
    // For now, just close the dialog
    setOpen(false);
    alert('素材添加成功 (模拟)');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> 新增素材
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新增素材</DialogTitle>
          <DialogDescription>添加商品图或案例到云展厅，供销售分享。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                标题
              </Label>
              <Input id="title" defaultValue="西湖壹号 - 示例" className="col-span-3" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                分类
              </Label>
              <Select defaultValue="case">
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">🏷️ 商品</SelectItem>
                  <SelectItem value="case">🏠 案例</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tags" className="text-right">
                标签
              </Label>
              <Input
                id="tags"
                placeholder="现代简约, 绒布, 暖色 (逗号分隔)"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="pt-2 text-right">图片</Label>
              <div className="text-muted-foreground hover:bg-muted/50 col-span-3 flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors">
                <Upload className="mb-2 h-8 w-8" />
                <span className="text-sm">点击或拖拽上传</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">保存并上架</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
