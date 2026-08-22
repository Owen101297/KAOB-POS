'use client';

import { useState } from 'react';
import { ArrowDownToLine, CheckCircle2 } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

const REASONS = ['Ingreso de capital', 'Cambio de billetes', 'Recarga de monedero', 'Otro'];

const fmt = (n: number) =>
  n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export default function IngresoEfectivoPage() {
  const [amount, setAmount] = useState('');
  const numeric = Number(amount.replace(/[^\d]/g, '')) || 0;

  return (
    <div>
      <PageHeader
        title="Ingresar efectivo"
        description="Registra entradas de dinero a la caja que no provienen de ventas."
      />

      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <span className="mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <ArrowDownToLine className="h-5 w-5" />
            </span>
            <CardTitle className="text-base">Nuevo ingreso</CardTitle>
            <CardDescription>Se sumará al movimiento de caja del turno actual.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <label htmlFor="monto" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Monto
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
            </div>

            <div>
              <label htmlFor="motivo" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Motivo
              </label>
              <Select defaultValue={REASONS[0]}>
                <SelectTrigger id="motivo" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="detalle" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Detalle (opcional)
              </label>
              <Input id="detalle" placeholder="Describe brevemente el ingreso..." />
            </div>

            <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3.5 ring-1 ring-inset ring-slate-100">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <p className="text-[13px] leading-relaxed text-slate-500">
                El ingreso quedará asociado al cajero y al almacén seleccionados en la barra
                superior.
              </p>
            </div>
          </CardContent>

          <CardFooter className="justify-end gap-2">
            <Button variant="outline">Cancelar</Button>
            <Button size="lg" disabled={numeric <= 0}>
              Registrar {numeric > 0 ? fmt(numeric) : 'ingreso'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
