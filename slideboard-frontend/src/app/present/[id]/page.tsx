'use client';

import { ChevronLeft, ChevronRight, Play, Pause, Maximize, Settings, Users } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import { PaperToast } from '@/components/ui/paper-toast';
import { fetchSlideById } from '@/services/slides.client';

interface SlideElement {
  id: string;
  type: 'text' | 'shape' | 'image';
  content: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: any;
}

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

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'info' });

  useEffect(() => {
    const loadSlide = async () => {
      try {
        const slideData = await fetchSlideById(slideId);
        // 假设返回的数据结构包含slides数组
        if (slideData && slideData.content && slideData.content.slides) {
          setSlides(slideData.content.slides);
        } else {
          // 如果数据结构不同，使用默认的mock数据作为 fallback
          setToast({ show: true, message: '幻灯片数据结构不符合预期，已使用默认数据', type: 'info' });
          setSlides([
            {
              id: '1',
              title: '欢迎',
              background: '#ffffff',
              elements: [
                {
                  id: '1',
                  type: 'text',
                  content: '欢迎使用 Slideboard',
                  position: { x: 100, y: 200 },
                  size: { width: 800, height: 100 },
                  style: { fontSize: '48px', color: '#1e3a8a', fontWeight: 'bold' },
                },
              ],
              notes: '这是第一张幻灯片的演讲者备注。',
            },
          ]);
        }
      } catch (error) {
        console.error('加载幻灯片数据失败:', error);
        setToast({ show: true, message: '加载幻灯片失败，请重试', type: 'error' });
      }
    };

    loadSlide();
  }, [slideId]);

  const handleNextSlide = useCallback(() => {
    setCurrentSlideIndex((index) => Math.min(index + 1, slides.length - 1));
  }, [slides.length]);

  const handlePreviousSlide = useCallback(() => {
    setCurrentSlideIndex((index) => Math.max(index - 1, 0));
  }, []);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen((v) => !v);
  }, []);

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
  }, [handleNextSlide, handlePreviousSlide, handleToggleFullscreen, isFullscreen]);

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
        {toast.show && (
          <PaperToast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}
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
            className={`p-2 rounded-md transition-colors ${
              showSpeakerNotes ? 'bg-gray-600' : 'hover:bg-gray-600'
            }`}
            title="演讲者备注"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            onClick={handleToggleAudienceView}
            className={`p-2 rounded-md transition-colors ${
              showAudienceView ? 'bg-gray-600' : 'hover:bg-gray-600'
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
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentSlideIndex ? 'bg-white' : 'bg-gray-500'
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
      {toast.show && (
        <PaperToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
