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
import { useFormContext } from 'react-hook-form';
import { PhotoUpload } from '@/shared/components/photo-upload/photo-upload';
import { format } from 'date-fns';

export function ProcessorFormFiles() {
    const form = useFormContext();

    // 辅助组件：单图上传适配
    const SingleImageUpload = ({ value, onChange, label }: { value?: string, onChange: (val?: string) => void, label: string }) => {
        const valArr = value ? [value] : [];
        return (
            <div className="space-y-2">
                <FormLabel>{label}</FormLabel>
                <div className="border rounded-md p-4">
                    <PhotoUpload
                        value={valArr}
                        onChange={(arr) => onChange(arr.length > 0 ? arr[0] : undefined)}
                        maxFiles={1}
                    />
                    <p className="text-xs text-muted-foreground mt-2">支持 JPG, PNG 格式，用于预览</p>
                </div>
            </div>
        );
    };

    return (
        <div className="grid gap-6 py-4">
            {/* 合同区域 */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium border-b pb-2">合同信息</h3>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="contractExpiryDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>合同到期日</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type="date"
                                            value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                                            onChange={(e) => {
                                                // valueAsDate 返回的是 UTC 时间处理后的 Date 对象，或 null
                                                // 建议直接处理 string 转 Date，以避免时区问题
                                                const dateVal = e.target.value ? new Date(e.target.value) : undefined;
                                                field.onChange(dateVal);
                                            }}
                                        />
                                    </div>
                                </FormControl>
                                <FormDescription>
                                    系统将在到期前30天自动提醒
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* 占位，保持布局整齐 */}
                    <div />
                </div>

                <FormField
                    control={form.control}
                    name="contractUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <SingleImageUpload
                                    label="合同文件 (扫描件)"
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* 资质区域 */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium border-b pb-2">企业资质</h3>
                <FormField
                    control={form.control}
                    name="businessLicenseUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <SingleImageUpload
                                    label="营业执照"
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* 银行账户区域 */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium border-b pb-2">财务信息</h3>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>开户银行</FormLabel>
                                <FormControl>
                                    <Input placeholder="如：招商银行杭州分行" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="bankAccount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>银行账号</FormLabel>
                                <FormControl>
                                    <Input placeholder="请输入银行账号" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
        </div>
    );
}
