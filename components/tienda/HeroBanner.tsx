'use client';

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  onExplorarClick?: () => void;
  onCategoriaClick?: (genero: string) => void;
}

export default function HeroBanner({ onExplorarClick, onCategoriaClick }: Props) {
  return (
    <section className="relative w-full border-b border-zinc-200/80 bg-[#FAFAFA] text-zinc-900 overflow-hidden">
      {/* Grid 55/45 Editorial Compacto */}
      <div className="max-w-[1520px] mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[300px] sm:min-h-[360px] lg:min-h-[390px] items-stretch">
        
        {/* Columna Izquierda: Texto & CTAs (7 columnas) */}
        <div className="lg:col-span-7 flex flex-col justify-center px-5 sm:px-10 lg:px-14 py-8 sm:py-10 z-10">
          
          {/* Eyebrow badge compacto */}
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 mb-3.5 rounded-full bg-zinc-100 border border-zinc-200/80 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.25em] text-zinc-800 uppercase">
              NEW DROP // 2026
            </span>
          </div>

          {/* Título Compacto */}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-zinc-950 leading-[1.1] mb-3">
            TIMELESS <span className="italic font-normal">BY NATURE</span>
          </h1>

          {/* Subtítulo Descriptivo Corto */}
          <p className="text-xs sm:text-sm text-zinc-600 max-w-lg leading-relaxed mb-6 font-light">
            Streetwear de alta densidad en algodón 240g. Siluetas estructuradas y cortes contemporáneos diseñados para perdurar.
          </p>

          {/* Botones de Acción con Precisión */}
          <div className="flex flex-wrap items-center gap-2.5 mb-6">
            <Button
              size="md"
              onClick={onExplorarClick}
              className="bg-black hover:bg-zinc-800 text-white rounded-none px-6 py-5 text-xs font-bold tracking-[0.18em] uppercase transition-all duration-300 shadow-sm hover:shadow-md group"
            >
              <span>SHOP NOW</span>
              <ArrowRight className="w-3.5 h-3.5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() => onCategoriaClick?.('CABALLERO')}
              className="border-zinc-300 hover:border-black hover:bg-zinc-100 text-zinc-900 rounded-none px-5 py-5 text-xs font-bold tracking-[0.18em] uppercase transition-all duration-300"
            >
              VER HOMBRE
            </Button>

            <Button
              variant="ghost"
              size="md"
              onClick={() => onCategoriaClick?.('DAMA')}
              className="text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-none px-4 py-5 text-xs font-bold tracking-[0.18em] uppercase transition-all duration-300"
            >
              VER MUJER
            </Button>
          </div>

          {/* Micro-especificaciones compactas */}
          <div className="pt-4 border-t border-zinc-200/80 flex items-center gap-6 text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
            <div>
              <span className="text-zinc-950 font-bold block text-xs">240+ GSM</span>
              <span>Heavyweight</span>
            </div>
            <div className="w-px h-6 bg-zinc-200" />
            <div>
              <span className="text-zinc-950 font-bold block text-xs">BOXY FIT</span>
              <span>Silueta Moderna</span>
            </div>
            <div className="w-px h-6 bg-zinc-200" />
            <div>
              <span className="text-zinc-950 font-bold block text-xs">COLOMBIA</span>
              <span>Confección Autor</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Imagen Editorial Compacta (5 columnas) */}
        <div className="lg:col-span-5 relative min-h-[200px] sm:min-h-[260px] lg:min-h-full bg-zinc-100 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10" />
          
          <img
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1200"
            alt="KΛOB Modern Wear"
            className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
          />

          <div className="absolute bottom-4 right-4 z-20 bg-white/90 backdrop-blur-md px-3.5 py-2 border border-zinc-200/80 shadow-sm text-right hidden sm:block">
            <span className="text-[9px] font-bold tracking-[0.2em] text-zinc-400 uppercase block">LOOKBOOK 2026</span>
            <span className="text-[11px] font-bold tracking-wider text-zinc-950 uppercase">KΛOB // ESSENTIALS</span>
          </div>
        </div>

      </div>
    </section>
  );
}
