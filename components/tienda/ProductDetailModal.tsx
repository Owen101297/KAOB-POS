'use client';

import { useState, useMemo } from 'react';
import { X, ShoppingBag, Check, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import type { ProductoLista } from '@/lib/actions/productos';
import { formatoCOP } from '@/lib/format';
import { CALIDAD_LABEL } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import FinanciacionCalculadora from './FinanciacionCalculadora';

interface ItemBolsa {
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
  producto: ProductoLista | null;
  abierto: boolean;
  onCerrar: () => void;
  onAgregarABolsa: (item: ItemBolsa) => void;
}

export default function ProductDetailModal({
  producto,
  abierto,
  onCerrar,
  onAgregarABolsa,
}: Props) {
  if (!abierto || !producto) return null;

  // Colores únicos
  const colores = useMemo(() => {
    const map = new Map<number, { id: number; nombre: string; hex: string | null }>();
    producto.variantes.forEach((v) => {
      if (!map.has(v.color.id)) map.set(v.color.id, v.color);
    });
    return Array.from(map.values());
  }, [producto]);

  const [colorSelId, setColorSelId] = useState<number>(colores[0]?.id ?? 0);

  const variantesColor = useMemo(() => {
    return producto.variantes.filter((v) => v.color.id === colorSelId);
  }, [producto, colorSelId]);

  const [varianteSelId, setVarianteSelId] = useState<number>(
    variantesColor[0]?.id ?? producto.variantes[0]?.id ?? 0
  );

  const varianteActiva = useMemo(() => {
    return (
      producto.variantes.find((v) => v.id === varianteSelId) ??
      variantesColor[0] ??
      producto.variantes[0]
    );
  }, [producto, varianteSelId, variantesColor]);

  const stockDisponible = useMemo(() => {
    if (!varianteActiva) return 0;
    return varianteActiva.stocks.reduce((acc, s) => acc + s.cantidad, 0);
  }, [varianteActiva]);

  const [cantidad, setCantidad] = useState(1);
  const [agregadoAnim, setAgregadoAnim] = useState(false);

  const precio = varianteActiva?.precioOverride ?? producto.precioBase;

  const imagenMostrada = useMemo(() => {
    const delColor = producto.imagenes?.find((im) => im.colorId === colorSelId);
    if (delColor) return delColor;
    const principal = producto.imagenes?.find((im) => im.esPrincipal);
    if (principal) return principal;
    return producto.imagenes?.[0] ?? null;
  }, [producto.imagenes, colorSelId]);

  const handleAgregar = () => {
    if (!varianteActiva || stockDisponible <= 0) return;
    onAgregarABolsa({
      varianteId: varianteActiva.id,
      productoId: producto.id,
      nombre: producto.nombre,
      referencia: producto.referencia,
      colorNombre: varianteActiva.color.nombre,
      colorHex: varianteActiva.color.hex,
      tallaValor: varianteActiva.talla.valor,
      precio,
      cantidad: Math.min(cantidad, stockDisponible),
      stockDisponible,
    });
    setAgregadoAnim(true);
    setTimeout(() => {
      setAgregadoAnim(false);
      onCerrar();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-zinc-200">
        
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onCerrar}
          className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-black transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8">
          
          {/* Columna Izquierda: Foto del producto */}
          <div className="relative aspect-square w-full rounded-2xl bg-gradient-to-b from-stone-100 to-stone-200 flex items-center justify-center overflow-hidden border border-zinc-200">
            {imagenMostrada ? (
              <img
                src={`/api/media/${imagenMostrada.key}`}
                alt={imagenMostrada.alt ?? producto.nombre}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <>
                <div className="absolute inset-0 flex items-center justify-center opacity-15">
                  <img src="/brand/isotype.svg" alt="" className="w-3/4 h-3/4 object-contain" />
                </div>
                <div className="relative z-10 text-center">
                  <div className="w-28 h-28 rounded-full bg-white shadow-lg flex items-center justify-center mx-auto border border-zinc-200">
                    <span className="font-extrabold text-3xl font-serif text-zinc-900">
                      {producto.nombre.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <span className="mt-3 block font-mono text-xs font-bold tracking-widest text-zinc-600">
                    REF: {producto.referencia}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Columna Derecha: Detalles y Selección */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                  {producto.categoria?.nombre ?? 'Prenda'}
                </span>
                {producto.calidad && (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-white text-[9px] font-bold uppercase tracking-wider">
                    {CALIDAD_LABEL[producto.calidad as keyof typeof CALIDAD_LABEL] ?? producto.calidad}
                  </span>
                )}
              </div>

              <h2 className="font-display text-xl sm:text-2xl font-bold text-zinc-900 mt-1 tracking-tight">
                {producto.nombre}
              </h2>

              <p className="text-2xl font-black text-zinc-900 mt-2">
                {formatoCOP(precio)}
              </p>

              {producto.descripcion && (
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                  {producto.descripcion}
                </p>
              )}

              <div className="mt-4">
                <FinanciacionCalculadora precio={precio} variante="completa" />
              </div>

              {/* Selector de Color */}
              <div className="mt-4 pt-3 border-t border-zinc-100">
                <div className="flex justify-between text-xs font-semibold text-zinc-700 mb-2">
                  <span>Color: <strong className="text-black">{varianteActiva?.color.nombre}</strong></span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {colores.map((c) => {
                    const esSel = c.id === colorSelId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setColorSelId(c.id);
                          const vDelColor = producto.variantes.find((v) => v.color.id === c.id);
                          if (vDelColor) setVarianteSelId(vDelColor.id);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                          esSel
                            ? 'border-black bg-zinc-900 text-white shadow-sm'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                        }`}
                      >
                        <span
                          className="h-3 w-3 rounded-full border border-white/20"
                          style={{ backgroundColor: c.hex ?? '#000000' }}
                        />
                        {c.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selector de Talla */}
              <div className="mt-4">
                <div className="flex justify-between text-xs font-semibold text-zinc-700 mb-2">
                  <span>Talla: <strong className="text-black">{varianteActiva?.talla.valor}</strong></span>
                  <span className={stockDisponible > 0 ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                    {stockDisponible > 0 ? `${stockDisponible} disponibles` : 'Sin existencias'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {variantesColor.map((v) => {
                    const esSel = v.id === varianteActiva?.id;
                    const vStock = v.stocks.reduce((acc, s) => acc + s.cantidad, 0);
                    const agotado = vStock <= 0;

                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={agotado}
                        onClick={() => setVarianteSelId(v.id)}
                        className={`min-w-10 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          agotado
                            ? 'bg-zinc-100 text-zinc-300 line-through cursor-not-allowed border border-transparent'
                            : esSel
                            ? 'bg-black text-white shadow-md ring-2 ring-black'
                            : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200 border border-zinc-200'
                        }`}
                      >
                        {v.talla.valor}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contador de Cantidad */}
              {stockDisponible > 0 && (
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs font-semibold text-zinc-700">Cantidad:</span>
                  <div className="flex items-center rounded-xl border border-zinc-300 bg-zinc-50 p-1">
                    <button
                      type="button"
                      disabled={cantidad <= 1}
                      onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                      className="h-7 w-7 rounded-lg bg-white text-zinc-700 shadow-xs hover:bg-zinc-100 font-bold text-sm"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-bold">{cantidad}</span>
                    <button
                      type="button"
                      disabled={cantidad >= stockDisponible}
                      onClick={() => setCantidad((c) => Math.min(stockDisponible, c + 1))}
                      className="h-7 w-7 rounded-lg bg-white text-zinc-700 shadow-xs hover:bg-zinc-100 font-bold text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Botón Añadir a la Bolsa (sticky en móvil para que siempre esté visible) */}
            <div className="sticky bottom-0 -mx-6 sm:mx-0 px-6 sm:px-0 pt-4 pb-1 sm:pb-0 bg-white sm:bg-transparent border-t border-zinc-100 sm:static">
              <Button
                size="lg"
                disabled={stockDisponible <= 0}
                onClick={handleAgregar}
                className={`w-full py-6 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg transition-all active:scale-95 ${
                  agregadoAnim
                    ? 'bg-emerald-600 text-white'
                    : stockDisponible <= 0
                    ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-zinc-800'
                }`}
              >
                {agregadoAnim ? (
                  <>
                    <Check className="mr-2 h-4 w-4" /> ¡Añadido a la bolsa!
                  </>
                ) : stockDisponible <= 0 ? (
                  'Agotado en esta talla'
                ) : (
                  <>
                    <ShoppingBag className="mr-2 h-4 w-4" /> Añadir a la bolsa · {formatoCOP(precio * cantidad)}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
