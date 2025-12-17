'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2, Plus, Save, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card';
import { PaperInput } from '@/components/ui/paper-input';
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table';
import { quoteService } from '@/services/quotes.client';
import { productsService } from '@/services/products.client';
import { Product } from '@/shared/types/product';

import { createQuoteSchema, CreateQuoteFormData } from '../schemas/quote-schema';

import { ProductAutocomplete } from './product-autocomplete';

interface QuoteFormProps {
  initialData?: Partial<CreateQuoteFormData>;
  leadId?: string;
  quoteId?: string; // If editing existing quote
  isEditing?: boolean;
}

export function QuoteForm({ initialData, leadId, quoteId, isEditing = false }: QuoteFormProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // 乐观更新状态管理
  const [isOptimisticSaving, setIsOptimisticSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<CreateQuoteFormData | null>(null);

  // 加载产品列表
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const data = await productsService.getAllProducts();
        setProducts(data);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors, isSubmitting }
  } = useForm<CreateQuoteFormData>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: initialData || {
      projectName: '',
      projectAddress: '',
      items: [
        {
          productName: '',
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
          category: 'standard',
          space: 'default',
          imageUrl: '',
          productId: ''
        }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');

  // Auto-calculate total price when quantity or unit price changes
  useEffect(() => {
    watchedItems?.forEach((item, index) => {
      const total = (item.quantity || 0) * (item.unitPrice || 0);
      if (total !== item.totalPrice) {
        setValue(`items.${index}.totalPrice`, total);
      }
    });
  }, [watchedItems, setValue]);

  const totalAmount = watchedItems?.reduce((sum, item) => sum + (item.totalPrice || 0), 0) || 0;

  // 处理产品选择
  const handleProductSelect = (index: number, product: Product | null) => {
    if (product) {
      setValue(`items.${index}.productName`, product.productName);
      setValue(`items.${index}.productId`, product.id);
      setValue(`items.${index}.unitPrice`, product.prices?.retailPrice ?? 0);
      // 获取第一张详情图
      const imageUrl = product.images?.detailImages?.[0] || '';
      setValue(`items.${index}.imageUrl`, imageUrl);
    } else {
      setValue(`items.${index}.productId`, '');
      setValue(`items.${index}.imageUrl`, '');
    }
  };

  const onSubmit = async (data: CreateQuoteFormData) => {
    try {
      // 保存原始数据，用于回滚
      setOriginalData(getValues());
      // 乐观更新开始
      setIsOptimisticSaving(true);
      setSaveStatus('idle');
      setSaveError(null);

      if (isEditing && quoteId) {
        // 编辑模式下的乐观更新
        console.log('Update quote logic to be implemented', data);
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        alert('编辑功能暂未完全接入后端，请查看控制台输出');
        setSaveStatus('success');
        setTimeout(() => {
          router.push(`/quotes/${quoteId}`);
        }, 500);
      } else if (leadId) {
        // 新建模式下的乐观更新
        await quoteService.createBudgetQuote({
          ...data,
          leadId
        });
        setSaveStatus('success');
        // 延迟跳转，让用户看到成功状态
        setTimeout(() => {
          router.push(`/dashboard?leadId=${leadId}`);
        }, 500);
      }
    } catch (error) {
      console.error('Failed to save quote:', error);
      // 保存失败，回滚表单数据
      if (originalData) {
        reset(originalData);
      }
      setSaveError('保存失败，请重试');
      setSaveStatus('error');
    } finally {
      setIsOptimisticSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <PaperCard>
        <PaperCardHeader>
          <PaperCardTitle>{isEditing ? '编辑报价单' : '创建新报价单'}</PaperCardTitle>
        </PaperCardHeader>
        <PaperCardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PaperInput
              label="项目名称"
              placeholder="请输入项目名称"
              error={errors.projectName?.message}
              {...register('projectName')}
            />
            <PaperInput
              label="项目地址"
              placeholder="请输入项目地址"
              error={errors.projectAddress?.message}
              {...register('projectAddress')}
            />
          </div>
        </PaperCardContent>
      </PaperCard>

      <PaperCard>
        <PaperCardHeader>
          <div className="flex justify-between items-center">
            <PaperCardTitle>报价项目</PaperCardTitle>
            <PaperButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({
                productName: '',
                quantity: 1,
                unitPrice: 0,
                totalPrice: 0,
                category: 'standard',
                space: 'default',
                imageUrl: '',
                productId: ''
              })}
              icon={<Plus className="w-4 h-4" />}
            >
              添加项目
            </PaperButton>
          </div>
        </PaperCardHeader>
        <PaperCardContent>
          <div className="overflow-x-auto">
            <PaperTable>
              <PaperTableHeader>
                <PaperTableCell className="w-[60px]">图片</PaperTableCell>
                <PaperTableCell className="w-[200px]">产品名称</PaperTableCell>
                <PaperTableCell className="w-[120px]">空间</PaperTableCell>
                <PaperTableCell className="w-[100px]">数量</PaperTableCell>
                <PaperTableCell className="w-[120px]">单价</PaperTableCell>
                <PaperTableCell className="w-[120px]">总价</PaperTableCell>
                <PaperTableCell className="w-[50px]"></PaperTableCell>
              </PaperTableHeader>
              <PaperTableBody>
                {fields.map((field, index) => (
                  <PaperTableRow key={field.id}>
                    {/* 产品图片列 */}
                    <PaperTableCell>
                      <div className="w-12 h-12 rounded border border-paper-200 overflow-hidden bg-paper-100 flex items-center justify-center">
                        {watchedItems?.[index]?.imageUrl ? (
                          <Image
                            src={watchedItems[index].imageUrl!}
                            alt="产品图片"
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-ink-300" />
                        )}
                      </div>
                    </PaperTableCell>
                    {/* 产品名称 - 使用联想选择器 */}
                    <PaperTableCell>
                      <ProductAutocomplete
                        value={watchedItems?.[index]?.productName || ''}
                        onChange={(value) => setValue(`items.${index}.productName`, value)}
                        onProductSelect={(product) => handleProductSelect(index, product)}
                        products={products}
                        placeholder={isLoadingProducts ? '加载中...' : '输入产品名称搜索...'}
                        error={errors.items?.[index]?.productName?.message}
                        selectedProductId={watchedItems?.[index]?.productId}
                      />
                    </PaperTableCell>
                    <PaperTableCell>
                      <PaperInput
                        {...register(`items.${index}.space`)}
                        placeholder="空间"
                      />
                    </PaperTableCell>
                    <PaperTableCell>
                      <PaperInput
                        type="number"
                        min="1"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        error={errors.items?.[index]?.quantity?.message}
                      />
                    </PaperTableCell>
                    <PaperTableCell>
                      <PaperInput
                        type="number"
                        min="0"
                        step="0.01"
                        {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                        error={errors.items?.[index]?.unitPrice?.message}
                      />
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="py-2 px-3 bg-paper-50 rounded text-right font-medium">
                        ¥{watchedItems?.[index]?.totalPrice?.toLocaleString() || 0}
                      </div>
                    </PaperTableCell>
                    <PaperTableCell>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-ink-400 hover:text-error-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </PaperTableCell>
                  </PaperTableRow>
                ))}
                {fields.length === 0 && (
                  <PaperTableRow>
                    <PaperTableCell colSpan={7} className="text-center text-ink-400 py-8">
                      暂无报价项目，请点击右上角添加
                    </PaperTableCell>
                  </PaperTableRow>
                )}
              </PaperTableBody>
            </PaperTable>
          </div>

          <div className="flex justify-end mt-6">
            <div className="text-right">
              <span className="text-ink-500 mr-4">总计金额:</span>
              <span className="text-2xl font-bold text-primary-600">
                ¥{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </PaperCardContent>
      </PaperCard>

      {/* 保存状态反馈 */}
      {saveStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          报价单保存成功！
        </div>
      )}
      {saveStatus === 'error' && saveError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {saveError}
        </div>
      )}

      <div className="flex justify-end gap-4">
        <PaperButton
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isOptimisticSaving}
        >
          取消
        </PaperButton>
        <PaperButton
          type="submit"
          variant="primary"
          loading={isOptimisticSaving || isSubmitting}
          icon={<Save className="w-4 h-4" />}
        >
          {isOptimisticSaving ? '保存中...' : '保存报价单'}
        </PaperButton>
      </div>
    </form>
  );
}
