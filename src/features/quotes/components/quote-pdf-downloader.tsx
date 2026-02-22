'use client';

import dynamic from 'next/dynamic';
import { Button } from '@/shared/ui/button';
import { Download } from 'lucide-react';
// import type { QuotePdfDocument } from './quote-pdf'; // Type-only import removed to avoid lint error if unused

// Dynamically import the PDF document component
const PdfDocument = dynamic(
    () => import('./quote-pdf').then(mod => mod.QuotePdfDocument),
    { ssr: false }
);

// Dynamically load @react-pdf/renderer only on client
const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
    {
        ssr: false,
        loading: () => (
            <Button variant="outline" size="sm" disabled>
                <Download className="mr-2 h-4 w-4" />
                <span className="text-xs">准备中...</span>
            </Button>
        )
    }
);

import { QuotePdfData } from '../types';

interface QuotePdfDownloaderProps {
    quote: QuotePdfData;
    mode: 'customer' | 'internal';
    className?: string;
    children?: React.ReactNode;
}

export function QuotePdfDownloader({ quote, mode, className, children }: QuotePdfDownloaderProps) {
    return (
        <PDFDownloadLink
            document={<PdfDocument quote={quote} mode={mode} />}
            fileName={`${mode === 'internal' ? '内部' : '客户'}报价单-${quote.quoteNo}.pdf`}
            className={className}
        >
            {/* Known issue with react-pdf types vs react 18/19 */}
            {({ loading }: { loading: boolean }) => {
                if (loading) {
                    return (
                        <Button variant="outline" size="sm" disabled>
                            <Download className="mr-2 h-4 w-4 animate-bounce" />
                            生成中...
                        </Button>
                    );
                }
                return children || (
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        下载PDF
                    </Button>
                );
            }}
        </PDFDownloadLink>
    );
}
