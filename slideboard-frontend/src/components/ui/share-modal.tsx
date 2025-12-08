'use client';

import React, { useState } from 'react';

import { PaperButton } from './paper-button';
import { PaperInput } from './paper-input';
import { PaperModal } from './paper-modal';
import { toast } from './toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareLink: string;
  title?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  shareLink,
  title = '分享内容'
}) => {
  const [isCopying, setIsCopying] = useState(false);

  const handleCopyLink = async () => {
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(shareLink);
      toast.success('链接已复制到剪贴板');
    } catch (error) {
      toast.error('复制失败，请手动复制');
      console.error('Failed to copy link:', error);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <PaperModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        {/* Share Link Section */}
        <div>
          <h3 className="text-sm font-medium text-ink-600 mb-2">分享链接</h3>
          <div className="flex gap-2">
            <PaperInput
              type="text"
              value={shareLink}
              readOnly
              fullWidth
              className="bg-paper-200"
            />
            <PaperButton
              onClick={handleCopyLink}
              loading={isCopying}
              variant="outline"
            >
              复制链接
            </PaperButton>
          </div>
        </div>



        {/* Usage Instructions */}
        <div className="bg-paper-100 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-ink-600 mb-2">使用说明</h3>
          <ul className="text-sm text-ink-500 space-y-1">
            <li>• 复制链接后可直接分享给他人</li>
            <li>• 链接有效期请查看相关说明</li>
            <li>• 如遇问题，请联系管理员</li>
          </ul>
        </div>
      </div>
    </PaperModal>
  );
};
