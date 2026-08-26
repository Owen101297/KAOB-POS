'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  onExplorarClick?: () => void;
  onCategoriaClick?: (categoria: string) => void;
}

export default function HeroBanner({ onExplorarClick, onCategoriaClick }: Props) {
  return (
    <section className="relative w-full border-b border-zinc-200/80 bg-[#FAFAFA] text-zinc-900 overflow-hidden">
      {/* Grid 50/50 Editorial */}
      <div className="max-w-[1520px] mx-auto grid grid-cols-1 lg:grid-cols-2 min-h-[640px] lg:min-h-[720px] items-stretch">
        
        {/* Columna Izquierda: Texto Editorial & CTAs */}
        <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 lg:py-20 z-10">
          
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-zinc-100 border border-zinc-200/80 w-fit">
            <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
            <span className="text-[11px] font-bold tracking-[0.25em] text-zinc-800 uppercase">
              NEW COLLECTION // DROP 01
            </span>
          </div>

          {/* Título Monumental H1 */}
          <h1 className="font-serif text-4xl sm:text-6xl xl:text-7xl font-light tracking-tight text-zinc-950 leading-[1.05] mb-6">
            TIMELESS <br />
            <span className="italic font-normal">BY NATURE</span>
          </h1>

          {/* Subtítulo Descriptivo */}
          <p className="text-sm sm:text-base text-zinc-600 max-w-lg leading-relaxed mb-8 font-light">
            Siluetas de alta densidad concebidas bajo la estética del streetwear de autor.
            Estructura, gramaje pesado y cortes contemporáneos diseñados para perdurar.
          </p>

          {/* Botones de Acción */}
          <div className="flex flex-wrap items-center gap-3.5 mb-10">
            <Button
              size="lg"
              onClick={onExplorarClick}
              className="bg-black hover:bg-zinc-800 text-white rounded-none px-8 py-6 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 shadow-md hover:shadow-xl group"
            >
              <span>SHOP NOW</span>
              <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => onCategoriaClick?.('HOODIES & CHAQUETAS')}
              className="border-zinc-300 hover:border-black hover:bg-zinc-100 text-zinc-900 rounded-none px-6 py-6 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300"
            >
              EXPLORAR DROPS
            </Button>
          </div>

          {/* Micro-especificaciones de Confección */}
          <div className="pt-6 border-t border-zinc-200/80 flex items-center gap-8 text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
            <div>
              <span className="text-zinc-950 font-bold block text-sm">240+ GSM</span>
              <span>Heavyweight Cotton</span>
            </div>
            <div className="w-px h-8 bg-zinc-200" />
            <div>
              <span className="text-zinc-950 font-bold block text-sm">BOXY FIT</span>
              <span>Silueta Estructurada</span>
            </div>
            <div className="w-px h-8 bg-zinc-200" />
            <div>
              <span className="text-zinc-950 font-bold block text-sm">COLOMBIA</span>
              <span>Confección de Autor</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Fotografía Editorial de Pasarela */}
        <div className="relative min-h-[420px] lg:min-h-full bg-zinc-100 overflow-hidden group">
          {/* Fondo estético con imagen de alta gama */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10" />
          
          <img
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1400"
            alt="KΛOB Modern Wear Editorial Collection"
            className="w-full h-full object-cover object-top transition-transform duration-1000 ease-out group-hover:scale-105"
          />

          {/* Tag de Colección Flotante */}
          <div className="absolute bottom-8 right-8 z-20 bg-white/90 backdrop-blur-md px-5 py-3 border border-zinc-200/80 shadow-lg text-right hidden sm:block">
            <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase block">LOOKBOOK 2026</span>
            <span className="text-xs font-bold tracking-wider text-zinc-950 uppercase">KΛOB // ESSENTIALS</span>
          </div>
        </div>

      </div>
    </section>
  );
}
