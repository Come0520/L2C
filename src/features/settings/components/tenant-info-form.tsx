'use client';

import { useState, useRef, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Building2, Phone, MapPin, Mail, Upload, Pencil, Save, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateTenantInfo, uploadTenantLogo, type TenantInfo } from '../actions/tenant-info';
import Image from 'next/image';
import { useTenant } from '@/shared/providers/tenant-provider';

interface TenantInfoFormProps {
    /** 初始租户信息 */
    initialData: TenantInfo;
    /** 是否有编辑权限 */
    canEdit: boolean;
}

/**
 * 租户信息表单组件
 * 支持展示和编辑两种模式
 */
export function TenantInfoForm({ initialData, canEdit }: TenantInfoFormProps) {
    const { refreshTenant } = useTenant();
    const [isEditing, setIsEditing] = useState(false);
    const [isPending, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 表单数据
    const [formData, setFormData] = useState({
        name: initialData.name,
        address: initialData.contact.address,
        phone: initialData.contact.phone,
        email: initialData.contact.email,
    });

    // Logo URL (本地状态用于预览)
    const [logoUrl, setLogoUrl] = useState(initialData.logoUrl);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);

    /** 处理输入变化 */
    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    /** 取消编辑 */
    const handleCancel = () => {
        setFormData({
            name: initialData.name,
            address: initialData.contact.address,
            phone: initialData.contact.phone,
            email: initialData.contact.email,
        });
        setIsEditing(false);
    };

    /** 保存更改 */
    const handleSave = () => {
        startTransition(async () => {
            const result = await updateTenantInfo(formData);
            if (result.success) {
                toast.success('企业信息已更新');
                setIsEditing(false);
                refreshTenant(); // 刷新租户上下文以同步侧边栏
            } else {
                toast.error(result.error || '更新失败');
            }
        });
    };

    /** 触发文件选择 */
    const handleLogoClick = () => {
        if (canEdit && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    /** 处理 Logo 上传 */
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingLogo(true);
        try {
            const formData = new FormData();
            formData.append('logo', file);

            const result = await uploadTenantLogo(formData);
            if (result.success) {
                setLogoUrl(result.logoUrl);
                toast.success('Logo 已更新');
                refreshTenant(); // 刷新租户上下文以同步侧边栏
            } else {
                toast.error(result.error || '上传失败');
            }
        } catch {
            toast.error('上传失败，请稍后重试');
        } finally {
            setIsUploadingLogo(false);
            // 清空 input 以便重复选择同一文件
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Logo 区域 */}
            <div className="flex items-center gap-6">
                <div
                    className={`relative w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted ${canEdit ? 'cursor-pointer hover:border-primary transition-colors' : ''}`}
                    onClick={handleLogoClick}
                >
                    {isUploadingLogo ? (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : logoUrl ? (
                        <Image
                            src={logoUrl}
                            alt="企业 Logo"
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <Building2 className="h-10 w-10 text-muted-foreground" />
                    )}
                    {canEdit && !isUploadingLogo && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Upload className="h-6 w-6 text-white" />
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="font-semibold text-lg">{formData.name || '未设置企业名称'}</h3>
                    <p className="text-sm text-muted-foreground">统一社会信用代码: {initialData.code}</p>
                    {canEdit && (
                        <p className="text-xs text-muted-foreground mt-1">点击 Logo 上传新图片</p>
                    )}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleLogoUpload}
                />
            </div>

            {/* 信息卡片 */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* 企业信息 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                企业信息
                            </CardTitle>
                            <CardDescription>
                                您的企业基本资料
                            </CardDescription>
                        </div>
                        {canEdit && !isEditing && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                <Pencil className="h-4 w-4 mr-1" />
                                编辑
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isEditing ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="name">企业名称</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        placeholder="请输入企业名称"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>统一社会信用代码</Label>
                                    <Input value={initialData.code} disabled className="bg-muted" />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">企业名称</label>
                                    <p className="text-muted-foreground">{formData.name || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">统一社会信用代码</label>
                                    <p className="text-muted-foreground">{initialData.code}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* 联系方式 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="h-5 w-5" />
                            联系方式
                        </CardTitle>
                        <CardDescription>
                            企业联系信息
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isEditing ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="address">地址</Label>
                                    <Input
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => handleChange('address', e.target.value)}
                                        placeholder="请输入企业地址"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">电话</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        placeholder="请输入联系电话"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">邮箱</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        placeholder="请输入企业邮箱"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="h-4 w-4 shrink-0" />
                                    <span>{formData.address || '未设置'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-4 w-4 shrink-0" />
                                    <span>{formData.phone || '未设置'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Mail className="h-4 w-4 shrink-0" />
                                    <span>{formData.email || '未设置'}</span>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* 编辑模式下的操作按钮 */}
            {isEditing && (
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleCancel} disabled={isPending}>
                        <X className="h-4 w-4 mr-1" />
                        取消
                    </Button>
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-1" />
                        )}
                        保存
                    </Button>
                </div>
            )}

            {/* 非管理员提示 */}
            {!canEdit && (
                <p className="text-sm text-muted-foreground">
                    如需修改企业信息，请联系系统管理员
                </p>
            )}
        </div>
    );
}
