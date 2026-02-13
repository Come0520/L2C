'use client';

import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';

interface MeasureVersion {
    id: string;
    round: number;
    variant: string;
    versionDisplay: string;
    status: string;
}

interface VersionSwitcherProps {
    versions: MeasureVersion[];
    currentVersionId: string;
    onVersionChange: (versionId: string) => void;
    className?: string;
}

/**
 * 测量版本切换组件
 * 
 * 用于详情页切换查看不同测量方案版本
 * 格式：V{round}.{variant}，如 V1.A, V1.B, V2.A
 */
export function VersionSwitcher({
    versions,
    currentVersionId,
    onVersionChange,
    className,
}: VersionSwitcherProps) {
    if (!versions || versions.length <= 1) {
        return null; // 只有一个版本时不显示切换器
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <span className="text-sm text-muted-foreground">版本:</span>
            <div className="flex gap-1">
                {versions.map((version) => {
                    const isActive = version.id === currentVersionId;
                    const isArchived = version.status === 'ARCHIVED';

                    return (
                        <button
                            key={version.id}
                            onClick={() => onVersionChange(version.id)}
                            className={cn(
                                "px-3 py-1 text-sm rounded-md border transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background hover:bg-accent border-border",
                                isArchived && "opacity-50"
                            )}
                        >
                            {version.versionDisplay || `V${version.round}.${version.variant}`}
                            {isArchived && (
                                <Badge variant="outline" className="ml-1 text-xs">
                                    归档
                                </Badge>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default VersionSwitcher;
