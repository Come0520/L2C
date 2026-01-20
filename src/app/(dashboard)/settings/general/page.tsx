import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Building2, MapPin, Phone, Mail } from 'lucide-react';

/**
 * 租户基本信息设置页面
 */
export default function GeneralSettingsPage() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="租户信息"
                subtitle="管理您的企业基本信息"
            />

            <div className="grid gap-6 md:grid-cols-2">
                {/* 企业信息 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            企业信息
                        </CardTitle>
                        <CardDescription>
                            您的企业基本资料
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">企业名称</label>
                            <div className="text-muted-foreground">示例窗帘店</div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">统一社会信用代码</label>
                            <div className="text-muted-foreground">91110000XXXXXXXXXX</div>
                        </div>
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
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>北京市朝阳区XX路XX号</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>010-12345678</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>contact@example.com</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <p className="text-sm text-muted-foreground">
                如需修改企业信息，请联系系统管理员
            </p>
        </div>
    );
}
