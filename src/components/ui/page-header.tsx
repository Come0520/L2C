'use client';

import React from 'react';
import { cn } from '@/shared/lib/utils';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  action?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  action,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn('flex flex-col gap-4 md:flex-row md:items-start md:justify-between', className)}
      {...props}
    >
      <div className="flex-1 space-y-1.5">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="text-muted-foreground mb-2 flex items-center text-sm">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight className="mx-1 h-4 w-4" />}
                {item.href ? (
                  <Link href={item.href} className="hover:text-foreground transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">{item.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-foreground text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2 pt-1 md:pt-0">{action}</div>}
    </div>
  );
}
