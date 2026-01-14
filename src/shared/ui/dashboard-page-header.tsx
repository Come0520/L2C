import { cn } from "../utils";

interface DashboardPageHeaderProps {
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
    className?: string;
}

export function DashboardPageHeader({
    title,
    subtitle,
    children,
    className,
}: DashboardPageHeaderProps) {
    return (
        <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8", className)}>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {subtitle && (
                    <p className="text-sm text-gray-500 mt-1">
                        {subtitle}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-3">
                {children}
            </div>
        </div>
    );
}
