'use client';

import { useState, useMemo } from 'react';
import { Wallet, CreditCard, Banknote, Info } from 'lucide-react';
import { formatoCOP } from '@/lib/format';

export type MetodoFinanciacion = 'CONTADO' | 'PLAN_SEPARE' | 'ADDI' | 'SISTECREDITO';

interface Props {
  precio: number;
  variante?: 'compacta' | 'completa';
  metodoSeleccionado?: MetodoFinanciacion;
  onSeleccionarMetodo?: (metodo: MetodoFinanciacion) => void;
}

const METODOS: { id: MetodoFinanciacion; nombre: string; icono: typeof Wallet; cuotasDisponibles: number[]; colorActivo: string }[] = [
  { id: 'PLAN_SEPARE', nombre: 'Plan Separe', icono: Banknote, cuotasDisponibles: [2, 3, 4], colorActivo: 'bg-emerald-600 border-emerald-600' },
  { id: 'ADDI', nombre: 'Addi', icono: Wallet, cuotasDisponibles: [3, 6, 12], colorActivo: 'bg-violet-600 border-violet-600' },
  { id: 'SISTECREDITO', nombre: 'Sistecrédito', icono: CreditCard, cuotasDisponibles: [3, 6, 12], colorActivo: 'bg-sky-600 border-sky-600' },
];

/** Bloque de financiación visible en producto/carrito. Los valores de cuota son un estimado
 *  informativo (precio ÷ n), no una oferta vinculante: cada plataforma define su propia tasa y aprobación. */
export default function FinanciacionCalculadora({
  precio,
  variante = 'completa',
  metodoSeleccionado,
  onSeleccionarMetodo,
}: Props) {
  const [metodoActivo, setMetodoActivo] = useState<MetodoFinanciacion>(metodoSeleccionado ?? 'ADDI');
  const [cuotas, setCuotas] = useState<number>(3);

  const metodo = METODOS.find((m) => m.id === (metodoSeleccionado ?? metodoActivo))!;

  const cuotasValidas = useMemo(() => {
    return metodo.cuotasDisponibles.includes(cuotas) ? cuotas : metodo.cuotasDisponibles[0];
  }, [metodo, cuotas]);

  const valorCuota = Math.ceil(precio / cuotasValidas);

  const seleccionar = (m: MetodoFinanciacion) => {
    setMetodoActivo(m);
    onSeleccionarMetodo?.(m);
  };

  if (variante === 'compacta') {
    return (
      <p className="mt-1 text-[10px] font-semibold text-emerald-700 flex items-center gap-1 whitespace-nowrap">
        <Wallet className="h-3 w-3 shrink-0" />
        Desde {formatoCOP(Math.ceil(precio / 3))}/mes
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
        {metodoSeleccionado ? `Cuotas con ${metodo.nombre}` : 'Paga a cuotas · Financiación disponible'}
      </p>

      {/* Selector de plataforma (solo en modo autónomo; si el método ya viene elegido arriba, no se repite) */}
      {!metodoSeleccionado && (
        <div className="grid grid-cols-3 gap-2">
          {METODOS.map((m) => {
            const Icono = m.icono;
            const activo = metodoActivo === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => seleccionar(m.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 px-1 text-[11px] font-bold transition-all ${
                  activo ? `${m.colorActivo} text-white shadow-md` : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                }`}
              >
                <Icono className="h-4 w-4" />
                {m.nombre}
              </button>
            );
          })}
        </div>
      )}

      {/* Selector de número de cuotas */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-zinc-500 font-medium">Cuotas:</span>
        <div className="flex gap-1.5">
          {metodo.cuotasDisponibles.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCuotas(n)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                cuotasValidas === n ? 'bg-black text-white' : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300'
              }`}
            >
              {n}x
            </button>
          ))}
        </div>
      </div>

      {/* Resultado */}
      <div className="rounded-xl bg-white border border-zinc-200 p-3 flex items-center justify-between">
        <span className="text-[11px] text-zinc-500 font-medium">Pagarías aprox.</span>
        <span className="text-lg font-black text-zinc-900">
          {formatoCOP(valorCuota)}<span className="text-xs font-bold text-zinc-400">/{metodo.id === 'PLAN_SEPARE' ? 'pago' : 'mes'}</span>
        </span>
      </div>

      <p className="flex items-start gap-1.5 text-[10px] text-zinc-400 leading-relaxed">
        <Info className="h-3 w-3 shrink-0 mt-0.5" />
        Valor de cuota estimado ({metodo.nombre}), sujeto a aprobación y condiciones propias de la plataforma. Plan Separe se gestiona directamente con la tienda.
      </p>
    </div>
  );
}
