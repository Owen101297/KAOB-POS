'use client';

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  onExplorarClick?: () => void;
}

export default function SplitBanner({ onExplorarClick }: Props) {
  return (
    <section className="w-full bg-[#FAFAFA] border-b border-zinc-200/80 overflow-hidden">
      <div className="max-w-[1520px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px] lg:min-h-[560px] items-stretch">
          
          {/* Columna Izquierda: Fondo Sólido Beige Claro Editorial (7 cols) */}
          <div className="lg:col-span-7 bg-[#F5F0EB] p-8 sm:p-14 lg:p-20 flex flex-col justify-center">
            <span className="text-[10px] font-bold tracking-[0.25em] text-zinc-500 uppercase block mb-3">
              ATELIER ARCHIVE // 2026
            </span>
            
            <h2 className="font-serif text-3xl sm:text-5xl font-light tracking-tight text-zinc-950 leading-[1.1] mb-6">
              Light. Refined. <br />
              <span className="italic font-normal">Effortless.</span>
            </h2>

            <p className="text-xs sm:text-sm text-zinc-600 font-light leading-relaxed max-w-md mb-8">
              Una oda al minimalismo táctil. Cada pieza es cortada y confeccionada
              con algodón de alto calibre, costuras dobles reforzadas y un tratamiento
              de lavado que aporta suavidad extrema sin perder estructura geométrica.
            </p>

            <div>
              <Button
                size="lg"
                onClick={onExplorarClick}
                className="bg-black hover:bg-zinc-800 text-white rounded-none px-8 py-6 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 shadow-md group"
              >
                <span>EXPLORE COLLECTION</span>
                <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </div>
          </div>

          {/* Columna Derecha: Fotografía de Detalle / Perchero / Textura (5 cols) */}
          <div className="lg:col-span-5 relative min-h-[350px] lg:min-h-full bg-zinc-200 overflow-hidden group">
            <img
              src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=1200"
              alt="KΛOB Atelier Fabric & Silhouette Details"
              className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105"
            />
            
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
            
            <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur-md px-4 py-2 text-white">
              <span className="text-[10px] font-mono tracking-widest uppercase">
                240 GSM // HEAVYWEIGHT JERSEY
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
