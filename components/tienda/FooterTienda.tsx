'use client';

import Link from 'next/link';
import { Phone, MapPin, MessageCircle, ArrowUp, Sparkles, ShieldCheck } from 'lucide-react';
import { AllPaymentTrustStrip } from './PaymentMethodsBadges';

interface Props {
  categorias: { id: number; nombre: string }[];
  onSeleccionarCategoria: (cat: string | null) => void;
  onSeleccionarGenero: (gen: string | null) => void;
  telefonoWhatsApp?: string;
}

export default function FooterTienda({
  categorias,
  onSeleccionarCategoria,
  onSeleccionarGenero,
  telefonoWhatsApp = '573000000000',
}: Props) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#09090B] text-white border-t border-zinc-800">
      {/* Barra de Asesoría Directa por WhatsApp */}
      <div className="border-b border-zinc-800/80 bg-zinc-950 py-10">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400 block mb-1">
              CONCIERGE & ASESORÍA PERSONALIZADA
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-light uppercase text-white">
              ¿Dudas con tu talla o pedido? Habla con nuestro equipo
            </h3>
          </div>
          <a
            href={`https://wa.me/${telefonoWhatsApp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('¡Hola! Me gustaría recibir asesoría sobre las prendas de KΛOB MODERN WEAR.')}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-zinc-200 text-black font-bold text-xs uppercase tracking-[0.2em] transition-all duration-300 shadow-md shrink-0"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Chat de WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Franja Oficial de Métodos de Pago y Financiación en SVG */}
      <div className="border-b border-zinc-800/80 py-8 bg-[#0C0C0E]">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500 text-center md:text-left">
            PAGOS SEGUROS & FINANCIACIÓN DIGITAL EN COLOMBIA
          </span>
          <AllPaymentTrustStrip />
        </div>
      </div>

      {/* Contenido Principal del Footer */}
      <div className="max-w-[1520px] mx-auto px-4 sm:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14">
          
          {/* Marca Centrada / Resumen (4 cols) */}
          <div className="md:col-span-4 space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-full bg-white p-1 flex items-center justify-center">
                <img src="/brand/isotype.svg" alt="KAOB" className="h-8 w-8 object-contain" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-[0.25em] text-white uppercase block">
                  KΛOB
                </span>
                <span className="text-[9px] font-semibold tracking-[0.35em] text-zinc-400 uppercase block -mt-0.5">
                  MODERN WEAR
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed font-light">
              Atelier contemporáneo de moda urbana. Confección de alta densidad (240+ GSM), patronaje estructurado y siluetas atemporales diseñadas en Colombia.
            </p>

            <div className="pt-2 text-xs text-zinc-400 space-y-2 font-light">
              <p className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-zinc-300" />
                <span>Envíos asegurados a todo el territorio colombiano</span>
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Garantía de confección y cambios sin complicaciones</span>
              </p>
            </div>
          </div>

          {/* Enlaces a Colecciones (3 cols) */}
          <div className="md:col-span-3 space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white">
              Colecciones
            </p>
            <ul className="space-y-2.5 text-xs text-zinc-400 font-light">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSeleccionarGenero('CABALLERO');
                    scrollToTop();
                  }}
                  className="hover:text-white transition-colors"
                >
                  Caballero & Oversize
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSeleccionarGenero('DAMA');
                    scrollToTop();
                  }}
                  className="hover:text-white transition-colors"
                >
                  Dama & Siluetas Femeninas
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSeleccionarCategoria('HOODIES & CHAQUETAS');
                    scrollToTop();
                  }}
                  className="hover:text-white transition-colors"
                >
                  Hoodies & Outerwear
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSeleccionarGenero('ACCESORIOS');
                    scrollToTop();
                  }}
                  className="hover:text-white transition-colors"
                >
                  Headwear & Accesorios
                </button>
              </li>
            </ul>
          </div>

          {/* Servicio al Cliente (3 cols) */}
          <div className="md:col-span-3 space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white">
              Atelier & Soporte
            </p>
            <ul className="space-y-2.5 text-xs text-zinc-400 font-light">
              <li>
                <span className="text-zinc-300">Guía de Tallas: Boxy / Oversize Fit</span>
              </li>
              <li>
                <span className="text-zinc-300">Cuidado de Prendas Heavyweight</span>
              </li>
              <li>
                <span className="text-zinc-300">Plan Separe (Separa con el 30%)</span>
              </li>
              <li>
                <span className="text-zinc-300">Financiación con Addi y Sistecrédito</span>
              </li>
            </ul>
          </div>

          {/* Botón Volver Arriba (2 cols) */}
          <div className="md:col-span-2 flex flex-col justify-between items-start md:items-end">
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors p-2 border border-zinc-800 hover:border-white"
            >
              <span>TOP</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>

            <span className="text-[10px] font-mono text-zinc-600 uppercase mt-8 md:mt-0">
              COLOMBIA // 2026
            </span>
          </div>

        </div>

        {/* Línea Final y Copyright */}
        <div className="mt-14 pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500 font-light">
          <p>© 2026 KΛOB MODERN WEAR. TODOS LOS DERECHOS RESERVADOS.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-zinc-300 transition-colors">Términos del Servicio</span>
            <span className="hover:text-zinc-300 transition-colors">Política de Privacidad</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
