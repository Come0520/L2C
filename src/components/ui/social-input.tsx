'use client';

import * as React from 'react';
import { Input, type InputProps } from './input';
import { cn } from '@/shared/lib/utils';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import Hash from 'lucide-react/dist/esm/icons/hash';

export interface SocialInputProps extends InputProps {
  type?: 'wechat' | 'qq' | 'social';
}

const SocialInput = React.forwardRef<HTMLInputElement, SocialInputProps>(
  ({ className, type = 'social', ...props }, ref) => {
    const Icon = React.useMemo(() => {
      switch (type) {
        case 'wechat':
          return MessageSquare; // 暂代微信图标
        case 'qq':
          return Hash; // 暂代QQ图标
        default:
          return MessageSquare;
      }
    }, [type]);

    const label = React.useMemo(() => {
      switch (type) {
        case 'wechat':
          return '微信';
        case 'qq':
          return 'QQ';
        default:
          return '账号';
      }
    }, [type]);

    return (
      <div className="relative w-full">
        <div className="bg-muted text-muted-foreground pointer-events-none absolute top-1/2 left-3 flex -translate-y-1/2 items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase">
          <Icon className="h-3 w-3" />
          <span>{label}</span>
        </div>
        <Input
          {...props}
          ref={ref}
          className={cn('pl-20', className)}
          placeholder={props.placeholder || `请输入${label}...`}
        />
      </div>
    );
  }
);

SocialInput.displayName = 'SocialInput';

export { SocialInput };
