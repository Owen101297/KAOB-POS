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
    <section className="w-full py-8 sm:py-10 bg-white border-b border-zinc-200/80">
      <div className="max-w-[1520px] mx-auto px-4 sm:px-8">
        
        {/* Encabezado Compacto con Acción Precisa */}
        <div className="flex items-end justify-between gap-4 mb-5 pb-2.5 border-b border-zinc-200/80">
          <div>
            {eyebrow && (
              <span className="text-[9.5px] font-bold tracking-[0.25em] text-zinc-400 uppercase block">
                {eyebrow}
              </span>
            )}
            <h2 className="font-serif text-lg sm:text-2xl font-light tracking-tight text-zinc-950 uppercase">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[11px] text-zinc-500 font-light mt-0.5 hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>

          {onVerTodos && (
            <button
              type="button"
              onClick={onVerTodos}
              className="inline-flex items-center gap-1 text-[11px] font-bold tracking-[0.18em] uppercase text-zinc-900 hover:text-black transition-all group pb-0.5 shrink-0"
            >
              <span>VER TODO</span>
              <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          )}
        </div>

        {/* Grid de Alta Densidad: 2 columnas en móvil, 3 en tablet, 5 o 6 en desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5 lg:gap-4">
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
