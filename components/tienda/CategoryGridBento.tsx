'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { fadeUp, viewportOnce } from '@/components/tienda/motion';

interface Props {
  onSeleccionarGenero: (genero: string | null) => void;
  generoSeleccionado: string | null;
}

/**
 * Mosaico editorial de colecciones (002b): tarjetas de papel con numeración
 * serif "Nº", sello bronce y flecha que se revela al hover. Contrato intacto.
 */
export default function CategoryGridBento({
  onSeleccionarGenero,
  generoSeleccionado,
}: Props) {
  const colecciones = [
    {
      id: 'DAMA',
      num: 'Nº 01',
      nombre: 'Colección Dama',
      tagline: 'Elegancia casual y siluetas contemporáneas',
      badge: 'Tendencia 2026',
      colSpan: 'md:col-span-2',
      generoKey: 'DAMA',
    },
    {
      id: 'CABALLERO',
      num: 'Nº 02',
      nombre: 'Colección Caballero',
      tagline: 'Oversize y hoodies de alto gramaje',
      badge: 'Lo más vendido',
      colSpan: 'md:col-span-1',
      generoKey: 'CABALLERO',
    },
    {
      id: 'UNISEX',
      num: 'Nº 03',
      nombre: 'Línea Unisex & Urban',
      tagline: 'Esenciales neutros de corte boxy',
      badge: 'Esenciales',
      colSpan: 'md:col-span-1',
      generoKey: 'UNISEX',
    },
    {
      id: 'ACCESORIOS',
      num: 'Nº 04',
      nombre: 'Accesorios & Gorras',
      tagline: 'Complementos para completar el look',
      badge: 'Complementos',
      colSpan: 'md:col-span-2',
      generoKey: 'ACCESORIOS',
    },
  ];

  return (
    <section className="py-14 md:py-16 bg-bone-50 border-b border-ink/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-ink-400">
              Explora por colección
            </span>
            <h2 className="font-display text-3xl sm:text-4xl tracking-tight text-ink mt-1">
              Elige tu colección
            </h2>
          </div>
          {generoSeleccionado && (
            <button
              type="button"
              onClick={() => onSeleccionarGenero(null)}
              className="text-xs font-semibold text-ink-400 hover:text-ink underline underline-offset-4"
            >
              Ver todas las colecciones
            </button>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
          {colecciones.map((col, idx) => {
            const esActivo = generoSeleccionado === col.generoKey;
            return (
              <motion.button
                key={col.id}
                type="button"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                transition={{ delay: idx * 0.06 }}
                onClick={() => {
                  onSeleccionarGenero(esActivo ? null : col.generoKey);
                  const el = document.getElementById('catalogo-prendas');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`group relative overflow-hidden rounded-3xl text-left p-6 sm:p-8 border cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[200px] bg-bone-100 ${col.colSpan} ${
                  esActivo
                    ? 'border-ink ring-2 ring-bronze/40 shadow-xl'
                    : 'border-ink/10 hover:border-ink/30 hover:shadow-lg'
                }`}
              >
                {/* Isotipo translúcido */}
                <div className="absolute -right-8 -bottom-8 opacity-[0.05] group-hover:opacity-[0.09] group-hover:scale-110 transition-all duration-500 pointer-events-none">
                  <img src="/brand/isotype.svg" alt="" className="w-44 h-44 object-contain" />
                </div>

                <div className="flex items-center justify-between relative z-10">
                  <span className="font-display italic text-ink-400 text-lg">{col.num}</span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] border border-bronze/40 text-bronze-dark bg-bone-50">
                    {col.badge}
                  </span>
                </div>

                <div className="relative z-10 pt-8 flex items-end justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl sm:text-2xl tracking-tight text-ink group-hover:text-ink-600">
                      {col.nombre}
                    </h3>
                    <p className="text-xs text-ink-400 mt-1 max-w-sm leading-relaxed">{col.tagline}</p>
                  </div>
                  <span className="h-10 w-10 rounded-full border border-ink/15 flex items-center justify-center text-ink-500 group-hover:bg-ink group-hover:text-bone-50 group-hover:border-ink transition-all duration-300 shrink-0">
                    <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
