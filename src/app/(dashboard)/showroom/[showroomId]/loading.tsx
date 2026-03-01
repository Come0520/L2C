import { Skeleton } from '@/components/ui/skeleton';

/**
 * 展厅素材详情页 - 骨架屏加载态
 * 在异步数据获取期间展示，避免白屏
 */
export default function ShowroomDetailLoading() {
  return (
    <div className="h-[calc(100vh-8rem)] space-y-6 p-6">
      {/* 返回按钮 + 标题 */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg bg-white/5" />
        <Skeleton className="h-8 w-64 rounded-md bg-white/5" />
      </div>

      {/* 主内容区域 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 左侧：图片画廊 */}
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-80 w-full rounded-2xl bg-white/5" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-16 rounded-lg bg-white/5" />
            ))}
          </div>
        </div>

        {/* 右侧：信息面板 */}
        <div className="glass-liquid-ultra space-y-4 rounded-2xl border border-white/10 p-4">
          <Skeleton className="h-6 w-24 rounded-md bg-white/5" />
          <Skeleton className="h-4 w-full bg-white/5" />
          <Skeleton className="h-4 w-3/4 bg-white/5" />
          <div className="space-y-3 pt-4">
            <Skeleton className="h-10 w-full rounded-md bg-white/5" />
            <Skeleton className="h-10 w-full rounded-md bg-white/5" />
          </div>
          <div className="flex gap-2 pt-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
