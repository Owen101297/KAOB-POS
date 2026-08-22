import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
  {
    variants: {
      variant: {
        success: 'bg-brand-50 text-brand-700 ring-brand-600/20',
        warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
        danger: 'bg-red-50 text-red-700 ring-red-600/20',
        info: 'bg-sky-50 text-sky-700 ring-sky-600/20',
        neutral: 'bg-slate-100 text-slate-600 ring-slate-500/20',
        outline: 'bg-transparent text-slate-500 ring-slate-300',
      },
    },
    defaultVariants: { variant: 'neutral' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
