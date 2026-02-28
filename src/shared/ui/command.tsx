'use client';

import * as React from 'react';
import { type DialogProps } from '@radix-ui/react-dialog';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';

interface CommandDialogProps extends DialogProps {
  children?: React.ReactNode;
}

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      'text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-xl bg-black/5 dark:bg-white/5', // [UI-Pro] Base glass background
      className
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden border border-white/20 bg-transparent p-0 shadow-[0_0_40px_rgba(37,99,235,0.15)] backdrop-blur-3xl transition-all duration-300 dark:border-white/10 dark:shadow-[0_0_40px_rgba(37,99,235,0.25)]">
        {/* [UI-Pro] Aurora background effect */}
        <div className="aurora-animate pointer-events-none absolute inset-0 opacity-10 dark:opacity-20" />
        <DialogTitle className="sr-only">全局搜索</DialogTitle>
        <Command className="command-root relative z-10">{children}</Command>
      </DialogContent>
    </Dialog>
  );
};

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div
    className="border-border/40 focus-within:ring-primary-500/50 relative flex items-center border-b px-3 transition-all duration-300 focus-within:ring-1"
    cmdk-input-wrapper=""
  >
    <Search className="text-primary-500 mr-2 h-4 w-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'placeholder:text-muted-foreground relative flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  </div>
));

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn(
      'max-height-[350px] scrollbar-thin scrollbar-thumb-primary-500/20 overflow-x-hidden overflow-y-auto',
      className
    )}
    {...props}
  />
));

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="text-muted-foreground py-10 text-center text-sm"
    {...props}
  />
));

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      'text-foreground **:[[cmdk-group-heading]]:text-primary-500/80 overflow-hidden p-2 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:tracking-wider **:[[cmdk-group-heading]]:uppercase', // [UI-Pro] Glowing headings
      className
    )}
    {...props}
  />
));

CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn('bg-border/40 -mx-1 h-px', className)}
    {...props}
  />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-default items-center rounded-lg px-3 py-2 text-sm transition-all duration-200 outline-none select-none',
      'aria-selected:bg-primary-500/10 aria-selected:text-primary-600 dark:aria-selected:text-primary-400', // [UI-Pro] Selection glass glow
      'aria-selected:border-primary-500/20 border border-transparent aria-selected:border aria-selected:shadow-[inset_0_0_12px_rgba(37,99,235,0.05)]', // Inner focus effect
      'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
      className
    )}
    {...props}
  />
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        'text-muted-foreground/70 border-muted-foreground/20 ml-auto rounded border bg-black/5 px-1.5 py-0.5 text-xs tracking-widest dark:bg-white/5',
        className
      )}
      {...props}
    />
  );
};
CommandShortcut.displayName = 'CommandShortcut';

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
