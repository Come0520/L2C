'use client';

import { ImageIcon, Search, X } from 'lucide-react';
import Image from 'next/image';
import React, { useState, useEffect, useRef, useCallback } from 'react';

import { Product } from '@/shared/types/product';

interface ProductAutocompleteProps {
    value: string;
    onProductSelect: (product: Product | null) => void;
    onChange: (value: string) => void;
    products: Product[];
    placeholder?: string;
    error?: string;
    selectedProductId?: string;
}

/**
 * 产品联想选择器组件
 * 支持输入关键词搜索产品，显示产品图片和价格
 */
export function ProductAutocomplete({
    value,
    onProductSelect,
    onChange,
    products,
    placeholder = '输入产品名称搜索...',
    error,
    selectedProductId,
}: ProductAutocompleteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // 过滤产品列表
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredProducts([]);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = products.filter(
            (p) =>
                p.productName.toLowerCase().includes(term) ||
                p.productCode?.toLowerCase().includes(term)
        );
        setFilteredProducts(filtered.slice(0, 10)); // 最多显示10个结果
        setHighlightedIndex(-1);
    }, [searchTerm, products]);

    // 点击外部关闭下拉
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 同步外部value
    useEffect(() => {
        setSearchTerm(value);
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);
        onChange(newValue);
        setIsOpen(true);

        // 如果清空了输入，清除产品选择
        if (!newValue.trim()) {
            onProductSelect(null);
        }
    };

    const handleSelectProduct = useCallback((product: Product) => {
        setSearchTerm(product.productName);
        onChange(product.productName);
        onProductSelect(product);
        setIsOpen(false);
        setHighlightedIndex(-1);
    }, [onChange, onProductSelect]);

    const handleClear = () => {
        setSearchTerm('');
        onChange('');
        onProductSelect(null);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || filteredProducts.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < filteredProducts.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredProducts.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < filteredProducts.length) {
                    handleSelectProduct(filteredProducts[highlightedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setHighlightedIndex(-1);
                break;
        }
    };

    // 获取产品的第一张详情图
    const getProductImage = (product: Product): string | null => {
        return product.images?.detailImages?.[0] || null;
    };

    const selectedProduct = selectedProductId
        ? products.find((p) => p.id === selectedProductId)
        : null;

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => searchTerm.trim() && setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={`
            w-full pl-9 pr-8 py-2 text-sm
            border rounded-md
            bg-paper-50
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            ${error ? 'border-error-500' : 'border-paper-200'}
            ${selectedProduct ? 'border-primary-300 bg-primary-50/30' : ''}
          `}
                />
                {searchTerm && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {error && <p className="text-xs text-error-500 mt-1">{error}</p>}

            {/* 下拉选项 */}
            {isOpen && filteredProducts.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-paper-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
                    {filteredProducts.map((product, index) => {
                        const imageUrl = getProductImage(product);
                        const retailPrice = product.prices?.retailPrice ?? 0;

                        return (
                            <div
                                key={product.id}
                                onClick={() => handleSelectProduct(product)}
                                className={`
                  flex items-center gap-3 px-3 py-2 cursor-pointer
                  ${index === highlightedIndex ? 'bg-primary-50' : 'hover:bg-paper-50'}
                  ${product.id === selectedProductId ? 'bg-primary-100' : ''}
                `}
                            >
                                {/* 产品图片 */}
                                <div className="flex-shrink-0 w-10 h-10 rounded border border-paper-200 overflow-hidden bg-paper-100">
                                    {imageUrl ? (
                                        <Image
                                            src={imageUrl}
                                            alt={product.productName}
                                            width={40}
                                            height={40}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-ink-300">
                                            <ImageIcon className="h-5 w-5" />
                                        </div>
                                    )}
                                </div>

                                {/* 产品信息 */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-ink-800 truncate">
                                        {product.productName}
                                    </div>
                                    <div className="text-xs text-ink-500">
                                        {product.productCode && <span>{product.productCode} · </span>}
                                        <span className="text-primary-600 font-medium">
                                            ¥{retailPrice.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 无结果提示 */}
            {isOpen && searchTerm.trim() && filteredProducts.length === 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-paper-200 rounded-md shadow-lg p-4 text-center text-sm text-ink-500">
                    未找到匹配的产品
                </div>
            )}
        </div>
    );
}
