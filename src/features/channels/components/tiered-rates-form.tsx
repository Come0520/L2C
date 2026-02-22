'use client';

import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { ChannelInput } from '../actions/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface TieredRatesFormProps {
    form: UseFormReturn<ChannelInput>;
}

export function TieredRatesForm({ form }: TieredRatesFormProps) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'tieredRates',
    });

    const addTier = () => {
        append({ minAmount: 0, rate: 0 });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">阶梯费率配置</CardTitle>
                <Button variant="outline" size="sm" onClick={addTier} type="button">
                    <Plus className="h-4 w-4 mr-2" />
                    添加规则
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {fields.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4">
                        暂无阶梯规则，请点击上方按钮添加
                    </div>
                )}

                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-3 p-3 bg-muted/50 rounded-lg">
                        <FormField
                            control={form.control}
                            name={`tieredRates.${index}.minAmount`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel className="text-xs">最小金额 (元)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            {...field}
                                            value={(field.value as number | string) ?? ''}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="pb-3 text-muted-foreground">至</div>
                        <FormField
                            control={form.control}
                            name={`tieredRates.${index}.maxAmount`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel className="text-xs">最大金额 (可选)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="无穷大"
                                            {...field}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                field.onChange(val === '' ? undefined : val);
                                            }}
                                            value={(field.value as number | string) ?? ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="pb-3 text-muted-foreground">返点</div>
                        <FormField
                            control={form.control}
                            name={`tieredRates.${index}.rate`}
                            render={({ field }) => (
                                <FormItem className="w-24">
                                    <FormLabel className="text-xs">比例 (%)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            {...field}
                                            value={(field.value as number | string) ?? ''}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="mb-0.5 text-destructive hover:text-destructive/90"
                            onClick={() => remove(index)}
                            type="button"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                {form.formState.errors.tieredRates && !Array.isArray(form.formState.errors.tieredRates) && (
                    <p className="text-sm font-medium text-destructive mt-2">
                        {(form.formState.errors.tieredRates as { message?: string } | undefined)?.message}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
