'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

import { VanishInput } from '@/components/ui/vanish-input';

export function CustomerSearch() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('q', term);
        } else {
            params.delete('q');
        }
        params.set('page', '1');

        startTransition(() => {
            router.replace(`?${params.toString()}`);
        });
    };

    return (
        <div className="flex-1">
            <VanishInput
                placeholders={[
                    "搜索客户名称...",
                    "搜索公司名称...",
                    "搜索手机号...",
                    "输入关键词搜索"
                ]}
                value={searchParams.get('q') || ''}
                onSubmit={handleSearch}
                onChange={(value) => {
                    // We could implement live search here if desired
                }}
                className="w-full"
            />
        </div>
    );
}
