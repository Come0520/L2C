'use client';

import { ChevronLeft, ChevronRight, Play, Pause, Maximize, Settings, Users } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import { createClient } from '@/lib/supabase/client'

type Position = { x: number; y: number };
type Size = { width: number; height: number };

type TextStyle = { fontSize: string; color: string; fontWeight?: string; lineHeight?: string };
type ShapeStyle = { backgroundColor: string };

type TextElement = {
  id: string;
  type: 'text';
  content: string;
  position: Position;
  size: Size;
  style: TextStyle;
};

type ShapeElement = {
  id: string;
  type: 'shape';
  position: Position;
  size: Size;
  style: ShapeStyle;
};

type ImageElement = {
  id: string;
  type: 'image';
  position: Position;
  size: Size;
};

type SlideElement = TextElement | ShapeElement | ImageElement;

interface Slide {
  id: string;
  title: string;
  elements: SlideElement[];
  background: string;
  notes?: string;
}

export default function PresentPage() {
  const params = useParams();
  const slideId = params.id as string;

  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  const [showAudienceView, setShowAudienceView] = useState(false);

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
          setSlides([{
            id: '1',
            title: '加载失败',
            background: '#ffffff',
            elements: [
              { id: '1', type: 'text', content: '无法加载幻灯片数据', position: { x: 100, y: 200 }, size: { width: 800, height: 100 }, style: { fontSize: '48px', color: '#dc2626', fontWeight: 'bold' } },
              { id: '2', type: 'text', content: '请检查网络连接或稍后重试', position: { x: 100, y: 320 }, size: { width: 600, height: 60 }, style: { fontSize: '24px', color: '#6b7280' } },
            ],
          }])
          return
        }
        const slideRec = slide as Record<string, unknown>
        const content = slideRec['content']
        if (content && typeof content === 'object' && Array.isArray((content as { slides?: unknown }).slides)) {
          const slidesArr = (content as { slides?: Slide[] }).slides || []
          setSlides(slidesArr)
        } else {
          const id = typeof slideRec['id'] === 'string' ? (slideRec['id'] as string) : '1'
          const title = typeof slideRec['title'] === 'string' ? (slideRec['title'] as string) : '未命名幻灯片'
          const notes = typeof slideRec['description'] === 'string' ? (slideRec['description'] as string) : ''
          setSlides([{
            id,
            title,
            background: '#ffffff',
            elements: [
              { id: '1', type: 'text', content: title, position: { x: 100, y: 200 }, size: { width: 800, height: 100 }, style: { fontSize: '48px', color: '#1e3a8a', fontWeight: 'bold' } },
            ],
            notes,
          }])
        }
      } catch (_) {
        setSlides([{
          id: '1',
          title: '加载失败',
          background: '#ffffff',
          elements: [
            { id: '1', type: 'text', content: '无法加载幻灯片数据', position: { x: 100, y: 200 }, size: { width: 800, height: 100 }, style: { fontSize: '48px', color: '#dc2626', fontWeight: 'bold' } },
            { id: '2', type: 'text', content: '请检查网络连接或稍后重试', position: { x: 100, y: 320 }, size: { width: 600, height: 60 }, style: { fontSize: '24px', color: '#6b7280' } },
          ],
        }])
      }
    };

    if (slideId) {
      loadSlideData();
    }
  }, [slideId]);

  const handleNextSlide = useCallback(() => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  }, [currentSlideIndex, slides.length]);

  const handlePreviousSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  }, [currentSlideIndex]);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleToggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          handlePreviousSlide();
          break;
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
          handleNextSlide();
          break;
        case 'f':
        case 'F11':
          e.preventDefault();
          handleToggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            handleToggleFullscreen();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex, isFullscreen, handleNextSlide, handlePreviousSlide, handleToggleFullscreen]);



  const handleToggleSpeakerNotes = () => {
    setShowSpeakerNotes(!showSpeakerNotes);
  };

  const handleToggleAudienceView = () => {
    setShowAudienceView(!showAudienceView);
  };

  const renderSlideElement = (element: SlideElement) => {
    switch (element.type) {
      case 'text':
        return (
          <div
            key={element.id}
            style={{
              position: 'absolute',
              left: element.position.x,
              top: element.position.y,
              width: element.size.width,
              height: element.size.height,
              color: element.style.color,
              fontSize: element.style.fontSize,
              fontWeight: element.style.fontWeight,
              lineHeight: element.style.lineHeight,
              whiteSpace: 'pre-line',
            }}
            className="flex items-center justify-center"
          >
            {element.content}
          </div>
        );
      case 'shape':
        return (
          <div
            key={element.id}
            style={{
              position: 'absolute',
              left: element.position.x,
              top: element.position.y,
              width: element.size.width,
              height: element.size.height,
              backgroundColor: element.style.backgroundColor,
            }}
          />
        );
      case 'image':
        return (
          <div
            key={element.id}
            style={{
              position: 'absolute',
              left: element.position.x,
              top: element.position.y,
              width: element.size.width,
              height: element.size.height,
            }}
            className="bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center"
          >
            <span className="text-gray-500">图片</span>
          </div>
        );
      default:
        return null;
    }
  };

  const currentSlide = slides[currentSlideIndex];

  if (!currentSlide) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white relative overflow-hidden">
      {/* 主幻灯片显示区域 */}
      <div
        className="flex-1 flex items-center justify-center"
        style={{
          height: showSpeakerNotes ? '70vh' : '100vh',
          backgroundColor: currentSlide.background
        }}
      >
        <div className="relative w-full h-full max-w-6xl max-h-4xl">
          {currentSlide.elements.map(renderSlideElement)}
        </div>
      </div>

      {/* 演讲者备注区域 */}
      {showSpeakerNotes && (
        <div className="h-30vh bg-gray-800 border-t border-gray-700 p-6">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-lg font-semibold mb-3">演讲者备注</h3>
            <p className="text-gray-300 leading-relaxed">
              {currentSlide.notes || '暂无备注'}
            </p>
          </div>
        </div>
      )}

      {/* 顶部控制栏 */}
      <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">{currentSlide.title}</h2>
          <span className="text-sm text-gray-300">
            {currentSlideIndex + 1} / {slides.length}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleSpeakerNotes}
            className={`p-2 rounded-md transition-colors ${showSpeakerNotes ? 'bg-gray-600' : 'hover:bg-gray-600'
              }`}
            title="演讲者备注"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            onClick={handleToggleAudienceView}
            className={`p-2 rounded-md transition-colors ${showAudienceView ? 'bg-gray-600' : 'hover:bg-gray-600'
              }`}
            title="观众视图"
          >
            <Users className="h-5 w-5" />
          </button>
          <button
            onClick={handleToggleFullscreen}
            className="p-2 hover:bg-gray-600 rounded-md transition-colors"
            title="全屏"
          >
            <Maximize className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 底部控制栏 */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <button
            onClick={handlePreviousSlide}
            disabled={currentSlideIndex === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>上一张</span>
          </button>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleTogglePlay}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
              title={isPlaying ? '暂停' : '播放'}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>

            {/* 幻灯片进度指示器 */}
            <div className="flex space-x-1">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlideIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${index === currentSlideIndex ? 'bg-white' : 'bg-gray-500'
                    }`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleNextSlide}
            disabled={currentSlideIndex === slides.length - 1}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            <span>下一张</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 键盘快捷键提示 */}
      <div className="absolute top-20 right-4 bg-black bg-opacity-70 p-3 rounded-lg text-xs">
        <div className="space-y-1">
          <div>← → 或 PgUp/PgDn: 切换幻灯片</div>
          <div>空格: 下一张</div>
          <div>F: 全屏模式</div>
          <div>ESC: 退出全屏</div>
        </div>
      </div>
    </div>
  );
}
