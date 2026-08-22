import * as React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color?: 'brand' | 'sky' | 'amber' | 'red' | 'violet';
  trend?: number;
  hint?: string;
}

const COLORS = {
  brand: 'bg-brand-50 text-brand-600',
  sky: 'bg-sky-50 text-sky-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  violet: 'bg-violet-50 text-violet-600',
} as const;

export function StatCard({ label, value, icon, color = 'brand', trend, hint }: StatCardProps) {
  const up = typeof trend === 'number' && trend >= 0;
  return (
    <div className="group flex items-center gap-4 rounded-xl border border-slate-200/70 bg-white p-4 shadow-card transition-shadow duration-200 hover:shadow-card-hover">
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 [&_svg]:h-5 [&_svg]:w-5',
          COLORS[color]
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="mb-1 truncate text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold leading-none tracking-tight text-slate-900">{value}</span>
          {typeof trend === 'number' && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                up ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-600'
              )}
            >
              {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        {hint && <div className="mt-1 truncate text-[11px] text-slate-400">{hint}</div>}
      </div>
    </div>
  );
}
