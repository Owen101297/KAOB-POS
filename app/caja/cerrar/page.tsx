'use client';

import { Banknote, CreditCard, PiggyBank, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
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

const SUMMARY = [
  { label: 'Base inicial', value: '$ 100.000', icon: <PiggyBank className="h-4 w-4" />, tone: 'bg-slate-50 text-slate-500' },
  { label: 'Ventas en efectivo', value: '$ 0', icon: <Banknote className="h-4 w-4" />, tone: 'bg-brand-50 text-brand-600' },
  { label: 'Ventas con tarjeta/transferencia', value: '$ 0', icon: <CreditCard className="h-4 w-4" />, tone: 'bg-sky-50 text-sky-600' },
];

const DENOMINATIONS = [1000, 2000, 5000, 10000, 20000, 50000, 100000];

const fmt = (n: number) =>
  n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export default function CerrarCajaPage() {
  return (
    <div>
      <PageHeader
        title="Cerrar caja"
        description="Realiza el conteo de efectivo y cierra el turno del cajero."
        actions={
          <Badge variant="warning" className="px-2.5 py-1">
            Turno abierto · Cajero
          </Badge>
        }
      />

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Resumen del turno */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Resumen del turno</CardTitle>
            <CardDescription>Movimientos registrados hasta ahora</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {SUMMARY.map((s) => (
              <div key={s.label} className="flex items-center gap-3 rounded-xl bg-slate-50/70 p-3.5 ring-1 ring-inset ring-slate-100">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg [&_svg]:h-4 [&_svg]:w-4 ${s.tone}`}>
                  {s.icon}
                </span>
                <span className="flex-1 text-[13px] font-medium text-slate-600">{s.label}</span>
                <span className="text-[15px] font-bold tabular-nums text-slate-900">{s.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3.5 text-white">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Efectivo esperado
              </span>
              <span className="text-lg font-bold tabular-nums">$ 100.000</span>
            </div>
          </CardContent>
        </Card>

        {/* Conteo */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Conteo de efectivo</CardTitle>
            <CardDescription>Ingresa la cantidad de billetes y monedas contados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {DENOMINATIONS.map((d) => (
                <div key={d}>
                  <label htmlFor={`den-${d}`} className="mb-1 block text-[11px] font-semibold text-slate-400">
                    {fmt(d)}
                  </label>
                  <Input id={`den-${d}`} type="number" min={0} placeholder="0" className="h-10" />
                </div>
              ))}
              <div>
                <label htmlFor="den-monedas" className="mb-1 block text-[11px] font-semibold text-slate-400">
                  Monedas
                </label>
                <Input id="den-monedas" type="number" min={0} placeholder="0" className="h-10" />
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-amber-50/80 p-3.5 ring-1 ring-inset ring-amber-100">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-[13px] leading-relaxed text-amber-800/90">
                La diferencia entre lo contado y lo esperado quedará registrada en el historial de
                cierres para auditoría.
              </p>
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2 border-t border-slate-100">
            <Button variant="outline">Guardar borrador</Button>
            <Button size="lg">Cerrar caja</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
