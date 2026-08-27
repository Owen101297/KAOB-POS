'use client';

import { useState, useMemo, useEffect } from 'react';
import { ShoppingBag, Eye, Check, Heart, Sparkles, Flame } from 'lucide-react';
import type { ProductoLista } from '@/lib/actions/productos';
import { formatoCOP } from '@/lib/format';
import { CALIDAD_LABEL } from '@/lib/constants';
import { ProductCardPaymentBadges } from './PaymentMethodsBadges';

export interface ItemBolsa {
  varianteId: number;
  productoId: number;
  nombre: string;
  referencia: string;
  colorNombre: string;
  colorHex: string | null;
  tallaValor: string;
  precio: number;
  cantidad: number;
  stockDisponible: number;
}

interface Props {
  producto: ProductoLista;
  onAgregarABolsa: (item: ItemBolsa) => void;
  onVerDetalle: (producto: ProductoLista) => void;
  vendidosRecientes?: number;
  isWishlisted?: boolean;
  onToggleWishlist?: (productoId: number) => void;
}

export default function ProductCardTienda({
  producto,
  onAgregarABolsa,
  onVerDetalle,
  vendidosRecientes = 0,
  isWishlisted = false,
  onToggleWishlist,
}: Props) {
  // Colores disponibles únicos
  const coloresDisponibles = useMemo(() => {
    const map = new Map<number, { id: number; nombre: string; hex: string | null }>();
    producto.variantes.forEach((v) => {
      if (!map.has(v.color.id)) {
        map.set(v.color.id, v.color);
      }
    });
    return Array.from(map.values());
  }, [producto]);

  const [colorSeleccionadoId, setColorSeleccionadoId] = useState<number>(
    coloresDisponibles[0]?.id ?? 0
  );

  // Variantes correspondientes al color seleccionado
  const variantesDelColor = useMemo(() => {
    return producto.variantes.filter((v) => v.color.id === colorSeleccionadoId);
  }, [producto, colorSeleccionadoId]);

  const [varianteSeleccionadaId, setVarianteSeleccionadaId] = useState<number | null>(
    variantesDelColor[0]?.id ?? null
  );

  // Variante activa seleccionada
  const varianteActiva = useMemo(() => {
    return (
      producto.variantes.find((v) => v.id === varianteSeleccionadaId) ??
      variantesDelColor[0] ??
      producto.variantes[0]
    );
  }, [producto, varianteSeleccionadaId, variantesDelColor]);

  // Stock disponible
  const stockDisponible = useMemo(() => {
    if (!varianteActiva) return 0;
    return varianteActiva.stocks.reduce((acc, s) => acc + s.cantidad, 0);
  }, [varianteActiva]);

  // Stock total de todo el producto
  const stockTotalProducto = useMemo(() => {
    return producto.variantes.reduce(
      (acc, v) => acc + v.stocks.reduce((sAcc, s) => sAcc + s.cantidad, 0),
      0
    );
  }, [producto]);

  const [agregadoAnim, setAgregadoAnim] = useState(false);
  const precioEfectivo = varianteActiva?.precioOverride ?? producto.precioBase;

  const handleAgregarDirecto = (variante: typeof producto.variantes[0], e: React.MouseEvent) => {
    e.stopPropagation();
    const stockVar = variante.stocks.reduce((acc, s) => acc + s.cantidad, 0);
    if (stockVar <= 0) return;

    onAgregarABolsa({
      varianteId: variante.id,
      productoId: producto.id,
      nombre: producto.nombre,
      referencia: producto.referencia,
      colorNombre: variante.color.nombre,
      colorHex: variante.color.hex,
      tallaValor: variante.talla.valor,
      precio: variante.precioOverride ?? producto.precioBase,
      cantidad: 1,
      stockDisponible: stockVar,
    });

    setAgregadoAnim(true);
    setTimeout(() => setAgregadoAnim(false), 1500);
  };

  const estaAgotado = stockTotalProducto <= 0;
  const stockVarianteAgotado = stockDisponible <= 0;

  // Imagen asociada al color seleccionado o portada
  const imagenMostrada = useMemo(() => {
    const delColor = producto.imagenes?.find((im) => im.colorId === colorSeleccionadoId);
    if (delColor) return delColor;
    const principal = producto.imagenes?.find((im) => im.esPrincipal);
    if (principal) return principal;
    return producto.imagenes?.[0] ?? null;
  }, [producto.imagenes, colorSeleccionadoId]);

  return (
    <div
      onClick={() => onVerDetalle(producto)}
      className="group relative flex flex-col justify-between bg-white border border-zinc-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      {/* Contenedor Superior de Imagen (Aspect Ratio 4:5 Lookbook) */}
      <div className="relative aspect-[4/5] w-full bg-zinc-100 flex items-center justify-center overflow-hidden">
        {imagenMostrada ? (
          <img
            src={`/api/media/${imagenMostrada.key}`}
            alt={imagenMostrada.alt ?? producto.nombre}
            className="absolute inset-0 h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-zinc-100/90 p-4">
            {/* Monograma oficial de fondo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:scale-110 transition-transform duration-700">
              <img src="/brand/isotype.jpeg" alt="" className="w-2/3 h-2/3 object-contain rounded-full opacity-20" />
            </div>

            <div className="relative z-10 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-white shadow-sm border border-zinc-200 flex items-center justify-center group-hover:rotate-6 transition-transform duration-300">
                <span className="font-serif font-bold text-lg text-zinc-950">
                  {producto.nombre.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <span className="mt-2 block font-mono text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                {producto.referencia}
              </span>
            </div>
          </div>
        )}

        {/* Badges Superiores Izquierda */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-20">
          {estaAgotado ? (
            <span className="px-2 py-0.5 bg-black text-white text-[9px] font-bold uppercase tracking-widest">
              Agotado
            </span>
          ) : stockDisponible <= 3 ? (
            <span className="px-2 py-0.5 bg-zinc-900 text-white text-[9px] font-bold uppercase tracking-widest">
              Últimas {stockDisponible} unds
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-white/90 backdrop-blur-md text-zinc-950 text-[9px] font-bold uppercase tracking-widest border border-zinc-200">
              NEW DROP
            </span>
          )}

          {vendidosRecientes >= 3 && (
            <span className="px-2 py-0.5 bg-black text-white text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
              <Flame className="h-2.5 w-2.5 text-amber-400" /> {vendidosRecientes} TOP
            </span>
          )}
        </div>

        {/* Botón Flotante de Favoritos (Wishlist) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist?.(producto.id);
          }}
          className={`absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 ${
            isWishlisted
              ? 'bg-black text-red-500 shadow-md scale-105'
              : 'bg-white/80 text-zinc-600 hover:bg-white hover:text-black shadow-xs'
          }`}
          title={isWishlisted ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {/* Quick-Add Drawer Flotante de Tallas (Aparece en hover) */}
        {!estaAgotado && variantesDelColor.length > 0 && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-zinc-200/80 p-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20 flex items-center justify-between gap-1"
          >
            <span className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase pl-1">
              QUICK ADD:
            </span>
            <div className="flex items-center gap-1 flex-wrap justify-end">
              {variantesDelColor.map((v) => {
                const vStock = v.stocks.reduce((acc, s) => acc + s.cantidad, 0);
                const sinStock = vStock <= 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={sinStock}
                    onClick={(e) => handleAgregarDirecto(v, e)}
                    className={`min-w-6 px-1.5 py-0.5 text-[10px] font-bold uppercase transition-all ${
                      sinStock
                        ? 'text-zinc-300 line-through cursor-not-allowed'
                        : 'bg-zinc-100 hover:bg-black hover:text-white text-zinc-800'
                    }`}
                  >
                    {v.talla.valor}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Información del Producto */}
      <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 bg-white">
        <div>
          {/* Categoría & Calidad */}
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
            <span>{producto.categoria?.nombre ?? 'ESSENTIALS'}</span>
            {producto.calidad && <span>{CALIDAD_LABEL[producto.calidad as keyof typeof CALIDAD_LABEL] ?? producto.calidad}</span>}
          </div>

          {/* Nombre de Producto */}
          <h3 className="text-xs sm:text-sm font-bold text-zinc-950 uppercase tracking-wider line-clamp-1 group-hover:text-black">
            {producto.nombre}
          </h3>

          {/* Selector de Swatches de Color */}
          {coloresDisponibles.length > 0 && (
            <div className="mt-2 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {coloresDisponibles.map((c) => {
                const esSel = c.id === colorSeleccionadoId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setColorSeleccionadoId(c.id);
                      const primeraVar = producto.variantes.find((v) => v.color.id === c.id);
                      if (primeraVar) setVarianteSeleccionadaId(primeraVar.id);
                    }}
                    className={`h-3 w-3 rounded-full border transition-all ${
                      esSel ? 'ring-2 ring-black ring-offset-1 scale-110' : 'border-zinc-300 opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex ?? '#000000' }}
                    title={c.nombre}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Precio & Tira de SVGs de Pago */}
        <div className="mt-3 pt-2.5 border-t border-zinc-100">
          <div className="flex items-baseline justify-between">
            <span className="text-sm sm:text-base font-black text-zinc-950">
              {formatoCOP(precioEfectivo)}
            </span>
            <span className="text-[10px] font-mono text-zinc-400 uppercase">
              {producto.referencia}
            </span>
          </div>

          {/* Tira Oficial SVG de Medios de Pago */}
          <div className="mt-1.5 pt-1.5 border-t border-zinc-100/60">
            <ProductCardPaymentBadges />
          </div>
        </div>
      </div>
    </div>
  );
}
