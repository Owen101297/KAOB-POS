'use client';

import { useState, useMemo } from 'react';
import { ShoppingBag, Eye, Check } from 'lucide-react';
import type { ProductoTienda } from '@/lib/tienda/public-productos';
import { formatoCOP } from '@/lib/format';
import { CALIDAD_LABEL } from '@/lib/constants';

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
  producto: ProductoTienda;
  onAgregarABolsa: (item: ItemBolsa) => void;
  onVerDetalle: (producto: ProductoTienda) => void;
}

/**
 * Tarjeta de producto editorial (002b): papel hueso, isotipo sereno, nombre
 * en serif, tallas visibles sin entrar al detalle y botón de compra directo.
 * Conserva la lógica de variantes y textos que usa la suite E2E.
 */
export default function ProductCardTienda({
  producto,
  onAgregarABolsa,
  onVerDetalle,
}: Props) {
  const coloresDisponibles = useMemo(() => {
    const map = new Map<number, { id: number; nombre: string; hex: string | null }>();
    producto.variantes.forEach((v) => {
      if (!map.has(v.color.id)) map.set(v.color.id, v.color);
    });
    return Array.from(map.values());
  }, [producto]);

  const [colorSeleccionadoId, setColorSeleccionadoId] = useState<number>(
    coloresDisponibles[0]?.id ?? 0
  );

  const variantesDelColor = useMemo(() => {
    return producto.variantes.filter((v) => v.color.id === colorSeleccionadoId);
  }, [producto, colorSeleccionadoId]);

  const [varianteSeleccionadaId, setVarianteSeleccionadaId] = useState<number | null>(
    variantesDelColor[0]?.id ?? null
  );

  const varianteActiva = useMemo(() => {
    return (
      producto.variantes.find((v) => v.id === varianteSeleccionadaId) ??
      variantesDelColor[0] ??
      producto.variantes[0]
    );
  }, [producto, varianteSeleccionadaId, variantesDelColor]);

  const stockDisponible = useMemo(() => {
    if (!varianteActiva) return 0;
    return varianteActiva.stocks.reduce((acc, s) => acc + s.cantidad, 0);
  }, [varianteActiva]);

  const stockTotalProducto = useMemo(() => {
    return producto.variantes.reduce(
      (acc, v) => acc + v.stocks.reduce((sAcc, s) => sAcc + s.cantidad, 0),
      0
    );
  }, [producto]);

  const [agregadoAnim, setAgregadoAnim] = useState(false);

  const precioEfectivo = varianteActiva?.precioOverride ?? producto.precioBase;

  const handleAgregar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!varianteActiva || stockDisponible <= 0) return;

    onAgregarABolsa({
      varianteId: varianteActiva.id,
      productoId: producto.id,
      nombre: producto.nombre,
      referencia: producto.referencia,
      colorNombre: varianteActiva.color.nombre,
      colorHex: varianteActiva.color.hex,
      tallaValor: varianteActiva.talla.valor,
      precio: precioEfectivo,
      cantidad: 1,
      stockDisponible,
    });

    setAgregadoAnim(true);
    setTimeout(() => setAgregadoAnim(false), 1500);
  };

  const estaAgotado = stockTotalProducto <= 0;
  const stockVarianteAgotado = stockDisponible <= 0;

  return (
    <div
      onClick={() => onVerDetalle(producto)}
      className="group relative flex flex-col justify-between rounded-3xl bg-bone-50 border border-ink/10 overflow-hidden shadow-[0_1px_2px_rgba(28,23,18,0.04)] hover:shadow-[0_24px_48px_-24px_rgba(28,23,18,0.35)] hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      {/* Vitrina visual */}
      <div className="relative aspect-[4/5] w-full bg-bone-100 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.07] group-hover:opacity-[0.12] group-hover:scale-110 transition-all duration-500">
          <img src="/brand/isotype.svg" alt="" className="w-3/5 h-3/5 object-contain" />
        </div>

        <div className="relative z-10 text-center">
          <div className="mx-auto w-24 h-24 rounded-full bg-bone-50 shadow-[0_1px_10px_rgba(28,23,18,0.08)] border border-ink/10 flex items-center justify-center group-hover:rotate-3 group-hover:scale-105 transition-transform duration-300">
            <span className="font-display font-bold text-3xl text-ink">
              {producto.nombre.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <span className="mt-3 block font-mono text-[10px] font-bold tracking-[0.28em] text-ink-400 uppercase">
            {producto.referencia}
          </span>
        </div>

        {/* Sellos */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
          {estaAgotado ? (
            <span className="px-2.5 py-1 rounded-full bg-ink text-bone-200 text-[10px] font-bold uppercase tracking-[0.14em]">
              Agotado
            </span>
          ) : stockDisponible <= 3 ? (
            <span className="px-2.5 py-1 rounded-full bg-bronze text-ink-900 text-[10px] font-black uppercase tracking-[0.14em] shadow-sm">
              Últimas {stockDisponible}
            </span>
          ) : null}

          {producto.calidad && (
            <span className="px-2.5 py-1 rounded-full border border-ink/15 bg-bone-50/90 text-ink-500 text-[10px] font-bold uppercase tracking-[0.14em] backdrop-blur">
              {CALIDAD_LABEL[producto.calidad as keyof typeof CALIDAD_LABEL] ?? producto.calidad}
            </span>
          )}
        </div>

        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onVerDetalle(producto);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/85 text-bone-50 hover:bg-ink transition-colors shadow-lg"
            title="Vista rápida"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Información */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between bg-bone-50">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-ink-400">
            {producto.categoria?.nombre ?? 'Colección'}
          </p>

          <h3 className="mt-1 font-display text-lg tracking-tight text-ink line-clamp-1 group-hover:italic transition-all">
            {producto.nombre}
          </h3>

          {/* Colores */}
          {coloresDisponibles.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <span className="text-[10px] text-ink-400 font-medium mr-1">Color:</span>
              <div className="flex flex-wrap gap-1">
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
                      className={`relative h-4 w-4 rounded-full transition-all ${
                        esSel ? 'ring-2 ring-bronze ring-offset-2 ring-offset-bone-50 scale-110' : 'border border-ink/20 opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex ?? '#1C1712' }}
                      title={c.nombre}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Tallas visibles sin entrar al detalle */}
          {variantesDelColor.length > 0 && (
            <div className="mt-2.5 flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
              <span className="text-[10px] text-ink-400 font-medium mr-1">Talla:</span>
              {variantesDelColor.map((v) => {
                const esSel = v.id === varianteActiva?.id;
                const vStock = v.stocks.reduce((acc, s) => acc + s.cantidad, 0);
                const sinStock = vStock <= 0;

                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={sinStock}
                    onClick={() => setVarianteSeleccionadaId(v.id)}
                    className={`min-w-6 px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                      sinStock
                        ? 'bg-bone-100 text-ink-400/40 line-through cursor-not-allowed'
                        : esSel
                        ? 'bg-ink text-bone-50 shadow-sm'
                        : 'bg-bone-100 text-ink-600 hover:bg-bone-200'
                    }`}
                  >
                    {v.talla.valor}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-ink/10 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-ink-400 block -mb-0.5">Precio</span>
            <span className="text-base sm:text-lg font-bold text-ink">
              {formatoCOP(precioEfectivo)}
            </span>
          </div>

          <button
            type="button"
            disabled={estaAgotado || stockVarianteAgotado}
            onClick={handleAgregar}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
              agregadoAnim
                ? 'bg-bronze text-ink-900'
                : estaAgotado || stockVarianteAgotado
                ? 'bg-bone-100 text-ink-400/50 cursor-not-allowed'
                : 'bg-ink text-bone-50 hover:bg-ink-700'
            }`}
          >
            {agregadoAnim ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>¡Listo!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>Añadir</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
