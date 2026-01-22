import { RoomTypesConfig } from '@/features/settings/components/room-types-config';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';

/**
 * 空间类型设置页面
 * 允许租户自定义报价单中的空间选择器选项
 */
export default function RoomTypesSettingsPage() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="空间类型配置"
                subtitle="自定义报价单中可选择的空间类型，分组显示在添加空间下拉菜单中"
            />
            <RoomTypesConfig />
        </div>
    );
}
