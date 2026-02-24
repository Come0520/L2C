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
            'flex h-full w-full flex-col overflow-hidden rounded-xl bg-black/5 dark:bg-white/5 text-popover-foreground', // [UI-Pro] Base glass background
            className
        )}
        {...props}
    />
));
Command.displayName = CommandPrimitive.displayName;

const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
    return (
        <Dialog {...props}>
            <DialogContent className="overflow-hidden p-0 bg-transparent border border-white/20 dark:border-white/10 shadow-[0_0_40px_rgba(37,99,235,0.15)] dark:shadow-[0_0_40px_rgba(37,99,235,0.25)] backdrop-blur-3xl transition-all duration-300">
                {/* [UI-Pro] Aurora background effect */}
                <div className="absolute inset-0 aurora-animate opacity-10 dark:opacity-20 pointer-events-none" />
                <DialogTitle className="sr-only">全局搜索</DialogTitle>
                <Command className="command-root relative z-10">
                    {children}
                </Command>
            </DialogContent>
        </Dialog>
    );
};

const CommandInput = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive.Input>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
    <div className="flex items-center border-b border-border/40 px-3 relative focus-within:ring-1 focus-within:ring-primary-500/50 transition-all duration-300" cmdk-input-wrapper="">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-primary-500" />
        <CommandPrimitive.Input
            ref={ref}
            className={cn(
                'flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 relative',
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
        className={cn('max-height-[350px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-primary-500/20', className)}
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
        className="py-10 text-center text-sm text-muted-foreground"
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
            'overflow-hidden p-2 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:text-primary-500/80 **:[[cmdk-group-heading]]:tracking-wider **:[[cmdk-group-heading]]:uppercase', // [UI-Pro] Glowing headings
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
        className={cn('-mx-1 h-px bg-border/40', className)}
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
            'relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-all duration-200',
            'aria-selected:bg-primary-500/10 aria-selected:text-primary-600 dark:aria-selected:text-primary-400', // [UI-Pro] Selection glass glow
            'aria-selected:shadow-[inset_0_0_12px_rgba(37,99,235,0.05)] aria-selected:border aria-selected:border-primary-500/20 border border-transparent', // Inner focus effect
            'data-disabled:pointer-events-none data-disabled:opacity-50',
            className
        )}
        {...props}
    />
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
    return (
        <span
            className={cn(
                'ml-auto text-xs tracking-widest text-muted-foreground/70 border border-muted-foreground/20 rounded px-1.5 py-0.5 bg-black/5 dark:bg-white/5',
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

