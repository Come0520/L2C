'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShowroomCard } from './components/showroom-card';
import { AddResourceDialog } from './components/add-resource-dialog';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { DataTableToolbar } from '@/components/ui/data-table-toolbar';

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

const TABS = [
  { value: 'all', label: '精选 ✨' },
  { value: 'product', label: '商品 🛍️' },
  { value: 'case', label: '案例 🏠' },
  { value: 'knowledge', label: '知识 📖' },
];

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
    <div className="h-[calc(100vh-8rem)] perspective-[1000px] relative flex flex-col w-full items-start justify-start p-6 space-y-4">
      {/* Top Section: Tabs */}
      <div className="flex w-full items-center justify-between">
        <div className="flex-1">
          <AnimatedTabs
            tabs={TABS}
            activeTab={activeTab}
            onChange={setActiveTab}
            containerClassName="w-full mb-4"
            layoutId="showroom-tabs"
          />
        </div>
        <div className="flex items-center gap-2 mb-4">
          {/* Actions */}
          <AddResourceDialog />
        </div>
      </div>

      {/* Content Card */}
      <div className="w-full flex-1 overflow-hidden relative h-full rounded-2xl p-6 glass-liquid-ultra border border-white/10 flex flex-col gap-4">
        {/* Toolbar */}
        <DataTableToolbar
          searchProps={{
            value: searchQuery,
            onChange: setSearchQuery,
            placeholder: "搜索商品 / 案例..."
          }}
        />

        {/* Content Grid */}
        <div className="flex-1 overflow-auto rounded-md border border-white/10 p-4">
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
        </div>
      </div>
    </div>
  );
}
