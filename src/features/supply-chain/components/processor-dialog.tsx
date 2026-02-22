'use client';
import { logger } from '@/shared/lib/logger';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSupplierSchema } from '../schemas';
import { createSupplier, updateSupplier } from '../actions/supplier-actions';
import { toast } from 'sonner';
import { useEffect, useState, useTransition } from 'react';
import { ProcessorFormBasic } from './processor-form-basic';
import { ProcessorFormPrices } from './processor-form-prices';
import { ProcessorFormFiles } from './processor-form-files';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { z } from 'zod';
import { ProcessorInitialData } from '../types';

// 扩展 Schema 类型以适应表单
type CreateSupplierInput = z.input<typeof createSupplierSchema>;


interface ProcessorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: ProcessorInitialData;
    onSuccess?: () => void;
}

export function ProcessorDialog({ open, onOpenChange, initialData, onSuccess }: ProcessorDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState("basic");

    const form = useForm<CreateSupplierInput>({
        resolver: zodResolver(createSupplierSchema),
        defaultValues: {
            supplierType: 'PROCESSOR' as const,
            paymentPeriod: 'CASH' as const,
            processingPrices: { items: [] },
            ...initialData as Partial<CreateSupplierInput>
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                supplierType: 'PROCESSOR',
                paymentPeriod: 'CASH',
                processingPrices: initialData?.processingPrices || { items: [] },
                ...initialData as Partial<CreateSupplierInput>
            });
        } else {
            setTimeout(() => setActiveTab("basic"), 0);
        }
    }, [initialData, open, form]);

    const onSubmit = (data: z.input<typeof createSupplierSchema>) => {
        startTransition(async () => {
            try {
                if (initialData?.id) {
                    // Update
                    const res = await updateSupplier({ ...data, id: initialData.id } as Parameters<typeof updateSupplier>[0]);
                    if (res?.error) {
                        toast.error('更新失败', { description: res.error });
                    } else {
                        toast.success('加工厂更新成功');
                        onSuccess?.();
                        onOpenChange(false);
                    }
                } else {
                    // Create
                    const res = await createSupplier(data as Parameters<typeof createSupplier>[0]);
                    if (res?.error) {
                        toast.error('创建失败', { description: res.error });
                    } else {
                        toast.success('加工厂创建成功');
                        onSuccess?.();
                        onOpenChange(false);
                    }
                }
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : '未知系统错误';
                toast.error('保存失败', { description: message });
                logger.error(error);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{initialData ? '编辑加工厂' : '新建加工厂'}</DialogTitle>
                    <DialogDescription>
                        填写加工厂基础信息、配置加工费及管理资质文件。
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-2 pr-2">
                    <FormProvider {...form}>
                        <form id="processor-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-3 mb-6">
                                    <TabsTrigger value="basic">基础信息</TabsTrigger>
                                    <TabsTrigger value="prices">加工费配置</TabsTrigger>
                                    <TabsTrigger value="files">资质与合同</TabsTrigger>
                                </TabsList>

                                <TabsContent value="basic" className="space-y-4">
                                    <ProcessorFormBasic />
                                </TabsContent>

                                <TabsContent value="prices" className="space-y-4">
                                    <ProcessorFormPrices />
                                </TabsContent>

                                <TabsContent value="files" className="space-y-4">
                                    <ProcessorFormFiles />
                                </TabsContent>
                            </Tabs>
                        </form>
                    </FormProvider>
                </div>

                <div className="pt-4 border-t mt-auto flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
                        取消
                    </Button>
                    <Button type="submit" form="processor-form" disabled={isPending}>
                        {isPending ? '保存中...' : '保存'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
