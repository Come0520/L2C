'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useForm } from 'react-hook-form';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card';
import { PaperInput, PaperTextarea } from '@/components/ui/paper-input';
import { salesOrderService } from '@/services/salesOrders.client';
import { OrderFormData } from '@/shared/types/order';

import { salesOrderSchema, SalesOrderFormData } from '../../schemas/sales-order-schema';

interface SalesOrderFormProps {
  initialData?: Partial<SalesOrderFormData>;
  leadId?: string;
  isEditing?: boolean;
}

export function SalesOrderForm({ initialData, leadId, isEditing = false }: SalesOrderFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SalesOrderFormData>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: initialData || {
      leadId: leadId,
      totalAmount: 0,
      discountAmount: 0,
      finalAmount: 0
    }
  });

  const onSubmit = async (data: SalesOrderFormData) => {
    try {
      if (isEditing) {
        // update logic
      } else {
        // Map SalesOrderFormData back to OrderFormData which is currently expected by the service
        // This is a temporary mapping until we fully migrate the service types
        const orderData: OrderFormData = {
          leadId: data.leadId || '',
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          projectAddress: data.projectAddress || '',
          designer: data.designer || '',
          salesPerson: data.salesPerson || '',
          expectedDeliveryTime: data.expectedDeliveryTime || '',
          totalAmount: data.totalAmount,
          // Add default values for required fields in OrderFormData
          leadNumber: '', // Should be generated or passed
          createTime: new Date().toISOString(),
          spacePackages: {},
          packageUsage: { cloth: 0, gauze: 0, track: 0 },
          curtains: [],
          wallcoverings: [],
          backgroundWalls: [],
          windowCushions: [],
          standardProducts: [],
          subtotals: { 
            curtain: 0, 
            wallcovering: 0, 
            'background-wall': 0, 
            'window-cushion': 0, 
            'standard-product': 0,
            discount: data.discountAmount || 0,
            tax: 0,
            total: data.totalAmount
          },
          packageAmount: 0,
          packageExcessAmount: 0,
          upgradeAmount: 0,
          customerId: data.customerId,
          discountAmount: data.discountAmount,
          finalAmount: data.finalAmount,
          remarks: data.remarks
        };
        
        await salesOrderService.createSalesOrder(orderData);
        router.push('/sales-orders');
      }
    } catch (error) {
      console.error('Failed to save sales order:', error);
      alert('保存失败');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <PaperCard>
        <PaperCardHeader>
          <PaperCardTitle>{isEditing ? '编辑销售单' : '创建销售单'}</PaperCardTitle>
        </PaperCardHeader>
        <PaperCardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PaperInput
              label="客户姓名"
              error={errors.customerName?.message}
              {...register('customerName')}
            />
            <PaperInput
              label="联系电话"
              error={errors.customerPhone?.message}
              {...register('customerPhone')}
            />
            <PaperInput
              label="项目地址"
              error={errors.projectAddress?.message}
              {...register('projectAddress')}
              fullWidth
              className="md:col-span-2"
            />
            <PaperInput
              label="设计师"
              {...register('designer')}
            />
            <PaperInput
              label="销售员"
              {...register('salesPerson')}
            />
            <PaperInput
              label="期望交付日期"
              type="date"
              {...register('expectedDeliveryTime')}
            />
          </div>
        </PaperCardContent>
      </PaperCard>

      <PaperCard>
        <PaperCardHeader>
          <PaperCardTitle>金额信息</PaperCardTitle>
        </PaperCardHeader>
        <PaperCardContent className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PaperInput
              label="订单总额"
              type="number"
              min="0"
              step="0.01"
              error={errors.totalAmount?.message}
              {...register('totalAmount', { valueAsNumber: true })}
            />
            <PaperInput
              label="优惠金额"
              type="number"
              min="0"
              step="0.01"
              error={errors.discountAmount?.message}
              {...register('discountAmount', { valueAsNumber: true })}
            />
            <PaperInput
              label="最终金额"
              type="number"
              min="0"
              step="0.01"
              error={errors.finalAmount?.message}
              {...register('finalAmount', { valueAsNumber: true })}
            />
           </div>
           <PaperTextarea
             label="备注"
             {...register('remarks')}
           />
        </PaperCardContent>
      </PaperCard>

      <div className="flex justify-end gap-4">
        <PaperButton
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          取消
        </PaperButton>
        <PaperButton
          type="submit"
          variant="primary"
          loading={isSubmitting}
          icon={<Save className="w-4 h-4" />}
        >
          保存销售单
        </PaperButton>
      </div>
    </form>
  );
}
