'use client';

/**
 * 手机号脱敏组件 (Masked Phone)
 * 默认展示脱敏后的手机号，点击后根据权限显示完整号码
 */

import React, { useState } from 'react';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Eye, Copy, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface MaskedPhoneProps {
  /** 原始手机号 */
  phone: string;
  /** 客户ID，用于日志记录 */
  customerId: string;
  /** 当前用户是否有权限查看完整号码 */
  canViewFull?: boolean;
  /** 查看完整号码时的回调（用于记录日志） */
  onViewFull?: (customerId: string) => Promise<void>;
  /** 是否显示拨打按钮 */
  showCallButton?: boolean;
  /** 自定义 className */
  className?: string;
}

import { formatPhoneNumberIntl } from 'react-phone-number-input';

/**
 * 标准化手机号为 E.164 格式
 * 如果是11位国内号码（1开头），自动补 +86
 * 如果已经是 + 开头，保持不变
 */
function normalizePhone(phone: string): string {
  if (!phone) return phone;
  const digits = phone.replace(/\D/g, '');
  // 已经是国际格式
  if (phone.startsWith('+')) return phone;
  // 11位国内手机号（1开头）
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+86${digits}`;
  }
  // 带86前缀但没有+号（如 8613812345678）
  if (digits.length === 13 && digits.startsWith('86')) {
    return `+${digits}`;
  }
  return phone;
}

/**
 * 格式化手机号为可读格式
 * 优先使用国际格式化，失败则分段显示
 */
function formatPhone(phone: string): string {
  if (!phone) return phone;
  const normalized = normalizePhone(phone);
  try {
    const formatted = formatPhoneNumberIntl(normalized);
    if (formatted) return formatted;
  } catch {
    // 忽略
  }
  // 降级：如果是11位国内号码，手动分段
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

/**
 * 脱敏手机号
 * 138 **** 5678 格式 或 +86 138 **** 5678 格式
 */
function maskPhone(phone: string): string {
  if (!phone) return phone;

  // 先尝试格式化
  const formatted = formatPhone(phone);
  if (formatted && formatted !== phone) {
    // 从格式化结果中掩盖中间4位数字
    let digitsToMask = 4;
    let digitsToSkip = 4;
    let result = '';
    for (let i = formatted.length - 1; i >= 0; i--) {
      const char = formatted[i];
      if (/\d/.test(char)) {
        if (digitsToSkip > 0) {
          digitsToSkip--;
          result = char + result;
        } else if (digitsToMask > 0) {
          digitsToMask--;
          result = '*' + result;
        } else {
          result = char + result;
        }
      } else {
        result = char + result;
      }
    }
    return result;
  }

  // 最终降级：简单前3后4
  if (phone.length < 7) return phone;
  const start = phone.slice(0, 3);
  const end = phone.slice(-4);
  return `${start}****${end}`;
}

export function MaskedPhone({
  phone,
  customerId,
  canViewFull = false,
  onViewFull,
  showCallButton = false,
  className,
}: MaskedPhoneProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const maskedPhone = maskPhone(phone);
  const formattedPhone = formatPhone(phone);

  // 处理查看完整号码
  const handleReveal = async () => {
    if (!canViewFull) {
      toast.error('您没有权限查看完整手机号');
      return;
    }

    setIsLoading(true);
    try {
      // 记录查看日志
      if (onViewFull) {
        await onViewFull(customerId);
      }
      setIsRevealed(true);
      setIsDialogOpen(false);
      toast.success('已获取完整手机号');
    } catch {
      toast.error('获取手机号失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 复制手机号
  const handleCopy = () => {
    if (!isRevealed && !canViewFull) {
      toast.error('您没有权限复制完整手机号');
      return;
    }
    navigator.clipboard.writeText(phone);
    toast.success('已复制到剪贴板');
  };

  // 拨打电话
  const handleCall = () => {
    if (!isRevealed && !canViewFull) {
      toast.error('您没有权限拨打此号码');
      return;
    }
    window.location.href = `tel:${phone}`;
  };

  return (
    <>
      <div className={`inline-flex items-center gap-1 ${className || ''}`}>
        <span
          className={`font-mono ${canViewFull ? 'hover:text-primary cursor-pointer' : ''}`}
          onClick={() => canViewFull && !isRevealed && setIsDialogOpen(true)}
          title={canViewFull ? '点击查看完整号码' : '无权限查看'}
        >
          {isRevealed ? formattedPhone : maskedPhone}
        </span>

        {canViewFull && !isRevealed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => setIsDialogOpen(true)}
            title="查看完整号码"
          >
            <Eye className="h-3 w-3" />
          </Button>
        )}

        {isRevealed && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={handleCopy}
              title="复制"
            >
              <Copy className="h-3 w-3" />
            </Button>
            {showCallButton && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={handleCall}
                title="拨打"
              >
                <Phone className="h-3 w-3" />
              </Button>
            )}
          </>
        )}
      </div>

      {/* 确认弹窗 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>查看完整手机号</DialogTitle>
            <DialogDescription>您正在查看客户的完整联系方式，此操作将被记录。</DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-muted-foreground font-mono text-2xl">{maskedPhone}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleReveal} disabled={isLoading}>
              {isLoading ? '加载中...' : '确认查看'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
