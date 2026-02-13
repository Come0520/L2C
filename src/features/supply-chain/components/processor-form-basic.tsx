'use client';

import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    FormDescription,
} from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { useFormContext } from 'react-hook-form';

export function ProcessorFormBasic() {
    const form = useFormContext();

    return (
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>加工厂名称 <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                                <Input placeholder="请输入名称" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="supplierType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>类型</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="选择类型" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="PROCESSOR">仅加工厂</SelectItem>
                                    <SelectItem value="BOTH">兼供应商 (可供料)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>若该加工厂同时也供应面料，请选择"兼供应商"</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>联系人</FormLabel>
                            <FormControl>
                                <Input placeholder="姓名" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>联系电话</FormLabel>
                            <FormControl>
                                <Input placeholder="手机或固话" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                control={form.control}
                name="paymentPeriod"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>结算方式</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="选择结算方式" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="CASH">现结</SelectItem>
                                <SelectItem value="MONTHLY">月结</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>地址</FormLabel>
                        <FormControl>
                            <Input placeholder="详细地址" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="remark"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>备注</FormLabel>
                        <FormControl>
                            <Textarea placeholder="其他备注信息..." className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}
