'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { revealStagger, fadeUp, viewportOnce } from '@/components/tienda/motion';

interface Props {
  onExplorar: () => void;
  onSeleccionarGenero: (gen: string | null) => void;
  categorias: { id: number; nombre: string }[];
  categoriaSeleccionada: string | null;
  onSeleccionarCategoria: (cat: string | null) => void;
}

const LINEA_1 = ['Tu', 'estilo,'];
const LINEA_2 = ['sin', 'apuros.'];

/**
 * Hero editorial (002b): papel hueso, serif de exhibición con reveal
 * palabra por palabra, isotipo transparente en parallax sutil y llamados
 * a la compra inmediatos. Respeta prefers-reduced-motion.
 */
export default function HeroTienda({
  onExplorar,
  onSeleccionarGenero,
  categorias,
  categoriaSeleccionada,
  onSeleccionarCategoria,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const yAgua = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 70]);

  const palabra = (texto: string, i: number, clase: string = '') => (
    <motion.span
      key={`${texto}-${i}`}
      variants={{
        hidden: { opacity: 0, y: reduceMotion ? 0 : 24, filter: reduceMotion ? 'none' : 'blur(6px)' },
        visible: {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className={`inline-block ${clase}`}
    >
      {texto}
      {'\u00A0'}
    </motion.span>
  );

  return (
    <section ref={ref} className="relative overflow-hidden bg-bone-100 border-b border-ink/10">
      {/* Marca de agua: isotipo transparente con parallax */}
      <motion.div
        style={{ y: yAgua }}
        className="pointer-events-none absolute -right-24 -top-16 sm:-right-16 md:right-0 opacity-[0.06]"
      >
        <img src="/brand/isotype.svg" alt="" className="w-[420px] h-[420px] sm:w-[560px] sm:h-[560px]" />
      </motion.div>

      <motion.div
        variants={revealStagger}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24"
      >
        <div className="max-w-3xl">
          {/* Sello de colección */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-bronze/50 bg-bone-50 text-[10.5px] font-bold uppercase tracking-[0.24em] text-bronze-dark mb-7">
            Colección única · lote pequeño
          </div>

          {/* Titular serif con reveal */}
          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl leading-[1.02] tracking-tight text-ink">
            {LINEA_1.map((p, i) => palabra(p, i))}
            <br />
            <em className="italic text-ink-500">
              {LINEA_2.map((p, i) => palabra(p, i + LINEA_1.length))}
            </em>
          </h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 text-sm sm:text-base text-ink-500 font-normal max-w-xl leading-relaxed"
          >
            Prendas confeccionadas en lotes pequeños, textiles de alto gramaje y cortes que no
            pasan de moda. Vitrina con inventario real — si aparece en pantalla, está disponible.
          </motion.p>

          {/* Llamados a la compra */}
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                onSeleccionarGenero(null);
                onExplorar();
              }}
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-bone-50 shadow-lg transition-transform hover:scale-[1.03] active:scale-95 hover:bg-ink-700"
            >
              Descubrir la colección
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              type="button"
              onClick={() => {
                onSeleccionarGenero('DAMA');
                onExplorar();
              }}
              className="rounded-full border border-ink/20 bg-bone-50 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:border-ink hover:bg-bone-200 active:scale-95"
            >
              Edición Dama
            </button>
            <button
              type="button"
              onClick={() => {
                onSeleccionarGenero('CABALLERO');
                onExplorar();
              }}
              className="rounded-full border border-ink/20 bg-bone-50 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:border-ink hover:bg-bone-200 active:scale-95"
            >
              Edición Caballero
            </button>
          </motion.div>

          {/* Confianza en línea editorial */}
          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-ink-400"
          >
            <span className="flex items-center gap-1.5"><DotNd /> Envío gratis desde $150.000</span>
            <span className="flex items-center gap-1.5"><DotNd /> Cambios sin drama por 30 días</span>
            <span className="flex items-center gap-1.5"><DotNd /> Pago 100% seguro online</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Acceso rápido a categorías */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        {categorias.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-ink/10 pt-5">
            <p className="w-full text-[10px] font-bold uppercase tracking-[0.24em] text-ink-400 mb-1">
              Buscar por categoría
            </p>
            <button
              type="button"
              onClick={() => {
                onSeleccionarCategoria(null);
                onExplorar();
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all ${
                categoriaSeleccionada === null
                  ? 'bg-ink text-bone-50 shadow-md'
                  : 'bg-bone-50 border border-ink/10 text-ink-500 hover:border-ink/30 hover:text-ink'
              }`}
            >
              Todas
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onSeleccionarCategoria(cat.nombre);
                  onExplorar();
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all ${
                  categoriaSeleccionada === cat.nombre
                    ? 'bg-ink text-bone-50 shadow-md'
                    : 'bg-bone-50 border border-ink/10 text-ink-500 hover:border-ink/30 hover:text-ink'
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// Punto bronce en la fila de confianza
function DotNd() {
  return <span className="h-1 w-1 rounded-full bg-bronze inline-block" aria-hidden />;
}
