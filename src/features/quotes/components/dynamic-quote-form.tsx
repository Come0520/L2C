'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import { QuoteConfig } from '@/services/quote-config.service';
import { ProductAutocomplete } from './product-autocomplete';
import { createQuoteItemSchema } from '../actions/schema';

interface DynamicQuoteFormProps {
    quoteId: string;
    roomId?: string | null;
    category: string;
    config: QuoteConfig;
    onSubmit: (data: any) => Promise<void>;
}

export function DynamicQuoteForm({ quoteId, roomId, category, config, onSubmit }: DynamicQuoteFormProps) {
    const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(createQuoteItemSchema),
        defaultValues: {
            quoteId,
            roomId: roomId || undefined,
            category: category as any,
            quantity: 1,
            width: 0,
            height: 0,
            foldRatio: config.mode === 'advanced' ? 2 : undefined
        }
    });

    const isFieldVisible = (fieldId: string) => {
        // Advanced mode shows essential fields anyway, but simple mode is strict
        if (config.mode === 'advanced') return true;
        return config.visibleFields.includes(fieldId);
    };

    const handleFormSubmit = async (data: any) => {
        await onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Product Selection (Always Visible) */}
                <div className="space-y-2 col-span-2">
                    <Label>选择商品</Label>
                    <ProductAutocomplete
                        category={category}
                        onSelect={(p) => {
                            setValue('productId', p.id);
                            setValue('productName', p.name);
                            if (p.unitPrice) setValue('unitPrice', Number(p.unitPrice));
                        }}
                    />
                    {errors.productName && <p className="text-xs text-destructive">{errors.productName.message as string}</p>}
                </div>

                {/* 2. Basic Dimensions */}
                {isFieldVisible('width') && (
                    <div className="space-y-2">
                        <Label>宽度 (cm)</Label>
                        <Input type="number" {...register('width', { valueAsNumber: true })} />
                    </div>
                )}
                {isFieldVisible('height') && (
                    <div className="space-y-2">
                        <Label>高度 (cm)</Label>
                        <Input type="number" {...register('height', { valueAsNumber: true })} />
                    </div>
                )}

                {/* 3. Advanced Fields */}
                {isFieldVisible('foldRatio') && (
                    <div className="space-y-2">
                        <Label>褶皱倍数</Label>
                        <Input type="number" step="0.1" {...register('foldRatio', { valueAsNumber: true })} />
                    </div>
                )}

                {isFieldVisible('processFee') && (
                    <div className="space-y-2">
                        <Label>加工费单位价格</Label>
                        <Input type="number" step="0.01" {...register('processFee', { valueAsNumber: true })} />
                    </div>
                )}

                <div className="space-y-2">
                    <Label>单价</Label>
                    <Input type="number" step="0.01" {...register('unitPrice', { valueAsNumber: true })} />
                </div>

                <div className="space-y-2">
                    <Label>数量</Label>
                    <Input type="number" step="0.01" {...register('quantity', { valueAsNumber: true })} />
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? '保存中...' : '添加到报价单'}
                </Button>
            </div>
        </form>
    );
}
