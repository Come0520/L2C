'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from '@/shared/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { useForm } from 'react-hook-form';
import { Search, RotateCcw } from 'lucide-react';

interface AdvancedFilterValues {
    type: string;
    priority: string;
    isWarranty: string;
}

interface AdvancedFiltersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentFilters: AdvancedFilterValues | null;
    onApply: (filters: AdvancedFilterValues) => void;
}

export function AdvancedFiltersDialog({
    open,
    onOpenChange,
    currentFilters,
    onApply
}: AdvancedFiltersDialogProps) {
    const form = useForm({
        defaultValues: {
            type: currentFilters?.type || 'all',
            priority: currentFilters?.priority || 'all',
            isWarranty: currentFilters?.isWarranty || 'all',
        }
    });

    const onSubmit = (values: AdvancedFilterValues) => {
        onApply(values);
        onOpenChange(false);
    };

    const onReset = () => {
        form.reset({
            type: 'all',
            priority: 'all',
            isWarranty: 'all',
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        高级筛选
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>售后类型</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="所有类型" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="all">所有类型</SelectItem>
                                            <SelectItem value="REPAIR">维修 (REPAIR)</SelectItem>
                                            <SelectItem value="RETURN">退货 (RETURN)</SelectItem>
                                            <SelectItem value="COMPLAINT">投诉 (COMPLAINT)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>优先级</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="所有优先级" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="all">所有优先级</SelectItem>
                                            <SelectItem value="HIGH">高 (HIGH)</SelectItem>
                                            <SelectItem value="MEDIUM">中 (MEDIUM)</SelectItem>
                                            <SelectItem value="LOW">低 (LOW)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="isWarranty"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>保修状态</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="所有" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="all">所有</SelectItem>
                                            <SelectItem value="true">保修内</SelectItem>
                                            <SelectItem value="false">保修外</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="flex gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={onReset} className="flex-1">
                                <RotateCcw className="mr-2 h-4 w-4" /> 重置
                            </Button>
                            <Button type="submit" className="flex-1">
                                <Search className="mr-2 h-4 w-4" /> 应用筛选
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
