'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import Layout from 'lucide-react/dist/esm/icons/layout';
import Search from 'lucide-react/dist/esm/icons/search';
import Tag from 'lucide-react/dist/esm/icons/tag';
import Clock from 'lucide-react/dist/esm/icons/clock';
import User from 'lucide-react/dist/esm/icons/user';
import Trash2 from 'lucide-react/dist/esm/icons/trash';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Users from 'lucide-react/dist/esm/icons/users';
import Lock from 'lucide-react/dist/esm/icons/lock';
import LayoutGrid from 'lucide-react/dist/esm/icons/layout-grid';
import List from 'lucide-react/dist/esm/icons/list';
import { deleteQuoteTemplate } from '../actions/template-actions';
import { toast } from 'sonner';
import { logger } from '@/shared/lib/logger';

interface QuoteTemplate {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  tags?: string[] | null;
  isPublic?: boolean | null;
  itemCount: number;
  roomCount: number;
  createdAt: Date | null;
  creator?: {
    id: string;
    name: string | null;
  } | null;
}

interface QuoteTemplateListProps {
  templates: QuoteTemplate[];
  categories: string[];
}

/**
 * 报价模板列表组件
 * 支持搜索、筛选、删除和使用模板
 */
export function QuoteTemplateList({ templates, categories }: QuoteTemplateListProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 筛选模板
  const filteredTemplates = templates.filter((template) => {
    const searchMatch =
      search === '' ||
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.description?.toLowerCase().includes(search.toLowerCase());

    const categoryMatch = categoryFilter === 'all' || template.category === categoryFilter;

    return searchMatch && categoryMatch;
  });

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const res = await deleteQuoteTemplate({ templateId: deleteId });
      if (res?.data?.success) {
        toast.success('模板已删除');
        router.refresh();
      } else {
        toast.error('删除失败');
      }
    } catch (e) {
      logger.error('[DeleteTemplateError]', e);
      toast.error('系统异常');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const getCategoryLabel = (category?: string | null) => {
    const labels: Record<string, string> = {
      CURTAIN: '窗帘',
      WALLPAPER: '墙纸墙布',
      MIXED: '综合',
    };
    return labels[category || ''] || category || '未分类';
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex w-full flex-1 gap-2 sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="搜索模板..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {getCategoryLabel(cat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 模板列表 */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Layout className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p className="text-muted-foreground">
              {search || categoryFilter !== 'all'
                ? '没有找到匹配的模板'
                : '暂无模板，在报价详情页点击「保存为模板」创建'}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="group cursor-pointer transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1 space-y-1">
                    <CardTitle className="truncate text-base">{template.name}</CardTitle>
                    {template.description && (
                      <CardDescription className="line-clamp-2">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                  <div
                    className="ml-2 flex items-center gap-1"
                    title={template.isPublic ? '团队共享' : '私有'}
                  >
                    {template.isPublic ? (
                      <Users className="text-muted-foreground h-4 w-4" />
                    ) : (
                      <Lock className="text-muted-foreground h-4 w-4" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* 标签 */}
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    {getCategoryLabel(template.category)}
                  </Badge>
                  {template.tags?.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      <Tag className="mr-1 h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* 统计 */}
                <div className="text-muted-foreground flex items-center gap-4 text-xs">
                  <span>{template.roomCount} 个空间</span>
                  <span>{template.itemCount} 个商品</span>
                </div>

                {/* 元信息 */}
                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {template.creator?.name || '未知'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(template.createdAt)}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      // 💡 待优化: 跳转到选择客户页面或直接创建报价
                      toast.info('请先选择客户后使用模板创建报价');
                    }}
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    使用模板
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(template.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="group transition-shadow hover:shadow-sm">
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <Layout className="text-muted-foreground h-8 w-8 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{template.name}</span>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {getCategoryLabel(template.category)}
                      </Badge>
                      {template.isPublic && <Users className="text-muted-foreground h-3 w-3" />}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {template.roomCount} 空间 · {template.itemCount} 商品 ·{' '}
                      {template.creator?.name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Copy className="mr-1 h-3 w-3" />
                    使用
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteId(template.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除模板？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，已使用此模板创建的报价不受影响。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
