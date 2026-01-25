'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Share2, Heart, ShoppingCart, Download, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { use } from 'react';

// Mock Data Lookup (In real app, fetch from DB)
const MOCK_DB: Record<string, any> = {
  '1': {
    id: '1',
    title: '西湖壹号 - 现代极简',
    category: 'case',
    image: 'https://picsum.photos/800/600',
    images: [
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/601',
      'https://picsum.photos/800/602',
    ],
    price: '¥12,000/套',
    description:
      '灵感源自西湖的柔美线条，结合现代极简主义设计，打造宁静致远的居住空间。采用高透光纱帘与重磅遮光布的完美组合，既保证隐私又引入柔和光线。',
    specs: [
      { label: '风格', value: '现代极简' },
      { label: '材质', value: '混纺/亚麻' },
      { label: '包含', value: '主卧+次卧+客厅' },
    ],
    tags: ['现代', '极简', '西湖', '整屋案例'],
    author: 'L2C 设计团队',
  },
  '2': {
    id: '2',
    title: '意大利进口绒布 - 皇家蓝',
    category: 'product',
    image: 'https://picsum.photos/600/600',
    price: '¥280/m',
    description:
      '顶级意大利天鹅绒，手感细腻，垂感极佳。皇家蓝配色彰显奢华气质，适合高端别墅或会所使用。',
    specs: [
      { label: '宽幅', value: '280cm' },
      { label: '克重', value: '1200g/m' },
      { label: '产地', value: '意大利' },
    ],
    tags: ['绒布', '皇家蓝', '进口'],
  },
  '5': {
    id: '5',
    title: '如何搭配客厅窗帘？专家指南',
    category: 'knowledge',
    image: 'https://picsum.photos/800/400',
    author: '资深软装设计师 · Anna',
    date: '2026-01-20',
    content: `
            <p class="mb-4">窗帘搭配不仅是遮光，更是空间美学的点睛之笔。通过色彩、材质和款式的选择，可以彻底改变房间的气质。</p>
            <h3 class="text-xl font-bold mb-2">1. 色彩呼应原则</h3>
            <p class="mb-4">窗帘颜色应与墙面、沙发或地毯有呼应。最安全的做法是选择与墙面同色系但深浅不同的颜色。</p>
            <h3 class="text-xl font-bold mb-2">2. 材质与风格</h3>
            <p class="mb-4">现代风格适合棉麻或高精密面料；法式风格首选丝绒或蕾丝；日式风格则推荐原色亚麻。</p>
        `,
    tags: ['搭配指南', '客厅', '软装知识'],
  },
};

export default function ShowroomDetailPage({
  params,
}: {
  params: Promise<{ showroomId: string }>;
}) {
  const { showroomId } = use(params);
  const router = useRouter();
  const item = MOCK_DB[showroomId];

  if (!item) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">未找到该内容</h1>
        <Button onClick={() => router.back()}>返回列表</Button>
      </div>
    );
  }

  const isKnowledge = item.category === 'knowledge';

  return (
    <div className="bg-background relative min-h-screen pb-20 md:pb-0">
      {/* Header Image / Hero */}
      <div className={`relative ${isKnowledge ? 'h-[40vh]' : 'h-[50vh]'} w-full overflow-hidden`}>
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8 }}
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover"
        />

        {/* Back Button */}
        <div className="absolute top-4 left-4 z-20">
          <Link href="/showroom">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full border-none bg-black/20 text-white backdrop-blur-md hover:bg-black/40"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Overlay Text for Knowledge */}
        {isKnowledge && (
          <div className="absolute inset-0 flex items-end bg-black/40 p-6 md:p-12">
            <div className="max-w-3xl space-y-2 text-white">
              <Badge className="bg-primary/80 mb-2 border-none backdrop-blur-sm">知识百科</Badge>
              <h1 className="text-3xl leading-tight font-bold md:text-5xl">{item.title}</h1>
              <div className="flex items-center gap-4 text-sm opacity-90">
                <span>{item.author}</span>
                <span>•</span>
                <span>{item.date}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Container - Overlapping Card Effect */}
      <div
        className={`bg-background border-border/50 relative z-10 -mt-10 min-h-[50vh] rounded-t-3xl border-t shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:-mt-20 ${isKnowledge ? 'mx-auto max-w-4xl p-6 md:p-12' : 'container mx-auto p-6 md:p-10'}`}
      >
        {/* Product/Case Header */}
        {!isKnowledge && (
          <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant={item.category === 'case' ? 'secondary' : 'default'}>
                  {item.category === 'case' ? '案例' : '商品'}
                </Badge>
                {item.tags?.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-muted-foreground">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h1 className="from-foreground to-foreground/80 bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent md:text-4xl">
                {item.title}
              </h1>
            </div>
            <div className="flex w-full items-center gap-3 md:w-auto">
              <Button
                size="lg"
                className="shadow-primary/20 flex-1 rounded-full shadow-lg md:flex-none"
              >
                <MessageCircle className="mr-2 h-4 w-4" /> 咨询详情
              </Button>
              <Button variant="outline" size="icon" className="rounded-full">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Left Column: Description & Content */}
          <div className="col-span-2 space-y-8">
            {!isKnowledge && (
              <div className="prose dark:prose-invert max-w-none">
                <h3 className="mb-4 text-xl font-semibold opacity-90">简介</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">{item.description}</p>
              </div>
            )}

            {isKnowledge && (
              <div
                className="prose dark:prose-invert max-w-none text-lg leading-relaxed"
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
            )}

            {/* Image Gallery for Cases */}
            {item.images && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold opacity-90">图集</h3>
                <div className="grid grid-cols-2 gap-4">
                  {item.images.map((img: string, i: number) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Gallery ${i}`}
                      className="h-48 w-full cursor-pointer rounded-xl object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Specs / Attributes */}
          {!isKnowledge && (
            <div className="col-span-1">
              <div className="bg-muted/30 border-border/50 sticky top-24 rounded-2xl border p-6">
                <div className="mb-6">
                  <span className="text-muted-foreground mb-1 block text-sm">参考价格</span>
                  <div className="text-gold-600 font-mono text-3xl font-bold">
                    {item.price || '询价'}
                  </div>
                </div>

                <div className="space-y-4">
                  {item.specs?.map((spec: any, i: number) => (
                    <div
                      key={i}
                      className="border-border/40 flex items-center justify-between border-b py-2 last:border-0"
                    >
                      <span className="text-muted-foreground">{spec.label}</span>
                      <span className="font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 space-y-3">
                  <Button className="w-full" variant="secondary">
                    <Download className="mr-2 h-4 w-4" /> 下载高清大图
                  </Button>
                  <Button className="w-full" variant="outline">
                    <ShoppingCart className="mr-2 h-4 w-4" /> 加入选品单
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
