'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { Button } from '@/shared/ui/button';
import { toast } from 'sonner';
import { attributionSettingsSchema, AttributionSettings, getAttributionSettings, updateAttributionSettingsAction } from '../actions/settings';
import { Loader2 } from 'lucide-react';

export function AttributionSettingsForm() {
    const [loading, setLoading] = React.useState(true);
    const form = useForm<AttributionSettings>({
        resolver: zodResolver(attributionSettingsSchema) as any,
        defaultValues: {
            attributionModel: 'LAST_TOUCH',
        },
    });

    useEffect(() => {
        const load = async () => {
            try {
                const settings = await getAttributionSettings();
                form.reset(settings);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [form]);

    const onSubmit = async (data: AttributionSettings) => {
        const res = await updateAttributionSettingsAction(data);
        if (res?.data?.success) {
            toast.success('归因规则已更新');
        } else {
            toast.error('更新失败');
        }
    };

    if (loading) {
        return <div className="h-[200px] flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>渠道归因规则配置</CardTitle>
                <CardDescription>设置系统如何判定客户来源及业绩归属</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="attributionModel"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>归因模型</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="flex flex-col space-y-1"
                                        >
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="FIRST_TOUCH" />
                                                </FormControl>
                                                <div className="space-y-1">
                                                    <FormLabel className="font-normal">
                                                        首次触点归因 (First Touch)
                                                    </FormLabel>
                                                    <div className="text-xs text-muted-foreground">
                                                        业绩归属于最早录入该客户的渠道。适用于强调拉新能力。
                                                    </div>
                                                </div>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-3 space-y-0 text-muted-foreground">
                                                <div className="w-px h-6 bg-border mx-2" />
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="LAST_TOUCH" />
                                                </FormControl>
                                                <div className="space-y-1">
                                                    <FormLabel className="font-normal">
                                                        末次触点归因 (Last Touch)
                                                    </FormLabel>
                                                    <div className="text-xs text-muted-foreground">
                                                        业绩归属于最终促成成交的渠道。适用于强调转化能力。（推荐）
                                                    </div>
                                                </div>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end">
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                保存配置
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
