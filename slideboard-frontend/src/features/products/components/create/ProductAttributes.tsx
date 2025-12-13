import React, { useState } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperInput, PaperTextarea } from '@/components/ui/paper-input';
import { Product } from '@/types/products';

interface ProductAttributesProps {
  product: Product;
  onProductChange: (updates: Partial<Product>) => void;
}

export function ProductAttributes({ product, onProductChange }: ProductAttributesProps) {
  const [newAttributeKey, setNewAttributeKey] = useState('');
  const [newAttributeValue, setNewAttributeValue] = useState('');

  const handleAttributeChange = (key: string, value: string) => {
    onProductChange({
      attributes: {
        ...product.attributes,
        [key]: value || ''
      }
    });
  };

  const handleRemoveAttribute = (key: string) => {
    const updatedAttributes = { ...product.attributes };
    delete updatedAttributes[key];
    onProductChange({ attributes: updatedAttributes });
  };

  const handleAddAttribute = () => {
    if (newAttributeKey && !product.attributes[newAttributeKey]) {
      onProductChange({
        attributes: {
          ...product.attributes,
          [newAttributeKey]: newAttributeValue || ''
        }
      });
      setNewAttributeKey('');
      setNewAttributeValue('');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-ink-800">产品属性</h2>
      
      <div className="space-y-4">
        {Object.entries(product.attributes).map(([key, value]) => (
          <div key={key} className="grid grid-cols-5 gap-3 items-center">
            <PaperInput
              value={key}
              onChange={(e) => {
                const newKey = e.target.value;
                if (newKey && newKey !== key) {
                  const updatedAttributes = { ...product.attributes };
                  const attributeValue = updatedAttributes[key] || '';
                  delete updatedAttributes[key];
                  updatedAttributes[newKey] = attributeValue;
                  onProductChange({ attributes: updatedAttributes });
                }
              }}
              placeholder="属性名称"
              className="col-span-2"
            />
            <PaperTextarea
              value={value}
              onChange={(e) => handleAttributeChange(key, e.target.value)}
              placeholder="属性值"
              className="col-span-2"
              rows={1}
            />
            <PaperButton
              variant="outline"
              size="sm"
              onClick={() => handleRemoveAttribute(key)}
              className="col-span-1"
            >
              删除
            </PaperButton>
          </div>
        ))}
        
        {/* 添加新属性 */}
        <div className="grid grid-cols-5 gap-3 items-center">
          <PaperInput
            value={newAttributeKey}
            onChange={(e) => setNewAttributeKey(e.target.value)}
            placeholder="属性名称"
            className="col-span-2"
          />
          <PaperTextarea
            value={newAttributeValue}
            onChange={(e) => setNewAttributeValue(e.target.value)}
            placeholder="属性值"
            className="col-span-2"
            rows={1}
          />
          <PaperButton
            variant="primary"
            size="sm"
            onClick={handleAddAttribute}
            className="col-span-1"
            disabled={!newAttributeKey}
          >
            添加
          </PaperButton>
        </div>
      </div>
    </div>
  );
}
