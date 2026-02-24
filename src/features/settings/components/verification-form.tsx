'use client';

import { useState, useRef, useTransition, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Badge } from '@/shared/ui/badge';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Upload from 'lucide-react/dist/esm/icons/upload';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Clock from 'lucide-react/dist/esm/icons/clock';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import { toast } from 'sonner';
import {
    getVerificationStatus,
    submitVerification,
    uploadBusinessLicense,
} from '../actions/tenant-info';
import type { VerificationInfo, VerificationStatus } from '../types/tenant';
import Image from 'next/image';

interface VerificationFormProps {
    /** 租户名称 */
    tenantName: string;
    /** 租户统一社会信用代码 */
    tenantCode: string;
    /** 是否有编辑权限 */
    canEdit: boolean;
}

/**
 * 认证状态配置
 */
const statusConfig: Record<VerificationStatus, {
    label: string;
    color: string;
    icon: React.ReactNode;
    description: string;
}> = {
    unverified: {
        label: '未认证',
        color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        icon: <AlertCircle className="h-4 w-4" />,
        description: '企业尚未提交认证申请',
    },
    pending: {
        label: '审核中',
        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        icon: <Clock className="h-4 w-4" />,
        description: '认证申请已提交，等待平台审核',
    },
    verified: {
        label: '已认证',
        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        icon: <CheckCircle2 className="h-4 w-4" />,
        description: '恭喜！企业已通过认证',
    },
    rejected: {
        label: '已拒绝',
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        icon: <XCircle className="h-4 w-4" />,
        description: '认证申请被拒绝，请修改后重新提交',
    },
};

/**
 * 企业认证表单组件
 * 用于提交企业认证申请
 */
export function VerificationForm({ tenantName, tenantCode, canEdit }: VerificationFormProps) {
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(true);
    const [verificationInfo, setVerificationInfo] = useState<VerificationInfo | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 表单数据
    const [formData, setFormData] = useState({
        legalRepName: '',
        registeredCapital: '',
        businessScope: '',
    });
    const [licenseUrl, setLicenseUrl] = useState<string | null>(null);
    const [isUploadingLicense, setIsUploadingLicense] = useState(false);

    // 加载认证状态
    useEffect(() => {
        async function loadVerificationStatus() {
            try {
                const result = await getVerificationStatus();
                if (result.success) {
                    setVerificationInfo(result.data);
                    // 填充已有数据
                    setFormData({
                        legalRepName: result.data.legalRepName || '',
                        registeredCapital: result.data.registeredCapital || '',
                        businessScope: result.data.businessScope || '',
                    });
                    setLicenseUrl(result.data.businessLicenseUrl);
                }
            } finally {
                setIsLoading(false);
            }
        }
        loadVerificationStatus();
    }, []);

    /** 处理输入变化 */
    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    /** 触发文件选择 */
    const handleLicenseClick = () => {
        if (canEdit && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    /** 处理营业执照上传 */
    const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingLicense(true);
        try {
            const formData = new FormData();
            formData.append('license', file);

            const result = await uploadBusinessLicense(formData);
            if (result.success) {
                setLicenseUrl(result.licenseUrl);
                toast.success('营业执照已上传');
            } else {
                toast.error(result.error || '上传失败');
            }
        } catch {
            toast.error('上传失败，请稍后重试');
        } finally {
            setIsUploadingLicense(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    /** 提交认证申请 */
    const handleSubmit = () => {
        if (!licenseUrl) {
            toast.error('请上传营业执照');
            return;
        }
        if (!formData.legalRepName.trim()) {
            toast.error('请填写法定代表人');
            return;
        }

        startTransition(async () => {
            const result = await submitVerification({
                ...formData,
                businessLicenseUrl: licenseUrl,
            });
            if (result.success) {
                toast.success('认证申请已提交');
                // 刷新状态
                const statusResult = await getVerificationStatus();
                if (statusResult.success) {
                    setVerificationInfo(statusResult.data);
                }
            } else {
                toast.error(result.error || '提交失败');
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const currentStatus = verificationInfo?.status || 'unverified';
    const config = statusConfig[currentStatus];
    const canSubmit = currentStatus === 'unverified' || currentStatus === 'rejected';

    return (
        <div className="space-y-6">
            {/* 认证状态卡片 */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5" />
                                企业认证
                            </CardTitle>
                            <CardDescription>
                                完成企业认证后，可获得认证标识，提升客户信任度
                            </CardDescription>
                        </div>
                        <Badge className={config.color}>
                            {config.icon}
                            <span className="ml-1">{config.label}</span>
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                    {currentStatus === 'rejected' && verificationInfo?.verificationRejectReason && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-700 dark:text-red-400">
                                <strong>拒绝原因：</strong>{verificationInfo.verificationRejectReason}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 认证表单（仅未认证或被拒绝时显示） */}
            {canSubmit && canEdit && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            认证信息
                        </CardTitle>
                        <CardDescription>
                            请填写企业信息并上传营业执照
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* 只读信息 */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>企业名称</Label>
                                <Input value={tenantName} disabled className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>统一社会信用代码</Label>
                                <Input value={tenantCode} disabled className="bg-muted" />
                            </div>
                        </div>

                        {/* 可编辑信息 */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="legalRepName">
                                    法定代表人 <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="legalRepName"
                                    value={formData.legalRepName}
                                    onChange={(e) => handleChange('legalRepName', e.target.value)}
                                    placeholder="请输入法定代表人姓名"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="registeredCapital">注册资本</Label>
                                <Input
                                    id="registeredCapital"
                                    value={formData.registeredCapital}
                                    onChange={(e) => handleChange('registeredCapital', e.target.value)}
                                    placeholder="如：100万元人民币"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="businessScope">经营范围</Label>
                            <Textarea
                                id="businessScope"
                                value={formData.businessScope}
                                onChange={(e) => handleChange('businessScope', e.target.value)}
                                placeholder="请输入企业经营范围"
                                className="min-h-[80px]"
                            />
                        </div>

                        {/* 营业执照上传 */}
                        <div className="space-y-2">
                            <Label>
                                营业执照 <span className="text-red-500">*</span>
                            </Label>
                            <div
                                className="relative border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                                onClick={handleLicenseClick}
                            >
                                {isUploadingLicense ? (
                                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                                ) : licenseUrl ? (
                                    <div className="relative w-full max-w-md aspect-4/3">
                                        <Image
                                            src={licenseUrl}
                                            alt="营业执照"
                                            fill
                                            className="object-contain rounded"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                                            <span className="text-white text-sm">点击更换</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">
                                            点击上传营业执照（支持 JPG、PNG、PDF，最大 5MB）
                                        </p>
                                    </>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                className="hidden"
                                onChange={handleLicenseUpload}
                            />
                        </div>

                        {/* 提交按钮 */}
                        <div className="flex justify-end">
                            <Button
                                onClick={handleSubmit}
                                disabled={isPending || !licenseUrl || !formData.legalRepName.trim()}
                            >
                                {isPending ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                    <ShieldCheck className="h-4 w-4 mr-1" />
                                )}
                                提交认证申请
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 已认证信息展示 */}
            {currentStatus === 'verified' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-5 w-5" />
                            认证详情
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-sm text-muted-foreground">法定代表人</p>
                                <p className="font-medium">{verificationInfo?.legalRepName || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">注册资本</p>
                                <p className="font-medium">{verificationInfo?.registeredCapital || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">认证时间</p>
                                <p className="font-medium">
                                    {verificationInfo?.verifiedAt
                                        ? new Date(verificationInfo.verifiedAt).toLocaleDateString('zh-CN')
                                        : '-'}
                                </p>
                            </div>
                        </div>
                        {verificationInfo?.businessScope && (
                            <div>
                                <p className="text-sm text-muted-foreground">经营范围</p>
                                <p className="font-medium">{verificationInfo.businessScope}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
