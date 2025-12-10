'use client';

import { motion } from 'framer-motion';
import { MoreHorizontal, Edit, Share2, Trash2, Play } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperDialog, PaperDialogHeader, PaperDialogTitle, PaperDialogContent, PaperDialogFooter } from '@/components/ui/paper-dialog';
import { PaperToast } from '@/components/ui/paper-toast';
import { createClient } from '@/lib/supabase/client'
import { logsService } from '@/services/logs.client';
import { useAuth } from '@/contexts/auth-context';


interface Slide {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  updated_at: string;
  is_public: boolean;
}

interface SlideCardProps {
  slide: Slide;
  onDelete?: (slideId: string) => void;
}

export function SlideCard({ slide, onDelete }: SlideCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'info' });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleEdit = () => {
    router.push(`/editor/${slide.id}`);
  };

  const handlePresent = () => {
    router.push(`/present/${slide.id}`);
  };

  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareLink, setShareLink] = useState('');

  const handleShare = () => {
    // Generate share link
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/present/${slide.id}?share=true`;
    setShareLink(link);
    setShowShareDialog(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setToast({ show: true, message: '链接已复制到剪贴板', type: 'success' });

      await logsService.createLog({
        userId: user?.id || 'unknown',
        userName: user?.name || 'Unknown User',
        action: 'copy_slide_share_link',
        level: 'info',
        resourceId: slide.id,
        resourceType: 'slide',
        details: {
          slideId: slide.id,
          slideTitle: slide.title
        }
      });
    } catch (error) {
      await logsService.createLog({
        userId: user?.id || 'unknown',
        userName: user?.name || 'Unknown User',
        action: 'copy_slide_share_link',
        level: 'error',
        resourceId: slide.id,
        resourceType: 'slide',
        details: {
          slideId: slide.id,
          slideTitle: slide.title,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      setToast({ show: true, message: '复制失败,请手动复制', type: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('slides')
        .delete()
        .eq('id', slide.id)
      if (!error) {
        setShowDeleteDialog(false)
        setToast({ show: true, message: '幻灯片已成功删除', type: 'success' })
        onDelete?.(slide.id)
        await logsService.createLog({
          userId: user?.id || 'unknown',
          userName: user?.name || 'Unknown User',
          action: 'delete_slide',
          level: 'info',
          resourceId: slide.id,
          resourceType: 'slide',
          details: { slideId: slide.id, slideTitle: slide.title }
        })
      } else {
        await logsService.createLog({
          userId: user?.id || 'unknown',
          userName: user?.name || 'Unknown User',
          action: 'delete_slide',
          level: 'error',
          resourceId: slide.id,
          resourceType: 'slide',
          details: { slideId: slide.id, slideTitle: slide.title, error: error.message }
        })
        setToast({ show: true, message: '删除失败,请重试', type: 'error' })
      }
    } catch (error) {
      await logsService.createLog({
        userId: user?.id || 'unknown',
        userName: user?.name || 'Unknown User',
        action: 'delete_slide',
        level: 'error',
        resourceId: slide.id,
        resourceType: 'slide',
        details: {
          slideId: slide.id,
          slideTitle: slide.title,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }
      })
      setToast({ show: true, message: '删除失败,请检查网络连接', type: 'error' })
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Reset time part for accurate day comparison
    const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  return (
    <motion.div 
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 
        hover:shadow-md transition-shadow duration-200 relative
        ${showMenu ? 'z-20' : 'z-0'}
      `}
      whileHover={{ scale: 1.01, y: -2, zIndex: 10 }}
      whileTap={{ scale: 0.99 }}
      style={{ position: 'relative' }}
    >
      {/* 缩略图区域 */}
      <div className="aspect-video bg-gray-100 relative group rounded-t-lg overflow-hidden">
        {slide.thumbnail_url ? (
          <Image
            src={slide.thumbnail_url}
            alt={slide.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-gray-400 text-4xl font-bold">
              {slide.title.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* 悬停操作按钮 */}
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2">
          <button
            onClick={handlePresent}
            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
            title="演示"
          >
            <Play className="h-5 w-5 text-gray-700" />
          </button>
          <button
            onClick={handleEdit}
            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
            title="编辑"
          >
            <Edit className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {/* 公开状态标识 */}
        {slide.is_public && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            公开
          </div>
        )}
      </div>

      {/* 信息区域 */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {slide.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {slide.description}
            </p>
          </div>

          {/* 更多操作菜单 */}
          <div className="relative ml-2" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <MoreHorizontal className="h-5 w-5 text-gray-500" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                <button
                  onClick={() => {
                    handleEdit();
                    setShowMenu(false);
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <Edit className="h-4 w-4 mr-3" />
                  编辑
                </button>
                <button
                  onClick={() => {
                    handlePresent();
                    setShowMenu(false);
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <Play className="h-4 w-4 mr-3" />
                  演示
                </button>
                <button
                  onClick={() => {
                    handleShare();
                    setShowMenu(false);
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <Share2 className="h-4 w-4 mr-3" />
                  分享
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => {
                    setShowDeleteDialog(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                >
                  <Trash2 className="h-4 w-4 mr-3" />
                  删除
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500">
          更新于 {formatDate(slide.updated_at)}
        </div>
      </div>

      {/* 删除确认对话框 */}
      <PaperDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        className="max-w-md"
      >
        <PaperDialogHeader>
          <PaperDialogTitle>确认删除</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <p className="text-gray-600">
            确定要删除幻灯片 "{slide.title}" 吗？此操作无法撤销。
          </p>
        </PaperDialogContent>
        <PaperDialogFooter>
          <PaperButton variant="outline" onClick={() => setShowDeleteDialog(false)}>
            取消
          </PaperButton>
          <PaperButton
            variant="primary"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleDelete}
          >
            确认删除
          </PaperButton>
        </PaperDialogFooter>
      </PaperDialog>

      {/* 分享对话框 */}
      <PaperDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        className="max-w-md"
      >
        <PaperDialogHeader>
          <PaperDialogTitle>分享幻灯片</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              分享此链接，让其他人查看您的幻灯片
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={shareLink}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
              />
              <PaperButton onClick={handleCopyLink} size="small">
                复制
              </PaperButton>
            </div>
          </div>
        </PaperDialogContent>
        <PaperDialogFooter>
          <PaperButton variant="outline" onClick={() => setShowShareDialog(false)}>
            关闭
          </PaperButton>
        </PaperDialogFooter>
      </PaperDialog>

      {/* Toast通知 */}
      {toast.show && (
        <PaperToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </motion.div>
  );
}
