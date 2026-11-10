'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Phone, MapPin, ShieldCheck, MessageCircle, ArrowUp, ArrowRight } from 'lucide-react';
import { fadeUp, viewportOnce } from '@/components/tienda/motion';

interface Props {
  categorias: { id: number; nombre: string }[];
  onSeleccionarCategoria: (cat: string | null) => void;
  onSeleccionarGenero: (gen: string | null) => void;
  telefonoWhatsApp?: string;
}

/**
 * Footer editorial (002b): bloque final de tinta con invitación en serif
 * (cierre de compra), columnas en papel y garantías. Textos clave intactos.
 */
export default function FooterTienda({
  categorias,
  onSeleccionarCategoria,
  onSeleccionarGenero,
  telefonoWhatsApp = '573000000000',
}: Props) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const telLimpio = telefonoWhatsApp.replace(/[^0-9]/g, '');

  return (
    <footer className="bg-ink text-bone-100">
      {/* Cierre de compra */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="border-b border-bone-100/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
          <img
            src="/brand/isotype.svg"
            alt=""
            className="absolute -left-16 -bottom-24 w-64 h-64 opacity-[0.05] pointer-events-none"
          />
          <div className="relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-bronze-light">
              ¿Listo para estrenar?
            </span>
            <h3 className="font-display text-3xl sm:text-4xl mt-1.5 max-w-xl leading-snug">
              Arma tu pedido hoy y coordina el pago en un toque.
            </h3>
          </div>
          <a
            href={`https://wa.me/${telLimpio}?text=${encodeURIComponent('¡Hola! Me gustaría recibir asesoría sobre las prendas de KAOB MODERN WEAR.')}`}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex shrink-0 items-center gap-2 px-7 py-4 rounded-full bg-bone-50 text-ink font-bold text-xs uppercase tracking-[0.18em] hover:bg-bone-200 transition-transform hover:scale-[1.03] active:scale-95 shadow-lg relative z-10"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Hablar con un asesor</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">

          {/* Marca e Información */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img src="/brand/isotype.svg" alt="KAOB" className="h-11 w-11 rounded-full object-contain" />
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-[0.28em] text-bone-50 uppercase">
                  KAOB
                </span>
                <span className="text-[9px] font-semibold tracking-[0.42em] text-bone-300/60 uppercase -mt-0.5">
                  Modern Wear
                </span>
              </div>
            </div>

            <p className="font-display italic text-sm text-bone-300/80 max-w-sm leading-relaxed">
              Confección en lote pequeño, textiles de alta duración y cortes contemporáneos — cada
              prenda pensada para durar en tu armario, no en la vitrina.
            </p>

            <div className="pt-2 text-xs text-bone-300/70 space-y-2">
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-bronze-light" />
                <span>Atención y despachos: Lunes a Sábado 8:00 AM - 7:00 PM</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-bronze-light" />
                <span>Envíos seguros a nivel nacional en Colombia</span>
              </p>
            </div>
          </div>

          {/* Colecciones */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-bone-50">
              Colecciones
            </p>
            <ul className="space-y-2 text-xs text-bone-300/70">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSeleccionarGenero('DAMA');
                    scrollToTop();
                  }}
                  className="hover:text-bone-50 transition-colors"
                >
                  Edición Dama
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSeleccionarGenero('CABALLERO');
                    scrollToTop();
                  }}
                  className="hover:text-bone-50 transition-colors"
                >
                  Edición Caballero
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSeleccionarGenero('UNISEX');
                    scrollToTop();
                  }}
                  className="hover:text-bone-50 transition-colors"
                >
                  Línea Unisex & Urban
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSeleccionarGenero('ACCESORIOS');
                    scrollToTop();
                  }}
                  className="hover:text-bone-50 transition-colors"
                >
                  Gorras & Accesorios
                </button>
              </li>
            </ul>
          </div>

          {/* Categorías */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-bone-50">
              Categorías
            </p>
            <ul className="space-y-2 text-xs text-bone-300/70">
              {categorias.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSeleccionarCategoria(cat.nombre);
                      scrollToTop();
                    }}
                    className="hover:text-bone-50 transition-colors"
                  >
                    {cat.nombre}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Garantías */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-bone-50">
              Seguridad & Envíos
            </p>
            <div className="space-y-2 text-xs text-bone-300/70">
              <div className="p-3 rounded-2xl bg-ink-800 border border-ink-700 space-y-1">
                <p className="font-bold text-bone-50 text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-bronze-light" />
                  Compra 100% protegida
                </p>
                <p className="text-[10px] text-bone-300/60 leading-tight">
                  Pedidos despachados con número de guía rastreable.
                </p>
              </div>

              <button
                type="button"
                onClick={scrollToTop}
                className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl bg-ink-800 hover:bg-ink-700 text-bone-200 text-xs font-semibold transition-colors mt-2"
              >
                <ArrowUp className="h-3.5 w-3.5" />
                <span>Volver arriba</span>
              </button>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-14 pt-8 border-t border-ink-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-bone-300/50">
          <p>© {new Date().getFullYear()} KAOB MODERN WEAR. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/tienda" className="hover:text-bone-100 transition-colors">Tienda Online</Link>
            <span>·</span>
            <span className="hover:text-bone-100 cursor-default">Privacidad</span>
            <span>·</span>
            <span className="hover:text-bone-100 cursor-default">Términos y Condiciones</span>
            <span>·</span>
            <span className="hover:text-bone-100 cursor-default">Guía de Tallas</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
