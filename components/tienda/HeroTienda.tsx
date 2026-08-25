'use client';

import { Sparkles, ArrowRight, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  onExplorar: () => void;
  categorias: { id: number; nombre: string }[];
  categoriaSeleccionada: string | null;
  onSeleccionarCategoria: (cat: string | null) => void;
}

export default function HeroTienda({
  onExplorar,
  categorias,
  categoriaSeleccionada,
  onSeleccionarCategoria,
}: Props) {
  return (
    <section className="relative overflow-hidden bg-black text-white border-b border-zinc-800">
      {/* Luces de ambientación de fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-zinc-800/40 via-zinc-900/10 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10">
        <div className="max-w-3xl">
          {/* Badge coleccion */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold uppercase tracking-widest text-zinc-300 mb-6 backdrop-blur">
            <Sparkles className="h-3 w-3 text-brand-400" />
            <span>Colección Exclusiva · KAOB</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight uppercase leading-[1.08] font-sans">
            MODERN WEAR
            <span className="block text-zinc-500 font-extralight text-3xl sm:text-4xl md:text-5xl mt-1">
              ESTILO CONTEMPORÁNEO
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-base text-zinc-400 font-normal max-w-xl leading-relaxed">
            Descubre nuestras prendas de máxima calidad con siluetas modernas, textiles de alta duración y acabados premium. Compra directa con inventario en tiempo real.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={onExplorar}
              className="bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase tracking-widest px-6 py-6 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Explorar Catálogo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Barra de Filtros de Categorías tipo Chips */}
        <div className="mt-14 pt-8 border-t border-zinc-800/80">
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
            Filtrar por colección
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSeleccionarCategoria(null)}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all ${
                categoriaSeleccionada === null
                  ? 'bg-white text-black shadow-md'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
              }`}
            >
              Todos los productos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSeleccionarCategoria(cat.nombre)}
                className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all ${
                  categoriaSeleccionada === cat.nombre
                    ? 'bg-white text-black shadow-md'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Badges de confianza */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-zinc-900 text-xs text-zinc-400">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-brand-400" />
            <span>Prendas 100% garantizadas</span>
          </div>
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-sky-400" />
            <span>Envíos rápidos a nivel nacional</span>
          </div>
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-emerald-400" />
            <span>Atención y pedidos por WhatsApp</span>
          </div>
        </div>
      </div>
    </section>
  );
}
