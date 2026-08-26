'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag, X } from 'lucide-react';

interface Actividad {
  nombre: string;
  producto: string;
  minutosAtras: number;
  ciudad: string;
}

interface Props {
  actividad: Actividad[];
}

function formatoTiempo(minutos: number): string {
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  return `hace ${Math.round(horas / 24)} d`;
}

/** Notificación de actividad reciente basada 100% en pedidos reales registrados desde la tienda.
 *  No se muestra nada si aún no hay pedidos reales (nunca se inventan compras). */
export default function RecentPurchaseToast({ actividad }: Props) {
  const [indice, setIndice] = useState(0);
  const [visible, setVisible] = useState(false);
  const [cerradoManualmente, setCerradoManualmente] = useState(false);

  useEffect(() => {
    if (actividad.length === 0 || cerradoManualmente) return;

    const mostrar = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(mostrar);
  }, [actividad.length, cerradoManualmente]);

  useEffect(() => {
    if (!visible || actividad.length === 0) return;
    const ocultar = setTimeout(() => setVisible(false), 6000);
    const siguiente = setTimeout(() => {
      setIndice((i) => (i + 1) % actividad.length);
      if (!cerradoManualmente) setVisible(true);
    }, 13000);
    return () => {
      clearTimeout(ocultar);
      clearTimeout(siguiente);
    };
  }, [visible, indice, actividad.length, cerradoManualmente]);

  if (actividad.length === 0 || cerradoManualmente) return null;
  const item = actividad[indice];

  return (
    <div
      className={`fixed bottom-4 left-4 z-[1300] max-w-[300px] transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <div className="flex items-start gap-3 rounded-2xl bg-white border border-zinc-200 shadow-xl p-3.5 pr-8 relative">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <ShoppingBag className="h-4 w-4" />
        </div>
        <div className="text-xs">
          <p className="font-bold text-zinc-900 leading-snug">
            {item.nombre} en {item.ciudad}
          </p>
          <p className="text-zinc-500 leading-snug">
            pidió <span className="font-semibold text-zinc-700">{item.producto}</span>
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5">{formatoTiempo(item.minutosAtras)} · Pedido verificado</p>
        </div>
        <button
          type="button"
          onClick={() => setCerradoManualmente(true)}
          className="absolute top-2 right-2 text-zinc-300 hover:text-zinc-600"
          aria-label="Cerrar notificación"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
