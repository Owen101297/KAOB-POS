'use client';

import { useState } from 'react';
import { Banknote, CalendarDays, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/utils';

const DENOMINATIONS = [5000, 10000, 20000, 50000, 100000];

const fmt = (n: number) =>
  n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export default function AperturaCajaPage() {
  const [amount, setAmount] = useState('');

  const numeric = Number(amount.replace(/[^\d]/g, '')) || 0;

  return (
    <div>
      <PageHeader
        title="Apertura de caja"
        description="Registra la base inicial para comenzar el turno."
      />

      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <span className="mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Banknote className="h-5 w-5" />
            </span>
            <CardTitle className="text-base">Turno de hoy</CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" /> Sábado, 22 de agosto de 2026
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <label htmlFor="monto" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Monto inicial en efectivo
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                  $
                </span>
                <Input
                  id="monto"
                  inputMode="numeric"
                  placeholder="0"
                  value={amount ? fmt(numeric) : ''}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-14 pl-9 text-2xl font-bold tabular-nums"
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Base sugerida para cambio: $ 100.000
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Montos rápidos
              </p>
              <div className="flex flex-wrap gap-2">
                {DENOMINATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setAmount(String(d))}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-xs font-semibold outline-none transition-all focus-visible:ring-2 focus-visible:ring-brand-500/40',
                      numeric === d
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {fmt(d)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl bg-brand-50/70 p-3.5 ring-1 ring-inset ring-brand-100">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <p className="text-[13px] leading-relaxed text-brand-900/80">
                El monto inicial queda registrado como base del turno y se tendrá en cuenta en el
                cierre de caja para calcular el cuadre.
              </p>
            </div>
          </CardContent>

          <CardFooter className="justify-end gap-2">
            <Button variant="outline">Cancelar</Button>
            <Button size="lg" disabled={numeric <= 0}>
              Abrir caja con {fmt(numeric)}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
