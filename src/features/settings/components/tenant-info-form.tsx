'use client';

import { useState, useRef, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import Building2 from 'lucide-react/dist/esm/icons/building';
import QrCode from 'lucide-react/dist/esm/icons/qr-code';
import Phone from 'lucide-react/dist/esm/icons/phone';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Upload from 'lucide-react/dist/esm/icons/upload';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import Globe from 'lucide-react/dist/esm/icons/globe';
import Download from 'lucide-react/dist/esm/icons/download';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Save from 'lucide-react/dist/esm/icons/save';
import X from 'lucide-react/dist/esm/icons/x';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import { toast } from 'sonner';
import {
  updateTenantInfo,
  uploadTenantLogo,
  uploadWechatQrcode,
  uploadLandingCover,
} from '../actions/tenant-info';
import type { TenantInfo, VerificationStatus } from '../types/tenant';
import Image from 'next/image';
import Link from 'next/link';
import { useTenant } from '@/shared/providers/tenant-provider';
import { VerificationBadge } from '@/shared/ui/verification-badge';

interface TenantInfoFormProps {
  /** 初始租户信息 */
  initialData: TenantInfo;
  /** 认证状态 */
  verificationStatus?: VerificationStatus;
  /** 是否有编辑权限 */
  canEdit: boolean;
}

/**
 * 租户信息表单组件
 * 支持展示和编辑两种模式
 */
export function TenantInfoForm({
  initialData,
  canEdit,
  verificationStatus = 'unverified',
}: TenantInfoFormProps) {
  const { refreshTenant } = useTenant();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: initialData.name,
    address: initialData.contact.address,
    phone: initialData.contact.phone,
    email: initialData.contact.email,
    slogan: initialData.slogan || '',
    detailAddress: initialData.detailAddress || '',
    contactWechat: initialData.contactWechat || '',
  });

  // Logo URL (本地状态用于预览)
  const [logoUrl, setLogoUrl] = useState(initialData.logoUrl);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [wechatQrcodeUrl, setWechatQrcodeUrl] = useState(initialData.wechatQrcodeUrl);
  const [isUploadingQrcode, setIsUploadingQrcode] = useState(false);
  const qrcodeInputRef = useRef<HTMLInputElement>(null);

  // 封面图状态
  const [landingCoverUrl, setLandingCoverUrl] = useState(initialData.landingCoverUrl);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  /** 处理输入变化 */
  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /** 取消编辑 */
  const handleCancel = () => {
    setFormData({
      name: initialData.name,
      address: initialData.contact.address,
      phone: initialData.contact.phone,
      email: initialData.contact.email,
      slogan: initialData.slogan || '',
      detailAddress: initialData.detailAddress || '',
      contactWechat: initialData.contactWechat || '',
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

  /** 触发微信二维码文件选择 */
  const handleQrcodeClick = () => {
    if (canEdit && qrcodeInputRef.current) {
      qrcodeInputRef.current.click();
    }
  };

  /** 处理微信二维码上传 */
  const handleQrcodeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingQrcode(true);
    try {
      const fd = new FormData();
      fd.append('qrcode', file);

      const result = await uploadWechatQrcode(fd);
      if (result.success) {
        setWechatQrcodeUrl(result.qrcodeUrl);
        toast.success('微信二维码已更新');
        refreshTenant();
      } else {
        toast.error(result.error || '上传失败');
      }
    } catch {
      toast.error('上传失败，请稍后重试');
    } finally {
      setIsUploadingQrcode(false);
      if (qrcodeInputRef.current) {
        qrcodeInputRef.current.value = '';
      }
    }
  };

  /** 触发封面图文件选择 */
  const handleCoverClick = () => {
    if (canEdit && coverInputRef.current) {
      coverInputRef.current.click();
    }
  };

  /** 处理封面图上传 */
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append('cover', file);

      const result = await uploadLandingCover(fd);
      if (result.success) {
        setLandingCoverUrl(result.coverUrl);
        toast.success('封面图已更新');
      } else {
        toast.error(result.error || '上传失败');
      }
    } catch {
      toast.error('上传失败，请稍后重试');
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) {
        coverInputRef.current.value = '';
      }
    }
  };

  /** 处理下载推广码 */
  const handleDownloadPromoCode = async () => {
    try {
      const response = await fetch(
        `/api/miniprogram/tenant/landing-qrcode?code=${initialData.code}`
      );
      if (!response.ok) {
        throw new Error('下载推广码失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `小程序推广码-${initialData.name}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (_error) {
      toast.error('无法下载推广码');
    }
  };

  return (
    <div className="space-y-6">
      {/* 认证状态引导卡片 */}
      <div className="bg-muted/50 flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-4">
          <div
            className={`rounded-full p-2 ${verificationStatus === 'verified' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
          >
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="flex items-center gap-2 font-medium">
              企业认证状态
              <VerificationBadge status={verificationStatus} size="sm" />
            </h4>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {verificationStatus === 'verified'
                ? '您的企业已通过认证，享有专属标识。'
                : '完成企业认证，提升客户信任度。'}
            </p>
          </div>
        </div>
        {verificationStatus !== 'verified' && (
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings/verification">
              去认证
              <ChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        )}
        {verificationStatus === 'verified' && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/settings/verification">
              查看详情
              <ChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        )}
      </div>

      {/* Logo 区域 */}
      <div className="flex items-center gap-6">
        <div
          className={`border-muted-foreground/25 bg-muted relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed ${canEdit ? 'hover:border-primary cursor-pointer transition-colors' : ''}`}
          onClick={handleLogoClick}
        >
          {isUploadingLogo ? (
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          ) : logoUrl ? (
            <Image src={logoUrl} alt="企业 Logo" fill className="object-cover" />
          ) : (
            <Building2 className="text-muted-foreground h-10 w-10" />
          )}
          {canEdit && !isUploadingLogo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
              <Upload className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold">{formData.name || '未设置企业名称'}</h3>
          <p className="text-muted-foreground text-sm">
            统一社会信用代码: {initialData.creditCode || '未设置，请在企业认证中填写'}
          </p>
          {canEdit && <p className="text-muted-foreground mt-1 text-xs">点击 Logo 上传新图片</p>}
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
              <CardDescription>您的企业基本资料</CardDescription>
            </div>
            {canEdit && !isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="mr-1 h-4 w-4" />
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
                  <Input
                    value={initialData.creditCode || '未设置，请在企业认证中填写'}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-muted-foreground text-xs">
                    信用代码仅可在企业认证时填写，认证通过后锁定
                  </p>
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
                  <p className="text-muted-foreground">
                    {initialData.creditCode || '未设置，请在企业认证中填写'}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 联系方式 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                联系方式
              </CardTitle>
              <CardDescription>企业联系信息</CardDescription>
            </div>
            {canEdit && !isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="mr-1 h-4 w-4" />
                编辑
              </Button>
            )}
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
                <div className="text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{formData.address || '未设置'}</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{formData.phone || '未设置'}</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{formData.email || '未设置'}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 微信二维码 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              微信二维码
            </CardTitle>
            <CardDescription>上传微信二维码，将展示在报价单上</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div
                className={`border-muted-foreground/25 bg-muted relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed ${canEdit ? 'hover:border-primary cursor-pointer transition-colors' : ''}`}
                onClick={handleQrcodeClick}
              >
                {isUploadingQrcode ? (
                  <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                ) : wechatQrcodeUrl ? (
                  <Image
                    src={wechatQrcodeUrl}
                    alt="微信二维码"
                    fill
                    className="object-contain p-1"
                  />
                ) : (
                  <QrCode className="text-muted-foreground h-10 w-10" />
                )}
                {canEdit && !isUploadingQrcode && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
                    <Upload className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
              <div className="text-sm">
                {wechatQrcodeUrl ? (
                  <p className="text-muted-foreground">已上传微信二维码</p>
                ) : (
                  <p className="text-muted-foreground">未上传微信二维码</p>
                )}
                {canEdit && (
                  <p className="text-muted-foreground mt-1 text-xs">点击上传或替换二维码图片</p>
                )}
              </div>
            </div>
            <input
              ref={qrcodeInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleQrcodeUpload}
            />
          </CardContent>
        </Card>

        {/* 落地页配置 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              小程序落地页配置
            </CardTitle>
            <CardDescription>设置租户在小程序落地页展示的内容</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="slogan">品牌标语 (Slogan)</Label>
                  <Input
                    id="slogan"
                    value={formData.slogan}
                    onChange={(e) => handleChange('slogan', e.target.value)}
                    placeholder="例如：专业的居家窗帘定制服务"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactWechat">联系微信号</Label>
                  <Input
                    id="contactWechat"
                    value={formData.contactWechat}
                    onChange={(e) => handleChange('contactWechat', e.target.value)}
                    placeholder="客户可加的销售微信"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="detailAddress">门店详细地址</Label>
                  <Input
                    id="detailAddress"
                    value={formData.detailAddress}
                    onChange={(e) => handleChange('detailAddress', e.target.value)}
                    placeholder="门店详细地址，用于导航"
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">品牌标语</label>
                  <p className="text-muted-foreground">{formData.slogan || '未设置'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">联系微信号</label>
                  <p className="text-muted-foreground">{formData.contactWechat || '未设置'}</p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium">门店详细地址</label>
                  <p className="text-muted-foreground">{formData.detailAddress || '未设置'}</p>
                </div>
              </div>
            )}

            <div className="pt-2">
              <h4 className="mb-4 text-sm font-medium">封面背景图</h4>
              <div className="flex items-start gap-4">
                <div
                  className={`border-muted-foreground/25 bg-muted relative flex h-32 w-48 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed ${canEdit ? 'hover:border-primary cursor-pointer transition-colors' : ''}`}
                  onClick={handleCoverClick}
                >
                  {isUploadingCover ? (
                    <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                  ) : landingCoverUrl ? (
                    <Image src={landingCoverUrl} alt="落地页封面图" fill className="object-cover" />
                  ) : (
                    <ImageIcon className="text-muted-foreground h-10 w-10" />
                  )}
                  {canEdit && !isUploadingCover && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>
                <div className="text-sm">
                  {landingCoverUrl ? (
                    <p className="text-muted-foreground">已设置封面图</p>
                  ) : (
                    <p className="text-muted-foreground">未设置封面图，将使用默认背景</p>
                  )}
                  {canEdit && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      建议尺寸: 750x400，支持 JPG/PNG/WebP
                    </p>
                  )}
                </div>
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleCoverUpload}
              />
            </div>
          </CardContent>
        </Card>

        {/* 推广码展示下载卡片 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              专属推广码
            </CardTitle>
            <CardDescription>
              使用微信扫码，可直接进入您的专属落地页，也可以分享给客户做宣发推广
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border bg-white p-2">
                <Image
                  src={`/api/miniprogram/tenant/landing-qrcode?code=${initialData.code}`}
                  alt="小程序专属推广码"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  此推广码绑定了您的企业专属标识（{initialData.code}
                  ），客户扫码后将直接展示您的品牌标语、联系方式和门店地址信息。
                </p>
                <Button variant="outline" onClick={handleDownloadPromoCode}>
                  <Download className="mr-2 h-4 w-4" />
                  下载推广码海报
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 编辑模式下的操作按钮 */}
      {isEditing && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isPending}>
            <X className="mr-1 h-4 w-4" />
            取消
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            保存
          </Button>
        </div>
      )}

      {/* 非管理员提示 */}
      {!canEdit && (
        <p className="text-muted-foreground text-sm">如需修改企业信息，请联系系统管理员</p>
      )}
    </div>
  );
}
