'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import History from 'lucide-react/dist/esm/icons/history';
import Plus from 'lucide-react/dist/esm/icons/plus';
import { createNextVersion } from '../actions/mutations';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { logger } from '@/shared/lib/logger';

interface QuoteVersionHistoryProps {
  currentQuoteId: string;
  version: number;
  versions?: { id: string; version: number; status: string; createdAt: Date }[];
}

export function QuoteVersionHistory({
  currentQuoteId,
  version,
  versions = [],
}: QuoteVersionHistoryProps) {
  const router = useRouter();

  const handleCreateVersion = async () => {
    try {
      toast.loading('正在准备新版本方案...', { id: 'create-version' });
      const res = await createNextVersion({ quoteId: currentQuoteId });
      if (res?.data?.id) {
        toast.success('新版本创建成功，您可以继续编辑', { id: 'create-version' });
        router.push(`/quotes/${res.data.id}`);
      } else {
        toast.error('版本创建失败，请稍后重试', { id: 'create-version' });
      }
    } catch (e) {
      logger.error('[CreateVersionError]', e);
      toast.error('系统异常，无法创建版本', { id: 'create-version' });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className="bg-muted/30 border-border text-muted-foreground h-7 px-2 font-mono font-bold"
      >
        <History className="text-primary/70 mr-1.5 h-3.5 w-3.5" />V{version}
      </Badge>

      <div className="flex items-center -space-x-px">
        {versions.slice(0, 3).map((v, idx: number) => (
          <Button
            key={v.id}
            variant="outline"
            size="sm"
            className={cn(
              'relative h-7 px-2.5 text-[11px] font-medium transition-all',
              v.id === currentQuoteId
                ? 'bg-primary text-primary-foreground border-primary z-10 shadow-sm'
                : 'bg-card hover:bg-muted/10 text-muted-foreground',
              idx === 0 ? 'rounded-l-md' : '',
              idx === Math.min(versions.length, 3) - 1 ? 'rounded-r-md' : 'rounded-none'
            )}
            onClick={() => v.id !== currentQuoteId && router.push(`/quotes/${v.id}`)}
            title={`创建于: ${new Date(v.createdAt).toLocaleString()}`}
          >
            V{v.version}
          </Button>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="text-primary hover:text-primary hover:bg-primary/5 h-7 gap-1.5 px-2"
        onClick={handleCreateVersion}
      >
        <div className="bg-primary/10 flex h-4 w-4 items-center justify-center rounded-full">
          <Plus className="h-3 w-3" />
        </div>
        <span className="text-xs font-semibold">保存为新版本</span>
      </Button>
    </div>
  );
}
