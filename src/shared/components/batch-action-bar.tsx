'use client';

import { Button } from '@/shared/ui/button';
import X from 'lucide-react/dist/esm/icons/x';
import { AnimatePresence, motion } from 'framer-motion';

interface BatchActionBarProps {
    selectedCount: number;
    onReset: () => void;
    children?: React.ReactNode;
}

export function BatchActionBar({ selectedCount, onReset, children }: BatchActionBarProps) {
    return (
        <AnimatePresence>
            {selectedCount > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-white dark:bg-zinc-800 border shadow-lg rounded-full px-6 py-3"
                >
                    <div className="flex items-center gap-2 border-r pr-4">
                        <span className="text-sm font-medium">{selectedCount} Selected</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={onReset}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
