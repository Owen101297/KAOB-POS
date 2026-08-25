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
    <section className="relative overflow-hidden bg-black text-white border-b border-zinc-800/80">
      {/* Luz ambiental de fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[400px] bg-gradient-to-b from-zinc-800/50 via-zinc-900/20 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-24 relative z-10">
        <div className="max-w-3xl">
          
          {/* Badge Colección */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold uppercase tracking-widest text-zinc-200 mb-6 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>NUEVA COLECCIÓN 2026 · KAOB MODERN WEAR</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight uppercase leading-[1.05] font-sans">
            MODERN WEAR
            <span className="block text-zinc-500 font-extralight text-3xl sm:text-5xl md:text-6xl mt-1">
              ESTILO & VANGUARDIA
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-base text-zinc-300 font-normal max-w-xl leading-relaxed">
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
              className="bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase tracking-widest px-6 py-6 rounded-full shadow-xl transition-transform hover:scale-105 active:scale-95"
            >
              Colección Dama 👩
            </Button>

            <Button
              size="lg"
              onClick={() => {
                onSeleccionarGenero('CABALLERO');
                onExplorar();
              }}
              className="bg-zinc-900 border border-zinc-700 text-white hover:bg-zinc-800 font-bold text-xs uppercase tracking-widest px-6 py-6 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Colección Caballero 👨
            </Button>

            <Button
              variant="ghost"
              onClick={onExplorar}
              className="text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-widest px-4 py-6"
            >
              Ver Todo el Catálogo <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Categorías tipo Chips de Selección Rápida */}
        <div className="mt-14 pt-8 border-t border-zinc-800/80">
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
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
                  ? 'bg-white text-black shadow-md'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
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
                    ? 'bg-white text-black shadow-md'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
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
