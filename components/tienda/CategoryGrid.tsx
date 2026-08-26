'use client';

import React, { useMemo } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { ProductoLista } from '@/lib/actions/productos';

interface Props {
  categorias?: { id: number; nombre: string }[];
  productos?: ProductoLista[];
  onSelectCategory?: (categoria: string | null, genero: string | null) => void;
}

interface CategoryShowcaseItem {
  id: string;
  nombre: string;
  subtitulo: string;
  imagen: string;
  categoriaDb?: string;
  genero?: string;
}

// Imágenes de fallback editorial por palabra clave si la categoría aún no tiene fotos cargadas
const IMAGENES_FALLBACK: Record<string, string> = {
  camisetas: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800',
  hoodies: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=800',
  chaquetas: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=800',
  pantalones: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=800',
  bermudas: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=800',
  vestidos: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800',
  tops: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800',
  accesorios: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=800',
  gorras: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=800',
  default: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=800',
};

function obtenerImagenFallback(nombreCat: string): string {
  const norm = nombreCat.toLowerCase();
  for (const [key, url] of Object.entries(IMAGENES_FALLBACK)) {
    if (norm.includes(key)) return url;
  }
  return IMAGENES_FALLBACK.default;
}

export default function CategoryGrid({
  categorias = [],
  productos = [],
  onSelectCategory,
}: Props) {
  // Construir tarjetas dinámicas basadas 100% en las categorías reales del inventario
  const categoriasShowcase: CategoryShowcaseItem[] = useMemo(() => {
    // Si tenemos categorías en la base de datos con productos
    if (categorias.length > 0) {
      return categorias.slice(0, 8).map((cat) => {
        const productosEnCat = productos.filter((p) => p.categoriaId === cat.id && p.activo);
        const conFoto = productosEnCat.find((p) => p.imagenes && p.imagenes.length > 0);
        const fotoKey = conFoto?.imagenes?.find((im) => im.esPrincipal)?.key || conFoto?.imagenes?.[0]?.key;
        
        const imagen = fotoKey ? `/api/media/${fotoKey}` : obtenerImagenFallback(cat.nombre);

        return {
          id: String(cat.id),
          nombre: cat.nombre,
          categoriaDb: cat.nombre,
          subtitulo: `${productosEnCat.length} ${productosEnCat.length === 1 ? 'prenda' : 'prendas'} disponibles`,
          imagen,
        };
      });
    }

    // Fallback si no hay categorías creadas aún
    return [
      {
        id: 'men',
        nombre: 'CABALLERO',
        genero: 'CABALLERO',
        subtitulo: 'Colección Streetwear & Oversize',
        imagen: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=800',
      },
      {
        id: 'women',
        nombre: 'DAMA',
        genero: 'DAMA',
        subtitulo: 'Tops & Siluetas Contemporáneas',
        imagen: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800',
      },
      {
        id: 'unisex',
        nombre: 'OVERSIZE & UNISEX',
        genero: 'UNISEX',
        subtitulo: 'Prendas Boxy Fit 240+ GSM',
        imagen: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=800',
      },
      {
        id: 'accessories',
        nombre: 'ACCESORIOS',
        genero: 'ACCESORIOS',
        subtitulo: 'Headwear & Essentials',
        imagen: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=800',
      },
    ];
  }, [categorias, productos]);

  if (categoriasShowcase.length === 0) return null;

  return (
    <section className="w-full py-16 sm:py-24 bg-[#FAFAFA] border-b border-zinc-200/80">
      <div className="max-w-[1520px] mx-auto px-4 sm:px-8">
        
        {/* Encabezado Centrado */}
        <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
          <span className="text-[10px] font-bold tracking-[0.25em] text-zinc-500 uppercase block mb-2">
            ELEVATED ESSENTIALS
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-light tracking-tight text-zinc-950 uppercase">
            Explora por Colección
          </h2>
          <p className="text-xs text-zinc-500 font-light mt-1">
            Categorías activas sincronizadas en tiempo real con nuestro atelier e inventario.
          </p>
        </div>

        {/* Grid Dinámico de 2 a 4 Columnas con Aspect Ratio Vertical 3:4 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categoriasShowcase.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory?.(cat.categoriaDb || null, cat.genero || null)}
              className="group relative aspect-[3/4] overflow-hidden bg-zinc-900 cursor-pointer shadow-xs hover:shadow-2xl transition-all duration-500"
            >
              {/* Imagen de Portada */}
              <img
                src={cat.imagen}
                alt={cat.nombre}
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 opacity-85 group-hover:opacity-95"
              />

              {/* Overlay de gradiente */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent transition-opacity duration-300 group-hover:from-black/90" />

              {/* Contenido */}
              <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end text-white z-10">
                <span className="text-[10px] font-mono tracking-widest text-zinc-300 uppercase block mb-1">
                  {cat.subtitulo}
                </span>
                
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl sm:text-2xl font-normal tracking-wider uppercase">
                    {cat.nombre}
                  </h3>
                  <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:bg-white group-hover:text-black">
                    <ArrowUpRight className="w-4 h-4 text-white group-hover:text-black transition-colors" />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/20 flex items-center gap-1 text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-200 group-hover:text-white">
                  <span>VER CATEGORÍA</span>
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
