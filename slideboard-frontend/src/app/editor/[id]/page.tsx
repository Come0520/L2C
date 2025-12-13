'use client';

import { Save, Play, Plus } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback, type CSSProperties } from 'react';

import { toast } from '@/components/ui/toast';
import { PropertiesPanel } from '@/features/editor/components/PropertiesPanel';
import { SlideThumbnailList } from '@/features/editor/components/SlideThumbnailList';
import { Toolbar } from '@/features/editor/components/Toolbar';
import { callRpc } from '@/lib/api/supabase-helpers';
import { createClient } from '@/lib/supabase/client'

const SlideEditor = dynamic(() => import('@/features/editor/components/SlideEditor').then(mod => ({ default: mod.SlideEditor })), {
  ssr: false,
  loading: () => <div className="h-[600px] w-full flex items-center justify-center bg-white border border-gray-300 rounded-lg shadow-sm">加载编辑器中...</div>
});

interface SlideElement {
  id: string;
  type: 'text' | 'shape' | 'image';
  shapeType?: 'rectangle' | 'circle';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: CSSProperties;
}

interface Slide {
  id: string;
  title: string;
  elements: SlideElement[];
  background: string;
}

export default function EditorPage() {
  const params = useParams();
  const slideId = params.id as string;

  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [tool, setTool] = useState<'select' | 'text' | 'rectangle' | 'circle' | 'image'>('select');

  useEffect(() => {
    const loadSlideData = async () => {
      try {
        const supabase = createClient()
        const { data: slide, error } = await supabase
          .from('slides')
          .select('*')
          .eq('id', slideId)
          .maybeSingle()
        if (error || !slide) {
          setSlides([{ id: '1', title: '幻灯片 1', elements: [], background: '#ffffff' }])
          return
        }
        const slideRec = slide as Record<string, unknown>
        const content = slideRec['content']
        const loadedSlides = content && typeof content === 'object' ? (content as { slides?: Slide[] }).slides : undefined
        if (Array.isArray(loadedSlides) && loadedSlides.length > 0) {
          setSlides(loadedSlides)
        } else {
          setSlides([{ id: '1', title: '幻灯片 1', elements: [], background: '#ffffff' }])
        }
      } catch {
        setSlides([{ id: '1', title: '幻灯片 1', elements: [], background: '#ffffff' }])
      }
    }
    loadSlideData()
  }, [slideId])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const content = {
        slides,
        version: '1.0',
        lastModified: new Date().toISOString(),
      }
      const { error } = await supabase
        .from('slides')
        .update({ content })
        .eq('id', slideId)
      if (error) throw new Error(error.message)
      toast.success('保存成功！')
    } catch {
      toast.error('保存失败,请重试')
    } finally {
      setIsSaving(false)
    }
  }, [slideId, slides])

  const handleAddSlide = useCallback(() => {
    const newSlide: Slide = {
      id: Date.now().toString(),
      title: `幻灯片 ${slides.length + 1}`,
      elements: [],
      background: '#ffffff',
    };
    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
  }, [slides, setSlides, setCurrentSlideIndex]);

  const handleDeleteSlide = useCallback((index: number) => {
    if (slides.length <= 1) {
      toast.error('至少需要保留一张幻灯片');
      return;
    }

    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);

    if (currentSlideIndex >= newSlides.length) {
      setCurrentSlideIndex(newSlides.length - 1);
    }
  }, [slides, setSlides, currentSlideIndex, setCurrentSlideIndex]);

  const handleDuplicateSlide = useCallback(async (index: number) => {
    try {
      // 获取要复制的幻灯片
      const slideToDuplicate = slides[index];

      if (!slideToDuplicate) {
        throw new Error('幻灯片不存在');
      }

      // 深拷贝幻灯片数据
      const duplicatedSlide: Slide = JSON.parse(JSON.stringify(slideToDuplicate));

      // 生成新的唯一ID
      duplicatedSlide.id = Date.now().toString();

      // 更新幻灯片标题
      duplicatedSlide.title = `幻灯片 ${slides.length + 1}`;

      // 创建新的幻灯片列表，将复制的幻灯片插入到原幻灯片后面
      const newSlides = [...slides];
      newSlides.splice(index + 1, 0, duplicatedSlide);

      // 更新幻灯片列表状态
      setSlides(newSlides);

      // 切换到新复制的幻灯片
      setCurrentSlideIndex(index + 1);

      // 调用Supabase RPC复制幻灯片记录
      await callRpc('duplicate_slide', { slide_id: slideToDuplicate.id });

      toast.success('幻灯片复制成功！');
    } catch (error) {
      toast.error('复制幻灯片失败,请重试');
    }
  }, [slides, setSlides, setCurrentSlideIndex]);

  const handlePresent = useCallback(() => {
    window.open(`/present/${slideId}`, '_blank');
  }, [slideId]);

  const handleSlideChange = useCallback((updatedSlide: Slide) => {
    const newSlides = [...slides];
    newSlides[currentSlideIndex] = updatedSlide;
    setSlides(newSlides);
  }, [slides, currentSlideIndex, setSlides]);

  const handleElementUpdate = useCallback((elementId: string, updates: Partial<SlideElement>) => {
    const newSlides = [...slides];
    const slide = newSlides[currentSlideIndex];
    if (slide) {
      const elementIndex = slide.elements.findIndex(el => el.id === elementId);
      if (elementIndex !== -1) {
        const existingElement = slide.elements[elementIndex]!;
        slide.elements[elementIndex] = {
          id: existingElement.id,
          type: existingElement.type,
          content: updates.content ?? existingElement.content,
          position: updates.position ?? existingElement.position,
          size: updates.size ?? existingElement.size,
          style: updates.style ?? existingElement.style,
          ...updates,
          shapeType: updates.shapeType ?? existingElement.shapeType,
        };
        setSlides(newSlides);
      }
    }
  }, [slides, currentSlideIndex, setSlides]);

  const handleSlideUpdate = useCallback((updates: Partial<Slide>) => {
    const newSlides = [...slides];
    if (newSlides[currentSlideIndex]) {
      newSlides[currentSlideIndex] = {
        ...newSlides[currentSlideIndex],
        ...updates,
      };
      setSlides(newSlides);
    }
  }, [slides, currentSlideIndex, setSlides]);

  const currentSlide = slides[currentSlideIndex];

  if (!currentSlide) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {currentSlide.title}
            </h1>
            <span className="text-sm text-gray-500">
              {currentSlideIndex + 1} / {slides.length}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <Save className={`h-4 w-4 mr-2 ${isSaving ? 'animate-spin' : ''}`} />
              {isSaving ? '保存中...' : '保存'}
            </button>

            <button
              onClick={handlePresent}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Play className="h-4 w-4 mr-2" />
              演示
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧幻灯片缩略图 */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={handleAddSlide}
              className="w-full inline-flex items-center justify-center px-3 py-2 border border-primary-300 text-sm font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              添加幻灯片
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <SlideThumbnailList
              slides={slides}
              currentIndex={currentSlideIndex}
              onSlideSelect={setCurrentSlideIndex}
              onSlideDelete={handleDeleteSlide}
              onSlideDuplicate={handleDuplicateSlide}
            />
          </div>
        </div>

        {/* 中间编辑区域 */}
        <div className="flex-1 flex flex-col">
          {/* 工具栏 */}
          <div className="bg-white border-b border-gray-200 px-4 py-2">
            <Toolbar
              currentTool={tool}
              onToolChange={(t: string) => {
                const toolOptions = ['select', 'text', 'rectangle', 'circle', 'image'] as const
                if ((toolOptions as readonly string[]).includes(t)) {
                  setTool(t as typeof toolOptions[number])
                }
              }}
            />
          </div>

          {/* 编辑画布 */}
          <div className="flex-1 bg-gray-100 flex items-center justify-center p-8">
            <SlideEditor
              slide={currentSlide}
              selectedElement={selectedElement}
              onElementSelect={setSelectedElement}
              currentTool={tool}
              onSlideChange={handleSlideChange}
            />
          </div>
        </div>

        {/* 右侧属性面板 */}
        <div className="w-80 bg-white border-l border-gray-200">
          <PropertiesPanel
            selectedElement={selectedElement}
            currentSlide={currentSlide}
            onElementUpdate={handleElementUpdate}
            onSlideUpdate={handleSlideUpdate}
          />
        </div>
      </div>
    </div>
  );
}
