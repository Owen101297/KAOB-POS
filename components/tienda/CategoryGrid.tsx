'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface CategoryItem {
  id: string;
  nombre: string;
  genero?: string;
  categoriaDb?: string;
  subtitulo: string;
  imagen: string;
}

const CATEGORIAS_SHOWCASE: CategoryItem[] = [
  {
    id: 'men',
    nombre: 'MEN',
    genero: 'CABALLERO',
    subtitulo: 'Oversize Tees & Streetwear',
    imagen: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'women',
    nombre: 'WOMEN',
    genero: 'DAMA',
    subtitulo: 'Tops, Sets & Contemporary Cuts',
    imagen: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'tops',
    nombre: 'TOPS & HOODIES',
    categoriaDb: 'HOODIES & CHAQUETAS',
    subtitulo: 'Heavyweight Fleece & Jackets',
    imagen: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'accessories',
    nombre: 'ACCESSORIES',
    genero: 'ACCESORIOS',
    subtitulo: 'Caps, Bags & Essentials',
    imagen: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=800',
  },
];

interface Props {
  onSelectCategory?: (categoria: string | null, genero: string | null) => void;
}

export default function CategoryGrid({ onSelectCategory }: Props) {
  return (
    <section className="w-full py-16 sm:py-24 bg-[#FAFAFA] border-b border-zinc-200/80">
      <div className="max-w-[1520px] mx-auto px-4 sm:px-8">
        
        {/* Encabezado Centrado */}
        <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
          <span className="text-[11px] font-bold tracking-[0.25em] text-zinc-500 uppercase block mb-2">
            ELEVATED ESSENTIALS
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-light tracking-tight text-zinc-950 uppercase">
            Explora por Colección
          </h2>
        </div>

        {/* Grid de 4 Columnas con Aspect Ratio Vertical 3:4 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {CATEGORIAS_SHOWCASE.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory?.(cat.categoriaDb || null, cat.genero || null)}
              className="group relative aspect-[3/4] overflow-hidden bg-zinc-900 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500"
            >
              {/* Imagen con zoom sutil */}
              <img
                src={cat.imagen}
                alt={cat.nombre}
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 opacity-85 group-hover:opacity-95"
              />

              {/* Overlay de gradiente tenue */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/90" />

              {/* Contenido Central & Inferior */}
              <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end text-white z-10">
                <span className="text-[10px] font-medium tracking-[0.2em] text-zinc-300 uppercase block mb-1">
                  {cat.subtitulo}
                </span>
                
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-wider uppercase">
                    {cat.nombre}
                  </h3>
                  <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:bg-white group-hover:text-black">
                    <ArrowUpRight className="w-4 h-4 text-white group-hover:text-black transition-colors" />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/20 flex items-center gap-1 text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-200 group-hover:text-white">
                  <span>SHOP NOW</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
