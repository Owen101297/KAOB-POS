'use client';

import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import type { ProductoLista } from '@/lib/actions/productos';
import { formatoCOP } from '@/lib/format';

interface Props {
  productos: ProductoLista[];
  idsVistos: number[];
  onVerDetalle: (producto: ProductoLista) => void;
}

export default function RecentlyViewedTienda({ productos, idsVistos, onVerDetalle }: Props) {
  const vistos = useMemo(() => {
    return idsVistos
      .map((id) => productos.find((p) => p.id === id))
      .filter((p): p is ProductoLista => Boolean(p))
      .slice(0, 6);
  }, [productos, idsVistos]);

  if (vistos.length === 0) return null;

  return (
    <section className="border-t border-zinc-200 bg-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-5">
          <Clock className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Vistos recientemente</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
          {vistos.map((p) => {
            const precio = p.variantes[0]?.precioOverride ?? p.precioBase;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onVerDetalle(p)}
                className="shrink-0 w-36 text-left rounded-2xl border border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:shadow-sm transition-all p-3"
              >
                <div className="aspect-square rounded-xl bg-white border border-zinc-200 flex items-center justify-center mb-2">
                  <span className="font-extrabold text-sm font-serif text-zinc-800">
                    {p.nombre.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-zinc-900 line-clamp-1">{p.nombre}</p>
                <p className="text-[11px] font-black text-zinc-700 mt-0.5">{formatoCOP(precio)}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
