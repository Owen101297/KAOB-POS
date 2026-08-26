'use client';

import { Sparkles, ArrowRight, User, Users, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  onExplorar: () => void;
  onSeleccionarGenero: (gen: string | null) => void;
  categorias: { id: number; nombre: string }[];
  categoriaSeleccionada: string | null;
  onSeleccionarCategoria: (cat: string | null) => void;
}

export default function HeroTienda({
  onExplorar,
  onSeleccionarGenero,
  categorias,
  categoriaSeleccionada,
  onSeleccionarCategoria,
}: Props) {
  return (
    <section className="relative overflow-hidden bg-[#F3EEE6] text-zinc-900 border-b border-zinc-300/60">
      {/* Luz ambiental cálida de fondo */}
      <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-gradient-to-bl from-amber-200/40 via-orange-100/20 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-24 relative z-10">
        <div className="max-w-3xl">
          {/* Badge Colección */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-zinc-300 text-[11px] font-bold uppercase tracking-widest text-zinc-600 mb-6 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>NUEVA COLECCIÓN 2026 · KAOB MODERN WEAR</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            Modern Wear
            <span className="block text-zinc-500 font-normal italic text-3xl sm:text-5xl md:text-6xl mt-1">
              Timeless by design.
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-base text-zinc-600 font-normal max-w-xl leading-relaxed">
            Prendas de corte premium, textiles de alta duración y siluetas contemporáneas para Dama y Caballero. Compra directa con inventario real y despacho inmediato.
          </p>

          {/* Botones de Acción Rápida por Género */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={() => {
                onSeleccionarGenero('DAMA');
                onExplorar();
              }}
              className="bg-black text-white hover:bg-zinc-800 font-bold text-xs uppercase tracking-widest px-6 py-6 rounded-full shadow-xl transition-transform hover:scale-105 active:scale-95"
            >
              Colección Dama 👩
            </Button>

            <Button
              size="lg"
              onClick={() => {
                onSeleccionarGenero('CABALLERO');
                onExplorar();
              }}
              className="bg-white border border-zinc-300 text-zinc-900 hover:bg-zinc-50 font-bold text-xs uppercase tracking-widest px-6 py-6 rounded-full shadow-sm transition-transform hover:scale-105 active:scale-95"
            >
              Colección Caballero 👨
            </Button>

            <Button
              variant="ghost"
              onClick={onExplorar}
              className="text-zinc-600 hover:text-black font-bold text-xs uppercase tracking-widest px-4 py-6"
            >
              Ver Todo el Catálogo <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>

          {/* Pilares de confianza rápidos */}
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-semibold text-zinc-500">
            <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Envíos a toda Colombia</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Garantía de talla</span>
            <span className="flex items-center gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> Cambios fáciles</span>
          </div>
        </div>

        {/* Categorías tipo Chips de Selección Rápida */}
        <div className="mt-14 pt-8 border-t border-zinc-300/70">
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-3">
            Categorías populares
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                onSeleccionarCategoria(null);
                onExplorar();
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all ${
                categoriaSeleccionada === null
                  ? 'bg-black text-white shadow-md'
                  : 'bg-white border border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:text-black'
              }`}
            >
              Todas las prendas
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
                    ? 'bg-black text-white shadow-md'
                    : 'bg-white border border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:text-black'
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
