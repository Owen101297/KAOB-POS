import * as React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3', className)}>
      <div>
        <h1 className="m-0 text-lg sm:text-xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-0.5 text-xs sm:text-[13px] text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
