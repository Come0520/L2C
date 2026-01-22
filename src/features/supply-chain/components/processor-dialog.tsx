'use client';

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
import { createSupplierSchema, updateSupplierSchema } from '../schemas';
import { createSupplier, updateSupplier } from '../actions/supplier-actions';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { ProcessorFormBasic } from './processor-form-basic';
import { ProcessorFormPrices } from './processor-form-prices';
import { ProcessorFormFiles } from './processor-form-files';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { z } from 'zod';

// 扩展 Schema 类型以适应表单
type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
// type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

interface ProcessorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialData?: any;
    onSuccess?: () => void;
}

export function ProcessorDialog({ open, onOpenChange, initialData, onSuccess }: ProcessorDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");

    const form = useForm<CreateSupplierInput>({
        resolver: zodResolver(createSupplierSchema) as any,
        defaultValues: {
            supplierType: 'PROCESSOR',
            paymentPeriod: 'CASH',
            processingPrices: { items: [] },
            ...initialData
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                supplierType: 'PROCESSOR',
                paymentPeriod: 'CASH',
                processingPrices: initialData?.processingPrices || { items: [] },
                ...initialData
            });
            setActiveTab("basic");
        }
    }, [initialData, open, form]);

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            if (initialData?.id) {
                // Update
                const res = await updateSupplier({ ...data, id: initialData.id });
                if (res?.error) {
                    toast.error(res.error);
                } else {
                    toast.success('加工厂更新成功');
                    onSuccess?.();
                    onOpenChange(false);
                }
            } else {
                // Create
                const res = await createSupplier(data);
                if (res?.error) {
                    toast.error(res.error);
                } else {
                    toast.success('加工厂创建成功');
                    onSuccess?.();
                    onOpenChange(false);
                }
            }
        } catch (error) {
            toast.error('保存失败');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
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
                    <Button type="submit" form="processor-form" disabled={isSubmitting}>
                        {isSubmitting ? '保存中...' : '保存'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
