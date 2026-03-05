'use client';

/**
 * 发送给客户确认弹窗组件
 *
 * 生成微信小程序明文 URL Scheme 链接，销售可一键复制发送给客户。
 * 客户在手机浏览器 / 微信中点击链接即可唤起小程序进入指定页面。
 *
 * @see https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/url-scheme.html
 */

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog';
import { toast } from 'sonner';
import Send from 'lucide-react/dist/esm/icons/send';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Check from 'lucide-react/dist/esm/icons/check';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';

// ============================================================
// 常量
// ============================================================

/** 小程序 AppID */
const MINIPROGRAM_APPID = 'wx82596dbc95a6a509';

/** 根据业务类型映射到小程序页面路径 */
const PAGE_PATH_MAP = {
  quote: 'pages/quotes/detail',
  task: 'pages/tasks/customer-confirm/index',
} as const;

/** 根据业务类型映射 query 参数名 */
const QUERY_KEY_MAP = {
  quote: 'id',
  task: 'taskId',
} as const;

// ============================================================
// 类型
// ============================================================

export interface SendToCustomerDialogProps {
  /** 业务类型：报价单确认 or 安装单确认 */
  type: 'quote' | 'task';
  /** 资源 ID（报价单 ID 或安装任务 ID） */
  id: string;
  /** 弹窗标题 */
  title?: string;
  /** 附加描述 */
  description?: string;
  /** 自定义触发按钮（不传则使用默认按钮） */
  trigger?: React.ReactNode;
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 生成微信明文 URL Scheme
 */
function generateSchemeUrl(type: 'quote' | 'task', id: string): string {
  const path = PAGE_PATH_MAP[type];
  const queryKey = QUERY_KEY_MAP[type];
  const query = encodeURIComponent(`${queryKey}=${id}`);
  return `weixin://dl/business/?appid=${MINIPROGRAM_APPID}&path=${path}&query=${query}`;
}

// ============================================================
// 组件
// ============================================================

export function SendToCustomerDialog({
  type,
  id,
  title,
  description,
  trigger,
}: SendToCustomerDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const schemeUrl = generateSchemeUrl(type, id);

  const defaultTitle = type === 'quote' ? '发送报价单确认' : '发送安装单确认';
  const defaultDescription =
    type === 'quote'
      ? '复制链接发送给客户，客户点击后可在小程序中查看报价单并签字确认。'
      : '复制链接发送给客户，客户点击后可在小程序中查看完工照片并签字确认。';

  /** 复制链接到剪贴板 */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(schemeUrl);
      setCopied(true);
      toast.success('链接已复制！可粘贴发送给客户');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // 降级方案：使用 execCommand
      const textarea = document.createElement('textarea');
      textarea.value = schemeUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      toast.success('链接已复制！');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <>
      {/* 触发按钮 */}
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Send className="mr-2 h-4 w-4" />
          发送给客户确认
        </Button>
      )}

      {/* 弹窗 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              {title || defaultTitle}
            </DialogTitle>
            <DialogDescription>{description || defaultDescription}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 使用说明 */}
            <div className="space-y-2 rounded-lg bg-blue-50 p-4 text-sm dark:bg-blue-950/30">
              <p className="font-medium text-blue-700 dark:text-blue-400">使用方式：</p>
              <ol className="list-inside list-decimal space-y-1 text-blue-600 dark:text-blue-300">
                <li>点击下方按钮复制链接</li>
                <li>通过微信 / 短信将链接发送给客户</li>
                <li>客户在手机上点击链接 → 打开小程序</li>
                <li>客户查看内容后签字确认</li>
              </ol>
            </div>

            {/* 链接展示区 */}
            <div className="bg-muted/50 rounded-lg border p-3">
              <p className="text-muted-foreground mb-2 text-xs">小程序链接：</p>
              <p className="text-foreground/80 font-mono text-xs break-all select-all">
                {schemeUrl}
              </p>
            </div>

            {/* 提醒 */}
            <p className="text-muted-foreground text-xs">
              ⚠️ 此链接需要客户手机已安装微信方可打开。小程序需已发布上线。
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>
              关闭
            </Button>
            <Button onClick={handleCopy} className="gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  一键复制链接
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
