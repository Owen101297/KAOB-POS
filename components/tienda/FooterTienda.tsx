'use client';

import Link from 'next/link';
import { Phone, MapPin, ShieldCheck, MessageCircle, ArrowUp } from 'lucide-react';

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
    <footer className="bg-black text-white border-t border-zinc-800">
      {/* Banner superior de newsletter / llamada a la acción */}
      <div className="border-b border-zinc-800/80 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-400">
              ¿Tienes dudas con tu talla o pedido?
            </span>
            <h3 className="text-xl font-black uppercase text-white mt-0.5">
              Habla directamente con un asesor de moda
            </h3>
          </div>
          <a
            href={`https://wa.me/${telefonoWhatsApp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('¡Hola! Me gustaría recibir asesoría sobre las prendas de KAOB MODERN WEAR.')}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest transition-transform hover:scale-105 active:scale-95 shadow-lg shrink-0"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Chatear por WhatsApp</span>
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          
          {/* Marca e Información */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white p-0.5 flex items-center justify-center">
                <img src="/brand/isotype.svg" alt="KAOB" className="h-9 w-9 rounded-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-[0.25em] text-white font-sans uppercase">
                  KΛOB
                </span>
                <span className="text-[9px] font-semibold tracking-[0.35em] text-zinc-400 uppercase -mt-0.5">
                  MODERN WEAR
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              Marca de moda contemporánea diseñada con cortes modernos, materiales de máxima calidad y confección superior. Cada prenda está pensada para elevar tu estilo diario.
            </p>

            <div className="pt-2 text-xs text-zinc-400 space-y-2">
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-brand-400" />
                <span>Atención y despachos: Lunes a Sábado 8:00 AM - 7:00 PM</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-sky-400" />
                <span>Envíos seguros a nivel nacional en Colombia</span>
              </p>
            </div>
          </div>

          {/* Colecciones por Sexo */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-200">
              Colecciones
            </p>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSeleccionarGenero('DAMA');
                    scrollToTop();
                  }}
                  className="hover:text-white transition-colors"
                >
                  Ropa de Dama 👩
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSeleccionarGenero('CABALLERO');
                    scrollToTop();
                  }}
                  className="hover:text-white transition-colors"
                >
                  Ropa de Caballero 👨
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSeleccionarGenero('UNISEX');
                    scrollToTop();
                  }}
                  className="hover:text-white transition-colors"
                >
                  Línea Unisex & Urban ⚡
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
                  Gorras & Accesorios 🎒
                </button>
              </li>
            </ul>
          </div>

          {/* Categorías */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-200">
              Categorías
            </p>
            <ul className="space-y-2 text-xs text-zinc-400">
              {categorias.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSeleccionarCategoria(cat.nombre);
                      scrollToTop();
                    }}
                    className="hover:text-white transition-colors"
                  >
                    {cat.nombre}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Garantías y Seguridad */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-200">
              Seguridad & Envíos
            </p>
            <div className="space-y-2 text-xs text-zinc-400">
              <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                <p className="font-bold text-white text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Compra 100% Protegida
                </p>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Tus pedidos son despachados con número de guía rastreable en transportadora oficial.
                </p>
              </div>

              <button
                type="button"
                onClick={scrollToTop}
                className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition-colors mt-2"
              >
                <ArrowUp className="h-3.5 w-3.5" />
                <span>Volver arriba</span>
              </button>
            </div>
          </div>

        </div>

        {/* Barra de Copyright */}
        <div className="mt-14 pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} KAOB MODERN WEAR. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Privacidad</span>
            <span>·</span>
            <span>Términos y Condiciones</span>
            <span>·</span>
            <span>Guía de Tallas</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
