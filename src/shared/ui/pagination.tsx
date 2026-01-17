'use client';

import { Button } from '@/shared/ui/button';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface PaginationProps {
    totalPages: number;
    currentPage?: number;
    onPageChange?: (page: number) => void;
}

export function Pagination({ totalPages, currentPage: controlledPage, onPageChange }: PaginationProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { replace } = useRouter();

    const urlPage = Number(searchParams.get('page')) || 1;
    const currentPage = controlledPage ?? urlPage;

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    const handlePageChange = (page: number) => {
        if (onPageChange) {
            onPageChange(page);
        } else {
            replace(createPageURL(page));
        }
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-end space-x-2 py-4">
            <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
            >
                <ChevronLeft className="h-4 w-4" />
                上一页
            </Button>
            <span className="text-sm text-gray-600">
                第 {currentPage} 页 / 共 {totalPages} 页
            </span>
            <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
            >
                下一页
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
