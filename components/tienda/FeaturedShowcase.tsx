'use client';

import { ArrowRight, Flame, ShoppingBag } from 'lucide-react';
import type { ProductoTienda } from '@/lib/tienda/public-productos';
import { formatoCOP } from '@/lib/format';
import { Button } from '@/components/ui/Button';

interface Props {
  productos: ProductoTienda[];
  onVerDetalle: (producto: ProductoTienda) => void;
}

function stockTotal(p: ProductoTienda): number {
  return p.variantes.reduce((acc, v) => acc + v.stocks.reduce((s, x) => s + x.cantidad, 0), 0);
}

/**
 * Escaparate del producto destacado (spec 002, US3): el más stock tiene de
 * la colección nueva. Foto tipográfica de marca mientras no existan fotos de
 * producto; CTA directo al detalle.
 */
export default function FeaturedShowcase({ productos, onVerDetalle }: Props) {
  const destacado = productos.find((p) => stockTotal(p) > 0);
  if (!destacado) return null;

  const variante = destacado.variantes.find(
    (v) => v.stocks.reduce((s, x) => s + x.cantidad, 0) > 0
  );
  const precio = variante?.precioOverride ?? destacado.precioBase;
  const stock = variante ? variante.stocks.reduce((s, x) => s + x.cantidad, 0) : 0;
  const urgente = stock > 0 && stock <= 5;

  return (
    <section className="bg-white text-black border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Vitrina tipográfica del producto (isotipo + referencia) */}
          <div
            onClick={() => onVerDetalle(destacado)}
            className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-zinc-900 to-black aspect-[4/3] flex items-center justify-center cursor-pointer group"
          >
            <img
              src="/brand/isotype.svg"
              alt=""
              className="absolute -right-10 -bottom-10 w-64 h-64 opacity-15 group-hover:scale-110 transition-transform duration-500 pointer-events-none"
            />
            <div className="text-center relative z-10 px-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest mb-4">
                <Flame className="h-3 w-3" /> Lo más solicitado
              </span>
              <p className="text-5xl sm:text-6xl font-black text-white tracking-tight">
                {destacado.nombre.slice(0, 2).toUpperCase()}
              </p>
              <p className="mt-2 font-mono text-[11px] tracking-widest text-zinc-400 uppercase">
                {destacado.referencia}
              </p>
            </div>

            {urgente && (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                ¡Últimas {stock} unidades!
              </span>
            )}
          </div>

          {/* Copia de venta */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-500">
              {destacado.categoria?.nombre ?? 'Colección'} {destacado.genero ? `· ${destacado.genero}` : ''}
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black uppercase tracking-tight">
              {destacado.nombre}
            </h2>
            {destacado.descripcion && (
              <p className="mt-3 text-sm text-zinc-600 leading-relaxed line-clamp-3">
                {destacado.descripcion}
              </p>
            )}
            <p className="mt-5 text-3xl font-black">{formatoCOP(precio)}</p>
            <p className="text-[11px] text-zinc-500 mt-1">
              {stock} unidad{stock === 1 ? '' : 'es'} disponible{stock === 1 ? '' : 's'} · Envío gratis desde $150.000
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => onVerDetalle(destacado)}
                className="rounded-full bg-black text-white hover:bg-zinc-800 font-bold text-xs uppercase tracking-widest px-7 py-6 shadow-lg"
              >
                Ver y elegir talla <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <span className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full border border-zinc-200 text-[11px] font-semibold text-zinc-500">
                <ShoppingBag className="h-3.5 w-3.5" /> Add to bag en el detalle
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
