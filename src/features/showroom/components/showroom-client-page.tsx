'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShowroomCard } from './showroom-card';
import { AddResourceDialog } from './add-resource-dialog';
import { ShareManagementDialog } from './share-management-dialog';
import { AceternityTabs } from '@/shared/ui/aceternity-tabs';
import { DataTableToolbar } from '@/shared/ui/data-table-toolbar';

const TABS = [
  { value: 'all', title: '全部' },
  { value: 'PRODUCT', title: '商品' },
  { value: 'CASE', title: '案例' },
  { value: 'KNOWLEDGE', title: '知识' },
  { value: 'TRAINING', title: '培训' },
];

import { getShowroomItems } from '@/features/showroom/actions';

type ShowroomItem = Awaited<ReturnType<typeof getShowroomItems>>['data'][0];

/**
 * 展厅客户端主页面组件
 * 整合了分类切换、搜索筛选、分享管理以及素材展示功能
 *
 * @param props { initialData: ShowroomItem[] } 预加载的展厅素材数据
 */
export function ShowroomClientPage({ initialData }: { initialData: ShowroomItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '');
  const [activeTab, setActiveTab] = useState(searchParams?.get('type') || 'all');

  // Update URL helper
  const updateUrl = useCallback(
    (updates: Record<string, string | undefined>) => {
      const newParams = new URLSearchParams(searchParams?.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === 'all') {
          newParams.delete(key);
        } else {
          if (Array.isArray(value)) {
            value.forEach((v) => newParams.append(key, v));
          } else {
            newParams.set(key, value);
          }
        }
      });

      startTransition(() => {
        router.push(`${pathname}?${newParams.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentSearch = searchParams?.get('search') || '';
      if (searchQuery !== currentSearch) {
        updateUrl({ search: searchQuery });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, searchParams, updateUrl]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    updateUrl({ type: val, page: '1' }); // Reset page on tab change
  };

  return (
    <div className="relative flex h-[calc(100vh-8rem)] w-full flex-col items-start justify-start space-y-4 p-6 perspective-[1000px]">
      {/* Top Section: Tabs */}
      <div className="flex w-full items-center justify-between">
        <div className="flex-1">
          <AceternityTabs
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            containerClassName="w-full mb-4"
          />
        </div>
        <div className="mb-4 flex items-center gap-2">
          <ShareManagementDialog />
          <AddResourceDialog />
        </div>
      </div>

      {/* Content Card */}
      <div className="glass-liquid-ultra relative flex h-full w-full flex-1 flex-col gap-4 overflow-hidden rounded-2xl border border-white/10 p-6">
        <DataTableToolbar
          searchProps={{
            value: searchQuery,
            onChange: setSearchQuery, // local state update
            placeholder: '搜索商品 / 案例...',
          }}
          loading={isPending}
        />

        <div className="flex-1 overflow-auto rounded-md border border-white/10 p-4">
          <motion.div
            layout
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <AnimatePresence mode="popLayout">
              {initialData.map((item) => (
                <ShowroomCard key={item.id} item={item} />
              ))}
            </AnimatePresence>
          </motion.div>

          {initialData.length === 0 && (
            <div className="flex flex-col items-center justify-center space-y-4 py-20 text-center">
              <span className="text-4xl">🔍</span>
              <h3 className="text-muted-foreground text-lg font-semibold">没有找到相关内容</h3>
              <p className="text-muted-foreground/60 max-w-xs text-sm">
                尝试更换搜索关键词或切换分类看看
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
