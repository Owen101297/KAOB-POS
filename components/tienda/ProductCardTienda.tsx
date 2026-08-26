'use client';

import { useState, useMemo } from 'react';
import { ShoppingBag, Eye, Check, AlertCircle, Flame } from 'lucide-react';
import type { ProductoLista } from '@/lib/actions/productos';
import { formatoCOP } from '@/lib/format';
import { CALIDAD_LABEL } from '@/lib/constants';
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
  producto: ProductoLista;
  onAgregarABolsa: (item: ItemBolsa) => void;
  onVerDetalle: (producto: ProductoLista) => void;
  vendidosRecientes?: number;
}

export default function ProductCardTienda({
  producto,
  onAgregarABolsa,
  onVerDetalle,
  vendidosRecientes = 0,
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

  // Stock total de la variante seleccionada en todas las bodegas
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
      className="group relative flex flex-col justify-between rounded-2xl bg-white border border-zinc-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      {/* Contenedor Superior de Imagen */}
      <div className="relative aspect-[4/5] w-full bg-gradient-to-b from-stone-100 to-stone-200 flex items-center justify-center overflow-hidden p-6">
        {imagenMostrada ? (
          <img
            src={`/api/media/${imagenMostrada.key}`}
            alt={imagenMostrada.alt ?? producto.nombre}
            className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <>
            {/* Isotipo de fondo de agua (placeholder mientras no hay foto real) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:scale-110 transition-transform duration-500">
              <img src="/brand/isotype.svg" alt="" className="w-3/5 h-3/5 object-contain" />
            </div>

            {/* Letra / Silueta central estilizada */}
            <div className="relative z-10 text-center">
              <div className="mx-auto w-24 h-24 rounded-full bg-white/80 shadow-md border border-zinc-200 flex items-center justify-center group-hover:rotate-6 transition-transform duration-300">
                <span className="font-extrabold text-2xl font-serif text-zinc-900 tracking-wider">
                  {producto.nombre.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <span className="mt-3 block font-mono text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
                {producto.referencia}
              </span>
            </div>
          </>
        )}

        {/* Badges superiores */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
          {estaAgotado ? (
            <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
              Agotado
            </span>
          ) : stockDisponible <= 3 ? (
            <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
              Últimas {stockDisponible} unds
            </span>
          ) : null}

          {producto.calidad && (
            <span className="px-2.5 py-1 rounded-full bg-zinc-900/90 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur shadow-sm">
              {CALIDAD_LABEL[producto.calidad as keyof typeof CALIDAD_LABEL] ?? producto.calidad}
            </span>
          )}

          {vendidosRecientes >= 3 && (
            <span className="px-2.5 py-1 rounded-full bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
              <Flame className="h-3 w-3" /> {vendidosRecientes} vendidos este mes
            </span>
          )}
        </div>

        {/* Botón flotante vista rápida */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onVerDetalle(producto);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/80 text-white hover:bg-black transition-colors shadow-lg"
            title="Vista rápida"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Información del Producto */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between bg-white">
        <div>
          {/* Categoría */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            {producto.categoria?.nombre ?? 'General'}
          </p>

          {/* Nombre */}
          <h3 className="mt-1 text-sm sm:text-base font-bold text-zinc-900 line-clamp-1 group-hover:text-black">
            {producto.nombre}
          </h3>

          {/* Selector de Colores (Swatches) */}
          {coloresDisponibles.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <span className="text-[10px] text-zinc-400 font-medium mr-1">Color:</span>
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
                      className={`relative h-4 w-4 rounded-full border transition-all ${
                        esSel ? 'ring-2 ring-black scale-110' : 'border-zinc-300 opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex ?? '#000000' }}
                      title={c.nombre}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Selector de Tallas */}
          {variantesDelColor.length > 0 && (
            <div className="mt-2.5 flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
              <span className="text-[10px] text-zinc-400 font-medium mr-1">Talla:</span>
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
                    className={`min-w-6 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                      sinStock
                        ? 'bg-zinc-100 text-zinc-300 line-through cursor-not-allowed'
                        : esSel
                        ? 'bg-black text-white shadow-sm'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    {v.talla.valor}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Precio y Botón de Acción */}
        <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-zinc-400 block -mb-0.5">Precio</span>
            <span className="text-base sm:text-lg font-black text-zinc-900">
              {formatoCOP(precioEfectivo)}
            </span>
            <FinanciacionCalculadora precio={precioEfectivo} variante="compacta" />
          </div>

          <button
            type="button"
            disabled={estaAgotado || stockVarianteAgotado}
            onClick={handleAgregar}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm ${
              agregadoAnim
                ? 'bg-emerald-600 text-white'
                : estaAgotado || stockVarianteAgotado
                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                : 'bg-black text-white hover:bg-zinc-800'
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
