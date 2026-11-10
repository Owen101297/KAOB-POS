'use client';

import { motion, useReducedMotion } from 'framer-motion';

const PROMESAS = [
  'Envío gratis desde $150.000',
  'Cambios sin drama · 30 días',
  'Pago 100% seguro',
  'Confección en lote pequeño',
  'Despachos a toda Colombia',
];

/**
 * Franja infinita de promesas (002b, editorial): cinta de tinta con texto en
 * serif, gesto de boutique que refuerza confianza sin estorbar. Respeta
 * `prefers-reduced-motion` deteniendo el desplazamiento.
 */
export default function MarqueeTienda() {
  const reduceMotion = useReducedMotion();
  const items = [...PROMESAS, ...PROMESAS, ...PROMESAS, ...PROMESAS];

  return (
    <div aria-hidden className="overflow-hidden bg-ink text-bone-100 border-y border-ink-900 py-3">
      <motion.div
        className="flex w-max items-center gap-10 whitespace-nowrap will-change-transform"
        animate={reduceMotion ? undefined : { x: [0, '-25%'] }}
        transition={reduceMotion ? undefined : { repeat: Infinity, duration: 28, ease: 'linear' }}
      >
        {items.map((p, i) => (
          <span key={i} className="flex items-center gap-10">
            <span className="font-display text-sm sm:text-base italic tracking-wide text-bone-200">
              {p}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-bronze shrink-0" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}
