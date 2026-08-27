'use client';

import { useState, useMemo } from 'react';
import { X, ShoppingBag, Check, ShieldCheck, Truck, Sparkles, Ruler } from 'lucide-react';
import type { ProductoLista } from '@/lib/actions/productos';
import { formatoCOP } from '@/lib/format';
import { CALIDAD_LABEL } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { AddiLogo, SistecreditoLogo, NequiLogo, BancolombiaLogo, PlanSepareLogo } from './PaymentMethodsBadges';

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
  const [mostrarGuiaTallas, setMostrarGuiaTallas] = useState(false);

  // Colores únicos
  const colores = useMemo(() => {
    if (!producto) return [];
    const map = new Map<number, { id: number; nombre: string; hex: string | null }>();
    producto.variantes.forEach((v) => {
      if (!map.has(v.color.id)) map.set(v.color.id, v.color);
    });
    return Array.from(map.values());
  }, [producto]);

  const [colorSelId, setColorSelId] = useState<number>(colores[0]?.id ?? 0);

  const variantesColor = useMemo(() => {
    if (!producto) return [];
    return producto.variantes.filter((v) => v.color.id === colorSelId);
  }, [producto, colorSelId]);

  const [varianteSelId, setVarianteSelId] = useState<number>(
    variantesColor[0]?.id ?? producto?.variantes[0]?.id ?? 0
  );

  const varianteActiva = useMemo(() => {
    if (!producto) return null;
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

  if (!abierto || !producto) return null;

  const precio = varianteActiva?.precioOverride ?? producto.precioBase;

  const imagenMostrada = (() => {
    const delColor = producto.imagenes?.find((im) => im.colorId === colorSelId);
    if (delColor) return delColor;
    const principal = producto.imagenes?.find((im) => im.esPrincipal);
    if (principal) return principal;
    return producto.imagenes?.[0] ?? null;
  })();

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
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-white shadow-2xl border border-zinc-200 text-zinc-950">
        
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onCerrar}
          className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center bg-black text-white hover:bg-zinc-800 transition-colors shadow-md"
          aria-label="Cerrar modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-10">
          
          {/* Columna Izquierda: Fotografía de Detalle */}
          <div className="relative aspect-[4/5] w-full bg-zinc-100 flex items-center justify-center overflow-hidden border border-zinc-200">
            {imagenMostrada ? (
              <img
                src={`/api/media/${imagenMostrada.key}`}
                alt={imagenMostrada.alt ?? producto.nombre}
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-6">
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <img src="/brand/isotype.jpeg" alt="" className="w-3/4 h-3/4 object-contain rounded-full" />
                </div>
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto border border-zinc-200">
                    <span className="font-serif font-bold text-2xl text-zinc-950">
                      {producto.nombre.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <span className="mt-3 block font-mono text-xs font-bold tracking-widest text-zinc-400 uppercase">
                    REF: {producto.referencia}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Información & Compra */}
          <div className="flex flex-col justify-between space-y-5">
            <div>
              {/* Categoría & Calidad */}
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1">
                <span>{producto.categoria?.nombre ?? 'ESSENTIALS'}</span>
                {producto.calidad && <span>{CALIDAD_LABEL[producto.calidad as keyof typeof CALIDAD_LABEL] ?? producto.calidad}</span>}
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-light text-zinc-950 uppercase tracking-wide">
                {producto.nombre}
              </h2>

              <p className="text-xl sm:text-2xl font-black text-zinc-950 mt-2">
                {formatoCOP(precio)}
              </p>

              {producto.descripcion && (
                <p className="text-xs text-zinc-600 font-light mt-3 leading-relaxed">
                  {producto.descripcion}
                </p>
              )}

              {/* Tira Oficial SVG de Medios de Pago */}
              <div className="mt-4 p-3 bg-zinc-50 border border-zinc-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">
                  Métodos de Financiación y Pago Aceptados:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <AddiLogo className="h-4 w-auto rounded" />
                  <SistecreditoLogo className="h-4 w-auto rounded" />
                  <NequiLogo className="h-4 w-auto rounded" />
                  <BancolombiaLogo className="h-4 w-auto rounded" />
                  <PlanSepareLogo className="h-4 w-auto rounded" />
                </div>
              </div>

              {/* Selector de Color */}
              {colores.length > 0 && (
                <div className="mt-5 pt-4 border-t border-zinc-100">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-950 mb-2">
                    <span>Color: <strong className="text-zinc-600 font-normal">{varianteActiva?.color.nombre}</strong></span>
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
                          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase transition-all ${
                            esSel
                              ? 'bg-black text-white'
                              : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
                          }`}
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full border border-black/20"
                            style={{ backgroundColor: c.hex ?? '#000000' }}
                          />
                          <span>{c.nombre}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selector de Talla + Guía de Tallas */}
              {variantesColor.length > 0 && (
                <div className="mt-4 pt-3 border-t border-zinc-100">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-zinc-950 mb-2">
                    <span>Selecciona tu Talla:</span>
                    <button
                      type="button"
                      onClick={() => setMostrarGuiaTallas(!mostrarGuiaTallas)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-black uppercase tracking-wider underline"
                    >
                      <Ruler className="w-3 h-3" />
                      <span>{mostrarGuiaTallas ? 'Ocultar guía' : 'Guía de Tallas'}</span>
                    </button>
                  </div>

                  {mostrarGuiaTallas && (
                    <div className="mb-3 p-3 bg-zinc-900 text-white text-[11px] font-mono leading-relaxed">
                      <p className="font-bold text-zinc-300 uppercase mb-1">Corte Boxy / Oversize Fit (cm):</p>
                      <div className="grid grid-cols-4 gap-2 text-center text-zinc-400">
                        <div><strong className="text-white">S:</strong> 56 ancho / 70 largo</div>
                        <div><strong className="text-white">M:</strong> 59 ancho / 72 largo</div>
                        <div><strong className="text-white">L:</strong> 62 ancho / 74 largo</div>
                        <div><strong className="text-white">XL:</strong> 65 ancho / 76 largo</div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {variantesColor.map((v) => {
                      const esSel = v.id === varianteActiva?.id;
                      const vStock = v.stocks.reduce((acc, s) => acc + s.cantidad, 0);
                      const sinStock = vStock <= 0;

                      return (
                        <button
                          key={v.id}
                          type="button"
                          disabled={sinStock}
                          onClick={() => setVarianteSelId(v.id)}
                          className={`min-w-10 px-3 py-2 text-xs font-bold uppercase transition-all ${
                            sinStock
                              ? 'bg-zinc-100 text-zinc-300 line-through cursor-not-allowed'
                              : esSel
                              ? 'bg-black text-white shadow-sm'
                              : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
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

            {/* Botón de Agregar a la Bolsa */}
            <div className="pt-4 border-t border-zinc-200">
              <Button
                size="lg"
                disabled={!varianteActiva || stockDisponible <= 0}
                onClick={handleAgregar}
                className={`w-full py-6 rounded-none text-xs font-bold tracking-[0.2em] uppercase transition-all ${
                  agregadoAnim
                    ? 'bg-emerald-600 text-white'
                    : stockDisponible <= 0
                    ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-zinc-800'
                }`}
              >
                {agregadoAnim ? (
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <span>¡AGREGADO A LA BOLSA!</span>
                  </span>
                ) : stockDisponible <= 0 ? (
                  <span>AGOTADO EN ESTA TALLA</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    <span>AÑADIR A LA BOLSA — {formatoCOP(precio)}</span>
                  </span>
                )}
              </Button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
