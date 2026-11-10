'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { ProductoTienda } from '@/lib/tienda/public-productos';
import { formatoCOP } from '@/lib/format';
import { fadeUp, viewportOnce } from '@/components/tienda/motion';

interface Props {
  productos: ProductoTienda[];
  onVerDetalle: (producto: ProductoTienda) => void;
}

function stockTotal(p: ProductoTienda): number {
  return p.variantes.reduce((acc, v) => acc + v.stocks.reduce((s, x) => s + x.cantidad, 0), 0);
}

/**
 * Escaparate editorial del destacado (002b): retrato en tinta sobre papel,
 * numeración "Edición", escasez bronce como llamado a la compra.
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
    <section className="bg-bone-100 border-b border-ink/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Retrato de tinta */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            onClick={() => onVerDetalle(destacado)}
            className="relative rounded-3xl overflow-hidden bg-ink aspect-[4/3] flex items-center justify-center cursor-pointer group shadow-[0_32px_64px_-32px_rgba(28,23,18,0.45)]"
          >
            <img
              src="/brand/isotype.svg"
              alt=""
              className="absolute -right-10 -bottom-10 w-64 h-64 opacity-[0.08] group-hover:scale-110 transition-transform duration-500 pointer-events-none"
            />
            <div className="text-center relative z-10 px-6">
              <span className="font-display italic text-bone-300 text-lg">
                Edición · Nº 01
              </span>
              <p className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-bone-50 tracking-tight mt-2">
                {destacado.nombre.slice(0, 2).toUpperCase()}
              </p>
              <p className="mt-3 font-mono text-[10px] tracking-[0.3em] text-bone-300/70 uppercase">
                {destacado.referencia}
              </p>
            </div>

            {urgente && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-bronze text-ink-900 text-[10px] font-black uppercase tracking-[0.16em] shadow-lg"
              >
                Últimas {stock} unidades
              </motion.span>
            )}
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="transition-transform duration-500"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-ink-400">
              {destacado.categoria?.nombre ?? 'Colección'}
              {destacado.genero ? ` · ${destacado.genero.toLowerCase()}` : ''}
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-5xl tracking-tight text-ink">
              {destacado.nombre}
            </h2>
            {destacado.descripcion && (
              <p className="mt-3 text-sm text-ink-500 leading-relaxed line-clamp-3">
                {destacado.descripcion}
              </p>
            )}
            <p className="mt-5 text-3xl font-bold text-ink">{formatoCOP(precio)}</p>
            <p className="text-[11px] text-ink-400 mt-1">
              {stock} unidad{stock === 1 ? '' : 'es'} disponible{stock === 1 ? '' : 's'} · Sin re-stocks
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={() => onVerDetalle(destacado)}
                className="group inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-bone-50 shadow-lg transition-transform hover:scale-[1.03] active:scale-95 hover:bg-ink-700"
              >
                Ver y elegir talla
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <span className="inline-flex items-center px-4 py-3 rounded-full border border-ink/15 text-[11px] font-semibold text-ink-400">
                Lote pequeño · gran detalle
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
