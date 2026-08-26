'use client';

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { ProductoLista } from '@/lib/actions/productos';
import ProductCardTienda, { type ItemBolsa } from './ProductCardTienda';

interface Props {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  productos: ProductoLista[];
  ventasPorProducto?: Record<number, number>;
  onAgregarABolsa: (item: ItemBolsa) => void;
  onVerDetalle: (producto: ProductoLista) => void;
  onVerTodos?: () => void;
  wishlistIds?: number[];
  onToggleWishlist?: (productoId: number) => void;
}

export default function ProductSection({
  title,
  subtitle,
  eyebrow,
  productos,
  ventasPorProducto = {},
  onAgregarABolsa,
  onVerDetalle,
  onVerTodos,
  wishlistIds = [],
  onToggleWishlist,
}: Props) {
  if (!productos || productos.length === 0) return null;

  return (
    <section className="w-full py-14 sm:py-20 bg-white border-b border-zinc-200/80">
      <div className="max-w-[1520px] mx-auto px-4 sm:px-8">
        
        {/* Encabezado: Título a la Izquierda y Enlace VIEW ALL a la Derecha */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12 pb-4 border-b border-zinc-200/80">
          <div>
            {eyebrow && (
              <span className="text-[10px] font-bold tracking-[0.25em] text-zinc-400 uppercase block mb-1">
                {eyebrow}
              </span>
            )}
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-zinc-950 uppercase">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-zinc-500 font-light mt-1">
                {subtitle}
              </p>
            )}
          </div>

          {onVerTodos && (
            <button
              type="button"
              onClick={onVerTodos}
              className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.2em] uppercase text-zinc-900 hover:text-black transition-all group pb-1 self-start sm:self-auto"
            >
              <span>VIEW ALL</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          )}
        </div>

        {/* Grid de 6 Columnas (Responsive 2 cols en mobile, 3 en tablet, 6 en desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
          {productos.slice(0, 6).map((producto) => (
            <ProductCardTienda
              key={producto.id}
              producto={producto}
              onAgregarABolsa={onAgregarABolsa}
              onVerDetalle={onVerDetalle}
              vendidosRecientes={ventasPorProducto[producto.id] ?? 0}
              isWishlisted={wishlistIds.includes(producto.id)}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
