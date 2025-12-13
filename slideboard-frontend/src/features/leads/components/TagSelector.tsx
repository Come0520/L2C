'use client';

import { X, Check, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface Tag {
    id: string;
    name: string;
    tag_category: string;
    color: string;
    is_system: boolean;
    is_auto: boolean;
}

interface TagSelectorProps {
    availableTags: Tag[];
    selectedTags: Tag[];
    onTagSelect: (tag: Tag) => void;
    onTagRemove: (tagId: string) => void;
    className?: string;
}

export function TagSelector({
    availableTags,
    selectedTags,
    onTagSelect,
    onTagRemove,
    className = '',
}: TagSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Get unique categories
    const categories = Array.from(new Set(availableTags.map(t => t.tag_category)));

    // Filter tags
    const filteredTags = availableTags.filter(tag => {
        const matchesSearch = tag.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || tag.tag_category === selectedCategory;
        const notSelected = !selectedTags.find(t => t.id === tag.id);
        return matchesSearch && matchesCategory && notSelected;
    });

    // Group by category
    const groupedTags = filteredTags.reduce((acc, tag) => {
        if (!acc[tag.tag_category]) {
            acc[tag.tag_category] = [];
        }
        acc[tag.tag_category]?.push(tag);
        return acc;
    }, {} as Record<string, Tag[]>);

    const categoryNames: Record<string, string> = {
        product: '产品类',
        stage: '装修阶段',
        intention: '意愿强度',
        system: '系统自动',
        custom: '自定义',
    };

    return (
        <div className={`relative ${className}`}>
            {/* Selected Tags Display */}
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">已选标签</span>
                    {selectedTags.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full animate-scale-in">
                            {selectedTags.length}
                        </span>
                    )}
                </div>

                {selectedTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {selectedTags.map((tag, index) => (
                            <div
                                key={tag.id}
                                className={"group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-fadeInScale"}
                                style={{
                                    backgroundColor: `${tag.color}20`,
                                    color: tag.color,
                                    borderColor: tag.color,
                                    borderWidth: '2px',
                                    animationDelay: `${index * 50}ms`,
                                }}
                            >
                                <Check className="w-3 h-3" />
                                <span>{tag.name}</span>
                                {tag.is_auto && (
                                    <Sparkles className="w-3 h-3 animate-pulse" />
                                )}
                                {!tag.is_auto && (
                                    <button
                                        aria-label={`移除标签: ${tag.name}`}
                                        title={`移除标签: ${tag.name}`}
                                        onClick={() => onTagRemove(tag.id)}
                                        className={"ml-1 p-0.5 rounded-full hover:bg-current hover:bg-opacity-20 transition-all duration-200 opacity-0 group-hover:opacity-100"}
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={"text-sm text-gray-500 py-3 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 animate-fadeIn"}>
                        暂未选择标签，请从下方选择
                    </div>
                )}
            </div>

            {/* Search and Filter */}
            <div className="mb-4 space-y-3">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索标签..."
                    className={"w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none"}
                />

                {/* Category filters */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${!selectedCategory
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        全部
                    </button>
                    {categories.map((category, index) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                        animate-slideIn
                        ${selectedCategory === category
                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {categoryNames[category] || category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Available Tags */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(groupedTags).map(([category, tags]) => (
                    <div key={category} className="animate-fadeIn">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            {categoryNames[category] || category}
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                {tags.length}
                            </span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag, index) => (
                                <button
                                    key={tag.id}
                                    onClick={() => onTagSelect(tag)}
                                    className={"group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:scale-105 animate-slideInUp"}
                                    style={{
                                        backgroundColor: 'white',
                                        color: tag.color,
                                        borderColor: tag.color,
                                        animationDelay: `${index * 30}ms`,
                                    }}
                                >
                                    <span>{tag.name}</span>
                                    {tag.is_auto && (
                                        <Sparkles className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                                    )}

                                    {/* Hover overlay */}
                                    <div className={"absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"}
                                        style={{ backgroundColor: `${tag.color}10` }} />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {filteredTags.length === 0 && (
                    <div className="text-center py-8 text-gray-500 animate-fadeIn">
                        <p>未找到匹配的标签</p>
                    </div>
                )}
            </div>

            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-fadeInScale {
          animation: fadeInScale 0.3s ease-out both;
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out both;
        }

        .animate-slideInUp {
          animation: slideInUp 0.3s ease-out both;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
        </div>
    );
}
