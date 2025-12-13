'use client';

import { useState, useMemo } from 'react';
import { Check, Copy } from 'lucide-react';
import { marked } from 'marked';

interface MarkdownRendererProps {
    content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Render Markdown content safely with useMemo for better performance
    const markdownHtml = useMemo(() => {
        if (!content) {
            return { __html: '' };
        }
        
        try {
            // marked默认不再支持sanitize选项，使用更安全的方式处理
            const html = marked.parse(content);
            return { __html: html };
        } catch (error) {
            console.error('Error rendering Markdown:', error);
            return { __html: content };
        }
    }, [content]);

    return (
        <div className="markdown-renderer">
            <div className="relative bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                <button
                    onClick={handleCopy}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all duration-200 flex items-center gap-2 text-sm"
                    aria-label="复制内容"
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="text-green-600">已复制!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4" />
                            <span>复制</span>
                        </>
                    )}
                </button>
            
                <div 
                    className="p-6 prose prose-sm prose-slate max-w-none prose-headings:font-semibold prose-headings:text-gray-800 prose-p:text-gray-600 prose-strong:text-gray-800 prose-em:text-gray-700 prose-ul:text-gray-600 prose-ol:text-gray-600 prose-link:text-blue-600 hover:prose-link:underline"
                    dangerouslySetInnerHTML={markdownHtml}
                />
            </div>
        </div>
    );
}
