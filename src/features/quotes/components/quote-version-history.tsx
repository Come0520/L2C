'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import History from 'lucide-react/dist/esm/icons/history';
import CopyPlus from 'lucide-react/dist/esm/icons/copy-plus';
import { createNextVersion } from '../actions/mutations';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils'; // Assuming utils existence or use clsx

interface QuoteVersionHistoryProps {
    currentQuoteId: string;
    quoteNo: string; // Base Quote No (e.g. Q100) or Full (Q100-V1)
    version: number;
    parentQuoteId?: string | null;
    versions?: { id: string; version: number; status: string; createdAt: Date }[]; // If passed in, or fetch?
}

export function QuoteVersionHistory({ currentQuoteId, quoteNo, version, versions = [] }: QuoteVersionHistoryProps) {
    const router = useRouter();

    const handleCreateVersion = async () => {
        try {
            toast.loading('Creating new version...');
            const res = await createNextVersion({ quoteId: currentQuoteId });
            if (res?.data?.id) {
                toast.dismiss();
                toast.success('New version created');
                router.push(`/quotes/${res.data.id}`);
            } else {
                toast.error('Failed to create version');
            }
        } catch (e) {
            toast.error('Error creating version');
        }
    };

    return (
        <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
                <History className="w-3 h-3 mr-1" />
                V{version}
            </Badge>

            {/* Mock Version Switcher */}
            {versions.length > 0 && (
                <div className="flex space-x-1">
                    {versions.map(v => (
                        <Button
                            key={v.id}
                            variant={v.id === currentQuoteId ? "default" : "ghost"}
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => router.push(`/quotes/${v.id}`)}
                        >
                            {v.version}
                        </Button>
                    ))}
                </div>
            )}

            <Button variant="ghost" size="sm" onClick={handleCreateVersion} title="Create Next Version">
                <CopyPlus className="w-4 h-4" />
                New Version
            </Button>
        </div>
    );
}
