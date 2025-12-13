import { BookOpen, ChevronRight, Monitor } from 'lucide-react';
import Link from 'next/link';

import { AcademySearch } from '@/components/academy/search-bar';
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card';
import { getAcademyData } from '@/data/academy';

interface AcademyPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AcademyPage({ searchParams }: AcademyPageProps) {
  const { q } = await searchParams;
  const query = typeof q === 'string' ? q.toLowerCase() : '';
  const academyData = getAcademyData();

  // Filter data based on query
  const filteredData = Object.values(academyData).map(section => {
    const filteredItems = section.items.filter(item => {
      if (!query) return true;
      return (
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query)
      );
    });

    return {
      ...section,
      items: filteredItems
    };
  }).filter(section => section.items.length > 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">L2C 学院</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          系统学习中心 - 掌握 L2C 的每个功能，深入了解罗莱产品知识
        </p>
      </div>

      {/* Search Bar */}
      <AcademySearch />

      {/* Sections */}
      {filteredData.length > 0 ? (
        filteredData.map((section) => (
          <div key={section.id} className="space-y-6">
            <div className="flex items-center space-x-3 border-b pb-2">
              {section.id === 'systems' ? (
                <Monitor className="w-8 h-8 text-blue-600" />
              ) : (
                <BookOpen className="w-8 h-8 text-green-600" />
              )}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{section.title}</h2>
                <p className="text-sm text-gray-500">{section.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.items.map((item) => (
                <Link key={item.slug} href={`/academy/${section.id}/${item.slug}`} className="group">
                  <PaperCard className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/50 cursor-pointer group-hover:-translate-y-1">
                    <PaperCardHeader>
                      <PaperCardTitle className="text-lg font-medium group-hover:text-primary transition-colors flex justify-between items-center">
                        {item.title}
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
                      </PaperCardTitle>
                    </PaperCardHeader>
                    <PaperCardContent>
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </PaperCardContent>
                  </PaperCard>
                </Link>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">没有找到相关文档</p>
          <p className="text-gray-400">请尝试更换搜索关键词</p>
        </div>
      )}
    </div>
  );
}
