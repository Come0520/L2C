import React from 'react';

import { PRODUCT_TAG_OPTIONS } from '@/constants/products';
import { Product } from '@/types/products';

interface ProductTagsProps {
  product: Product;
  onProductChange: (updates: Partial<Product>) => void;
}

export function ProductTags({ product, onProductChange }: ProductTagsProps) {
  // 使用常量代替硬编码标签选项
  const tagOptions = PRODUCT_TAG_OPTIONS;

  const handleTagChange = (tagType: keyof Product['tags'], option: string) => {
    const tags = [...product.tags[tagType]];
    const index = tags.indexOf(option);
    
    if (index > -1) {
      tags.splice(index, 1);
    } else {
      tags.push(option);
    }
    
    onProductChange({
      tags: {
        ...product.tags,
        [tagType]: tags
      }
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-ink-800">标签体系</h2>
      
      <div className="space-y-4">
        {Object.entries(tagOptions).map(([tagType, options]) => {
          const titleMap: Record<string, string> = {
            styleTags: '风格标签',
            packageTags: '套餐标识',
            activityTags: '活动款标识',
            seasonTags: '季节标签',
            demographicTags: '人群标签'
          };
          
          return (
            <div key={tagType} className="space-y-2">
              <h3 className="text-lg font-medium text-ink-700">{titleMap[tagType]}</h3>
              <div className="flex flex-wrap gap-3">
                {options.map((option) => {
                  const isSelected = product.tags[tagType as keyof Product['tags']].includes(option);
                  return (
                    <button
                      key={option}
                      onClick={() => handleTagChange(tagType as keyof Product['tags'], option)}
                      className={`px-4 py-2 rounded-full text-sm ${isSelected ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-paper-300 text-ink-700 border border-paper-500 hover:bg-paper-400'}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
