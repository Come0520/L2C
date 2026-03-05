'use client';

/**
 * Dialog 组件
 * 基于 Radix UI + re-resizable，支持可拖拽调整大小
 */

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Resizable } from 're-resizable';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/25 backdrop-blur-sm',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/** DialogContent 的扩展 Props */
interface DialogContentProps extends React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> {
  /** 是否支持拖拽调整大小（右侧、底部、右下角） */
  resizable?: boolean;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, onInteractOutside, onPointerDownOutside, resizable, ...props }, ref) => {
  /** 共享的 interaction 拦截逻辑 */
  const handleRadixPortalInteraction = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target?.closest?.('[data-radix-popper-content-wrapper]')) {
      e.preventDefault();
    }
  };

  /** 内部内容渲染 */
  const innerContent = (
    <>
      {children}
      <DialogPrimitive.Close className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-500">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </>
  );

  // 非 resizable 模式：保持原有行为不变
  if (!resizable) {
    return (
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            'glass-liquid-ultra data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 duration-200 sm:rounded-xl',
            className
          )}
          onInteractOutside={(e) => {
            handleRadixPortalInteraction(e);
            onInteractOutside?.(e);
          }}
          onPointerDownOutside={(e) => {
            handleRadixPortalInteraction(e);
            onPointerDownOutside?.(e);
          }}
          {...props}
        >
          {innerContent}
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  }

  // resizable 模式：Resizable 放在 DialogPrimitive.Content 内部
  // 关键：DialogPrimitive.Content 必须是 DialogPortal 的直接子元素，Radix 才能正常管理焦点和事件
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'glass-liquid-ultra data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 w-auto max-w-none translate-x-[-50%] translate-y-[-50%] border-0 bg-transparent p-0 shadow-none duration-200 sm:rounded-xl',
          className
        )}
        onInteractOutside={(e) => {
          // 拖拽 resize 手柄时不关闭弹窗
          const target = e.target as HTMLElement;
          if (
            target?.closest?.('[data-radix-popper-content-wrapper]') ||
            target?.closest?.('[class*="resizable"]')
          ) {
            e.preventDefault();
          }
          onInteractOutside?.(e);
        }}
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement;
          if (
            target?.closest?.('[data-radix-popper-content-wrapper]') ||
            target?.closest?.('[class*="resizable"]')
          ) {
            e.preventDefault();
          }
          onPointerDownOutside?.(e);
        }}
        {...props}
      >
        <Resizable
          defaultSize={{ width: 600, height: 'auto' }}
          minWidth={320}
          minHeight={200}
          maxWidth="90vw"
          maxHeight="85vh"
          enable={{
            right: true,
            bottom: true,
            bottomRight: true,
            top: false,
            left: false,
            topRight: false,
            topLeft: false,
            bottomLeft: false,
          }}
          handleStyles={{
            right: { width: 6, right: -3, cursor: 'ew-resize' },
            bottom: { height: 6, bottom: -3, cursor: 'ns-resize' },
            bottomRight: { width: 14, height: 14, right: 0, bottom: 0, cursor: 'nwse-resize' },
          }}
          handleClasses={{
            bottomRight: 'group',
          }}
          handleComponent={{
            bottomRight: (
              <div className="flex h-full w-full items-end justify-end opacity-30 transition-opacity group-hover:opacity-70">
                <svg width="10" height="10" viewBox="0 0 10 10" className="text-foreground">
                  <line
                    x1="9"
                    y1="1"
                    x2="1"
                    y2="9"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="9"
                    y1="5"
                    x2="5"
                    y2="9"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            ),
          }}
          className="glass-liquid-ultra overflow-auto rounded-xl border p-6"
        >
          <div className="mx-auto w-full max-w-[600px]">{children}</div>
        </Resizable>
        <DialogPrimitive.Close className="absolute top-4 right-4 z-10 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-500">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg leading-none font-semibold tracking-tight', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-gray-500', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
