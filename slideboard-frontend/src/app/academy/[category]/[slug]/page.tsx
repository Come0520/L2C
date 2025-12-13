import { ArrowLeft, Book, Calendar, ChevronRight, User } from 'lucide-react';
import { marked } from 'marked';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PaperCard, PaperCardContent } from '@/components/ui/paper-card';
import { getAcademyItem, getAcademySection } from '@/data/academy';

interface DocumentPageProps {
    params: Promise<{
        category: string;
        slug: string;
    }>;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
    const { category, slug } = await params;
    const item = getAcademyItem(category, slug);
    const section = getAcademySection(category);

    if (!item || !section) {
        notFound();
    }

    // Parse Markdown content
    const htmlContent = await marked.parse(item.content);

    // Find previous and next items
    const currentIndex = section.items.findIndex(i => i.slug === slug);
    const prevItem = currentIndex > 0 ? section.items[currentIndex - 1] : null;
    const nextItem = currentIndex < section.items.length - 1 ? section.items[currentIndex + 1] : null;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Mobile Breadcrumb */}
            <div className="lg:hidden mb-6">
                <Link
                    href="/academy"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-primary transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    返回学院首页
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar Navigation - Hidden on mobile, visible on lg screens */}
                <div className="hidden lg:block lg:col-span-3">
                    <div className="sticky top-6">
                        <div className="bg-white rounded-lg border shadow-sm p-4">
                            <div className="flex items-center space-x-2 mb-4 pb-4 border-b">
                                <Book className="w-5 h-5 text-primary" />
                                <h3 className="font-semibold text-gray-900">{section.title}</h3>
                            </div>
                            <nav className="space-y-1">
                                {section.items.map((navItem) => (
                                    <Link
                                        key={navItem.slug}
                                        href={`/academy/${category}/${navItem.slug}`}
                                        className={`flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                                            navItem.slug === slug
                                                ? 'bg-primary/10 text-primary font-medium'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    >
                                        <span className="truncate">{navItem.title}</span>
                                        {navItem.slug === slug && <ChevronRight className="w-4 h-4" />}
                                    </Link>
                                ))}
                            </nav>
                            <div className="mt-6 pt-4 border-t">
                                <Link
                                    href="/academy"
                                    className="flex items-center text-sm text-gray-500 hover:text-primary transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    返回学院首页
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-9">
                    {/* Document Header */}
                    <div className="mb-8 space-y-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                            <span>L2C 学院</span>
                            <ChevronRight className="w-4 h-4" />
                            <span>{section.title}</span>
                            <ChevronRight className="w-4 h-4" />
                            <span className="text-gray-900 font-medium">{item.title}</span>
                        </div>
                        
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                            {item.title}
                        </h1>
                        
                        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 border-b pb-8">
                            <div className="flex items-center">
                                <User className="w-4 h-4 mr-2" />
                                <span>L2C 团队</span>
                            </div>
                            <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span>{new Date().toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Document Content */}
                    <PaperCard className="overflow-hidden mb-8">
                        <PaperCardContent className="p-8 md:p-12">
                            <article 
                                className="prose prose-blue max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600 prose-img:rounded-lg"
                                // eslint-disable-next-line @typescript-eslint/naming-convention
                                dangerouslySetInnerHTML={{ __html: htmlContent }}
                            />
                        </PaperCardContent>
                    </PaperCard>

                    {/* Navigation Footer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {prevItem ? (
                            <Link 
                                href={`/academy/${category}/${prevItem.slug}`}
                                className="flex flex-col p-4 rounded-lg border bg-white hover:border-primary/50 hover:shadow-sm transition-all group"
                            >
                                <span className="text-xs text-gray-500 mb-1 flex items-center">
                                    <ArrowLeft className="w-3 h-3 mr-1 group-hover:-translate-x-1 transition-transform" />
                                    上一篇
                                </span>
                                <span className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                                    {prevItem.title}
                                </span>
                            </Link>
                        ) : <div />}

                        {nextItem ? (
                            <Link 
                                href={`/academy/${category}/${nextItem.slug}`}
                                className="flex flex-col items-end p-4 rounded-lg border bg-white hover:border-primary/50 hover:shadow-sm transition-all group text-right"
                            >
                                <span className="text-xs text-gray-500 mb-1 flex items-center">
                                    下一篇
                                    <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                                </span>
                                <span className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                                    {nextItem.title}
                                </span>
                            </Link>
                        ) : <div />}
                    </div>
                </div>
            </div>
        </div>
    );
}
