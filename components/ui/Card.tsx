import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-slate-200/70 bg-white text-slate-700 shadow-card',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1 border-b border-slate-100 px-5 py-4', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-sm font-semibold leading-tight text-slate-900', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-xs text-slate-400', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-2 border-t border-slate-100 px-5 py-3.5', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

interface CardHeadingProps {
  icon?: React.ReactNode;
  titulo: string;
  descripcion?: string;
  children?: React.ReactNode;
}

/** Encabezado de tarjeta con icono + título + descripción y acciones a la derecha */
const CardHeading = ({ icon, titulo, descripcion, children }: CardHeadingProps) => (
  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
    <div className="flex items-start gap-2.5">
      {icon && (
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          {icon}
        </span>
      )}
      <div>
        <h3 className="text-sm font-semibold leading-tight text-slate-900">{titulo}</h3>
        {descripcion && <p className="mt-0.5 text-xs text-slate-400">{descripcion}</p>}
      </div>
    </div>
    {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
  </div>
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardHeading };
