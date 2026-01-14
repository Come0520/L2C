'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/shared/utils';

interface SpaceSelectorProps {
    value?: string;
    onSelect: (value: string) => void;
    options: string[];
}

export function SpaceSelector({ value, onSelect, options }: SpaceSelectorProps) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-between"
                >
                    {value || "Select Space..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <div className="grid gap-1 p-2">
                    {options.map((opt) => (
                        <Button
                            key={opt}
                            variant="ghost"
                            className={cn(
                                "justify-start font-normal",
                                value === opt && "bg-accent text-accent-foreground"
                            )}
                            onClick={() => {
                                onSelect(opt);
                                setOpen(false);
                            }}
                        >
                            <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    value === opt ? "opacity-100" : "opacity-0"
                                )}
                            />
                            {opt}
                        </Button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
