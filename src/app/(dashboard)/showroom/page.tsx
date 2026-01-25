'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShowroomTabs } from './components/showroom-tabs';
import { FilterBar } from './components/filter-bar';
import { ShowroomCard } from './components/showroom-card';
import { AddResourceDialog } from './components/add-resource-dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, MoreHorizontal, Aperture } from 'lucide-react';

// Mock Data
const MOCK_DATA = [
  {
    id: '1',
    title: '西湖壹号 - 现代极简',
    category: 'case',
    image: 'https://picsum.photos/400/600',
    description: '灵感源自西湖的柔美线条，结合现代极简主义设计，打造宁静致远的居住空间。',
    status: 'published',
  },
  {
    id: '2',
    title: '意大利进口绒布 - 皇家蓝',
    category: 'product',
    price: '¥280/m',
    image: 'https://picsum.photos/400/500',
    description: '顶级意大利天鹅绒，手感细腻，垂感极佳。皇家蓝配色彰显奢华气质。',
    status: 'published',
  },
  {
    id: '3',
    title: '阳光海岸 - 法式浪漫',
    category: 'case',
    image: 'https://picsum.photos/400/550',
    description: '法式浪漫风情，采用轻盈的纱帘与优雅的遮光布搭配，营造梦幻光影。',
    status: 'published',
  },
  {
    id: '4',
    title: '高精密遮光布 - 奶咖色',
    category: 'product',
    price: '¥120/m',
    image: 'https://picsum.photos/400/400',
    description: '高精密物理遮光，遮光率达99%。奶咖色温柔百搭，适合卧室使用。',
    status: 'draft',
  },
  {
    id: '5',
    title: '如何搭配客厅窗帘？专家指南',
    category: 'knowledge',
    image: 'https://picsum.photos/400/300',
    description: '窗帘搭配不仅是遮光，更是空间美学的点睛之笔。通过色彩、材质和款式的选择...',
    status: 'published',
  },
  {
    id: '6',
    title: '2026年窗帘流行趋势解析',
    category: 'knowledge',
    image: 'https://picsum.photos/400/301',
    description: '自然材质回归，大地色系持续走红。智能化控制成为高端住宅标配。',
    status: 'published',
  },
] as const;

export default function ShowroomPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter Logic
  const filteredData = MOCK_DATA.filter((item) => {
    const matchesTab = activeTab === 'all' || item.category === activeTab;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="from-background via-background to-muted/30 min-h-screen space-y-6 bg-gradient-to-br p-4 pb-24 md:p-8 md:pb-8">
      {/* Header Area */}
      <header className="bg-background/80 sticky top-0 z-20 -mx-4 flex items-center justify-between px-4 py-2 backdrop-blur-xl md:static md:mx-0 md:bg-transparent md:px-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="hover:bg-muted rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="from-foreground to-foreground/70 bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent md:text-2xl">
            L2C 窗帘全流程管理大师
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <AddResourceDialog />
          </div>
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Aperture className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Sticky Filters Mobile */}
      <div className="bg-background/95 border-border/40 sticky top-[52px] z-10 -mx-4 space-y-4 border-b px-4 py-3 shadow-sm backdrop-blur-xl md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none">
        <FilterBar onSearch={setSearchQuery} />
        <ShowroomTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Content Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <AnimatePresence mode="popLayout">
          {filteredData.map((item) => (
            <ShowroomCard key={item.id} item={item as any} />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="flex flex-col items-center justify-center space-y-4 py-20 text-center">
          <div className="bg-muted/50 animate-blob flex h-24 w-24 items-center justify-center rounded-full">
            <span className="text-4xl">🔍</span>
          </div>
          <h3 className="text-muted-foreground text-lg font-semibold">没有找到相关内容</h3>
          <p className="text-muted-foreground/60 max-w-xs text-sm">
            尝试更换搜索关键词或切换分类看看
          </p>
        </div>
      )}

      {/* Mobile Fab */}
      <div className="fixed right-6 bottom-6 md:hidden">
        <AddResourceDialog />
      </div>
    </div>
  );
}
