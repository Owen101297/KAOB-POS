'use client';

import React from 'react';
import { ArrowUpRight, Sparkles, Layers, Check } from 'lucide-react';
import type { ProductoLista } from '@/lib/actions/productos';

interface SubcategoriaInfo {
  nombre: string;
  conteo: number;
}

interface Props {
  generoActivo: string | null;
  categoriaActiva: string | null;
  onSelectCategory: (categoria: string | null, genero: string | null) => void;
  subcategoriasDinamicas: SubcategoriaInfo[];
  totalProductosGenero: number;
  productos?: ProductoLista[];
}

interface MacroColeccion {
  id: string;
  genero: string;
  titulo: string;
  subtitulo: string;
  imagen: string;
}

const MACRO_COLECCIONES: MacroColeccion[] = [
  {
    id: 'caballero',
    genero: 'CABALLERO',
    titulo: 'CABALLERO',
    subtitulo: 'Streetwear & Boxy Silhouettes',
    imagen: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80&w=700',
  },
  {
    id: 'dama',
    genero: 'DAMA',
    titulo: 'DAMA',
    subtitulo: 'Tops, Hoodies & Elevated Fits',
    imagen: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=700',
  },
  {
    id: 'unisex',
    genero: 'UNISEX',
    titulo: 'UNISEX & OVERSIZE',
    subtitulo: 'Heavyweight Essentials 240g',
    imagen: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=700',
  },
  {
    id: 'accesorios',
    genero: 'ACCESORIOS',
    titulo: 'ACCESORIOS',
    subtitulo: 'Caps, Medias & Headwear',
    imagen: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=700',
  },
];

export default function CategoryGrid({
  generoActivo,
  categoriaActiva,
  onSelectCategory,
  subcategoriasDinamicas,
  totalProductosGenero,
}: Props) {
  const handleSeleccionarMacro = (genero: string) => {
    if (generoActivo === genero) {
      // Si ya está activo, deseleccionar para volver a todo
      onSelectCategory(null, null);
    } else {
      onSelectCategory(null, genero);
    }

    // Scroll suave y preciso al área de productos
    setTimeout(() => {
      const el = document.getElementById('catalogo-productos');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleSeleccionarSubcategoria = (catNombre: string | null) => {
    onSelectCategory(catNombre, generoActivo);
    setTimeout(() => {
      const el = document.getElementById('catalogo-productos');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <section className="w-full py-8 sm:py-10 bg-[#FAFAFA] border-b border-zinc-200/80">
      <div className="max-w-[1520px] mx-auto px-4 sm:px-8">
        
        {/* Encabezado Compacto */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6 pb-2 border-b border-zinc-200/80">
          <div>
            <span className="text-[9.5px] font-bold tracking-[0.25em] text-zinc-400 uppercase block">
              COLECCIONES PRINCIPALES
            </span>
            <h2 className="font-serif text-xl sm:text-2xl font-light tracking-tight text-zinc-950 uppercase">
              Explora por Género
            </h2>
          </div>
          <p className="text-[11px] text-zinc-500 font-light hidden sm:block">
            Selecciona un departamento para desplegar sus categorías en vivo
          </p>
        </div>

        {/* Grid de 4 Macro-Colecciones (2 columnas en móvil, 4 en desktop con altura compacta) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {MACRO_COLECCIONES.map((col) => {
            const estaActivo = generoActivo === col.genero;
            return (
              <div
                key={col.id}
                onClick={() => handleSeleccionarMacro(col.genero)}
                className={`group relative aspect-[16/10] sm:aspect-[4/3] overflow-hidden bg-zinc-900 cursor-pointer transition-all duration-300 ${
                  estaActivo
                    ? 'ring-2 ring-black shadow-lg scale-[1.01]'
                    : 'hover:shadow-md opacity-95 hover:opacity-100'
                }`}
              >
                {/* Imagen de fondo */}
                <img
                  src={col.imagen}
                  alt={col.titulo}
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Overlay de gradiente */}
                <div
                  className={`absolute inset-0 transition-opacity duration-300 ${
                    estaActivo
                      ? 'bg-gradient-to-t from-black/90 via-black/40 to-transparent'
                      : 'bg-gradient-to-t from-black/80 via-black/25 to-transparent group-hover:from-black/85'
                  }`}
                />

                {/* Tag de estado Activo */}
                {estaActivo && (
                  <div className="absolute top-2.5 right-2.5 bg-white text-black text-[9px] font-black tracking-widest px-2 py-0.5 uppercase shadow-md flex items-center gap-1 z-20">
                    <Check className="w-2.5 h-2.5 stroke-[3]" /> ACTIVO
                  </div>
                )}

                {/* Contenido en la tarjeta */}
                <div className="absolute inset-0 p-3.5 sm:p-5 flex flex-col justify-end text-white z-10">
                  <span className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase block line-clamp-1">
                    {col.subtitulo}
                  </span>
                  
                  <div className="flex items-center justify-between mt-0.5">
                    <h3 className="font-serif text-sm sm:text-lg font-medium tracking-wider uppercase">
                      {col.titulo}
                    </h3>
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-transform duration-300 ${
                        estaActivo
                          ? 'bg-white text-black'
                          : 'bg-white/20 backdrop-blur-md text-white group-hover:bg-white group-hover:text-black group-hover:translate-x-0.5'
                      }`}
                    >
                      <ArrowUpRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ────────────────────────────────────────────────────────────────────────── */}
        {/* DESPLIEGUE DINÁMICO DE SUBCATEGORÍAS SEGÚN EL MACRO-GÉNERO SELECCIONADO     */}
        {/* ────────────────────────────────────────────────────────────────────────── */}
        {generoActivo && subcategoriasDinamicas.length > 0 && (
          <div className="mt-4 p-3.5 sm:p-4 rounded-xl bg-white border border-zinc-200/80 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-zinc-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                  Categorías en {generoActivo}:
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  ({totalProductosGenero} {totalProductosGenero === 1 ? 'prenda' : 'prendas'})
                </span>
              </div>

              {categoriaActiva && (
                <button
                  type="button"
                  onClick={() => handleSeleccionarSubcategoria(null)}
                  className="text-[10px] font-bold tracking-wider text-zinc-500 hover:text-black uppercase underline self-start sm:self-auto"
                >
                  Ver todo {generoActivo}
                </button>
              )}
            </div>

            {/* Chips de subcategorías interactivas */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2.5">
              <button
                type="button"
                onClick={() => handleSeleccionarSubcategoria(null)}
                className={`px-3 py-1.5 text-xs font-bold tracking-wider uppercase rounded-lg transition-all ${
                  categoriaActiva === null
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                }`}
              >
                TODO ({totalProductosGenero})
              </button>

              {subcategoriasDinamicas.map((sub) => (
                <button
                  key={sub.nombre}
                  type="button"
                  onClick={() => handleSeleccionarSubcategoria(sub.nombre)}
                  className={`px-3 py-1.5 text-xs font-bold tracking-wider uppercase rounded-lg transition-all flex items-center gap-1.5 ${
                    categoriaActiva === sub.nombre
                      ? 'bg-black text-white shadow-xs scale-102'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  }`}
                >
                  <span>{sub.nombre}</span>
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded-full ${
                      categoriaActiva === sub.nombre ? 'bg-zinc-700 text-white' : 'bg-zinc-200 text-zinc-600'
                    }`}
                  >
                    {sub.conteo}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
