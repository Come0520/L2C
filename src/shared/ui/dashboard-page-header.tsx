import { cn } from '../utils';

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
    <div
      className={cn(
        'mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center',
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}
