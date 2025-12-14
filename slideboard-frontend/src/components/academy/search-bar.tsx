
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { VanishInput } from '@/components/ui/vanish-input';

export function AcademySearch() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [inputValue, setInputValue] = useState(searchParams.get('q')?.toString() || '');

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (inputValue) {
        params.set('q', inputValue);
      } else {
        params.delete('q');
      }
      replace(`${pathname}?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, pathname, replace, searchParams]);

  return (
    <div className="max-w-2xl mx-auto mb-8">
      <VanishInput
        placeholders={[
          "搜索文档标题...",
          "搜索产品知识...",
          "搜索系统功能...",
          "试试输入关键词"
        ]}
        value={inputValue}
        onChange={setInputValue}
      />
    </div>
  );
}
