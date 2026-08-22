'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightLeft, Plus, Search, X } from 'lucide-react';
import type { TrasladoDetalle, StockFila } from '@/lib/actions/inventario';
import type { Bodega } from '@prisma/client';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useBodega } from '@/components/providers/BodegaProvider';
import { formatoTraslado } from '@/lib/constants';
import { formatoFechaHora } from '@/lib/format';
import { crearTraslado } from '@/lib/actions/inventario';

interface ItemLinea {
  varianteId: number;
  sku: string;
  descripcion: string;
  disponible: number;
  cantidad: number;
}

interface FilaTraslado {
  id: number;
  codigo: string;
  fecha: Date;
  origen: string;
  destino: string;
  items: number;
  unidades: number;
  nota: string;
  [key: string]: unknown;
}

export default function TrasladosClient({
  traslados,
  stock,
  bodegas,
}: {
  traslados: TrasladoDetalle[];
  stock: StockFila[];
  bodegas: Bodega[];
}) {
  const router = useRouter();
  const { bodegaActiva } = useBodega();
  const [pending, startTransition] = useTransition();
  const [abierto, setAbierto] = useState(false);

  const refrescar = () => startTransition(() => router.refresh());

  const filas = useMemo<FilaTraslado[]>(
    () =>
      traslados.map((t) => ({
        id: t.id,
        codigo: formatoTraslado(t.id),
        fecha: t.createdAt,
        origen: t.bodegaOrigen.nombre,
        destino: t.bodegaDestino.nombre,
        items: t.detalles.length,
        unidades: t.detalles.reduce((a, d) => a + d.cantidad, 0),
        nota: t.nota ?? '',
      })),
    [traslados]
  );

  return (
    <div>
      <DataTable
        columns={[
          {
            key: 'codigo',
            label: '#',
            render: (row: FilaTraslado) => (
              <span className="font-mono text-xs font-bold text-slate-800">{row.codigo}</span>
            ),
          },
          {
            key: 'fecha',
            label: 'Fecha',
            render: (row: FilaTraslado) => (
              <span className="text-slate-500">{formatoFechaHora(new Date(row.fecha))}</span>
            ),
          },
          {
            key: 'origen',
            label: 'Origen → Destino',
            render: (row: FilaTraslado) => (
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-slate-700">
                {row.origen}
                <ArrowRightLeft className="h-3.5 w-3.5 text-brand-500" />
                {row.destino}
              </span>
            ),
          },
          { key: 'items', label: 'Artículos', align: 'center' as const },
          { key: 'unidades', label: 'Unidades', align: 'right' as const },
          {
            key: 'nota',
            label: 'Nota',
            render: (row: FilaTraslado) =>
              row.nota ? <span className="text-xs text-slate-400">{row.nota}</span> : '—',
          },
        ]}
        data={filas}
        pageTitle="Traslados entre bodegas"
        description="Mueve inventario entre ubicaciones; cada traslado genera movimientos trazables."
        actions={
          <Button onClick={() => setAbierto(true)}>
            <Plus className="h-4 w-4" /> Nuevo traslado
          </Button>
        }
        emptyTitle="Sin traslados"
        emptyDescription="Registra tu primer traslado para mover stock entre bodegas."
      />

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Nuevo traslado</DialogTitle>
            <DialogDescription>El stock se descuenta del origen y suma al destino en un solo paso.</DialogDescription>
          </DialogHeader>
          <FormTraslado
            stock={stock}
            bodegas={bodegas}
            bodegaInicialId={bodegaActiva?.id ?? bodegas[0]?.id}
            disabled={pending}
            onListo={() => {
              setAbierto(false);
              refrescar();
            }}
            onCancelar={() => setAbierto(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ───────────────────────── formulario ──────────────────────────

function FormTraslado({
  stock,
  bodegas,
  bodegaInicialId,
  disabled,
  onListo,
  onCancelar,
}: {
  stock: StockFila[];
  bodegas: Bodega[];
  bodegaInicialId?: number;
  disabled: boolean;
  onListo: () => void;
  onCancelar: () => void;
}) {
  const [origenId, setOrigenId] = useState(bodegaInicialId ? String(bodegaInicialId) : '');
  const [destinoId, setDestinoId] = useState('');
  const [nota, setNota] = useState('');
  const [items, setItems] = useState<ItemLinea[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState<string | null>(null);

  const origenIdNum = Number(origenId);
  const disponibles = useMemo(() => {
    if (!origenIdNum) return [];
    const q = busqueda.trim().toLowerCase();
    return stock
      .filter((f) => f.bodegaId === origenIdNum && f.cantidad > 0)
      .map((f) => ({
        varianteId: f.varianteId,
        sku: f.variante.sku,
        nombre: f.variante.producto.nombre,
        color: f.variante.color.nombre,
        talla: f.variante.talla.valor,
        disponible: f.cantidad,
      }))
      .filter((v) =>
        !q
          ? true
          : `${v.sku} ${v.nombre} ${v.color} ${v.talla}`.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [stock, origenIdNum, busqueda]);

  function agregar(v: (typeof disponibles)[number]) {
    setError(null);
    setItems((prev) => {
      if (prev.some((i) => i.varianteId === v.varianteId)) return prev;
      return [
        ...prev,
        { varianteId: v.varianteId, sku: v.sku, descripcion: `${v.nombre} · ${v.color} · T.${v.talla}`, disponible: v.disponible, cantidad: 1 },
      ];
    });
    setBusqueda('');
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await crearTraslado({
      bodegaOrigenId: origenIdNum,
      bodegaDestinoId: Number(destinoId),
      nota,
      items: items.map((i) => ({ varianteId: i.varianteId, cantidad: i.cantidad })),
    });
    if (!res.ok) return setError(res.error);
    onListo();
  }

  return (
    <form onSubmit={enviar} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Bodega origen *</span>
          <Select value={origenId || undefined} onValueChange={(v) => { setOrigenId(v); setItems([]); }} required>
            <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
            <SelectContent>
              {bodegas.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>{b.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Bodega destino *</span>
          <Select value={destinoId || undefined} onValueChange={setDestinoId} required>
            <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
            <SelectContent>
              {bodegas
                .filter((b) => String(b.id) !== origenId)
                .map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>{b.nombre}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </label>
      </div>

      {/* buscador de artículos */}
      <div>
        <span className="mb-1 block text-xs font-semibold text-slate-600">Artículos *</span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={origenIdNum ? 'Buscar por SKU, producto, color o talla…' : 'Primero elige la bodega origen'}
            className="pl-9"
            disabled={!origenIdNum}
          />
        </div>
        {!origenIdNum && <p className="mt-1 text-[11px] text-slate-400">Selecciona una bodega de origen para buscar.</p>}
        {origenIdNum && busqueda && (
          <div className="z-10 mt-1 max-h-44 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {disponibles.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400">Sin resultados con stock disponible.</p>
            ) : (
              disponibles.map((v) => (
                <button
                  key={v.varianteId}
                  type="button"
                  onClick={() => agregar(v)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-brand-50/50"
                >
                  <span>
                    <span className="block font-mono text-[11px] font-bold text-slate-700">{v.sku}</span>
                    <span className="block text-xs text-slate-500">{v.nombre} · {v.color} · T.{v.talla}</span>
                  </span>
                  <span className="text-xs font-bold text-emerald-600">{v.disponible} disp.</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* líneas */}
      {items.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          {items.map((i, idx) => (
            <div key={i.varianteId} className={`flex items-center gap-2 px-3 py-2 ${idx > 0 ? 'border-t border-slate-100' : ''}`}>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] font-bold text-slate-700">{i.sku}</p>
                <p className="truncate text-xs text-slate-500">{i.descripcion}</p>
              </div>
              <input
                type="number"
                min={1}
                max={i.disponible}
                value={i.cantidad}
                onChange={(e) =>
                  setItems(items.map((it, n) =>
                    n === idx
                      ? { ...it, cantidad: Math.max(1, Math.min(it.disponible, Number(e.target.value) || 1)) }
                      : it
                  ))
                }
                className="w-16 rounded-md border border-slate-200 px-2 py-1 text-center text-xs outline-none focus:border-brand-400"
              />
              <Button size="icon" variant="ghost" aria-label={`Quitar ${i.sku}`} onClick={() => setItems(items.filter((_, n) => n !== idx))}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <label className="grid gap-1">
        <span className="text-xs font-semibold text-slate-600">Nota</span>
        <textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          rows={2}
          maxLength={300}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          placeholder="Motivo del traslado (opcional)"
        />
      </label>

      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancelar}>Cancelar</Button>
        <Button type="submit" disabled={disabled || items.length === 0 || !origenId || !destinoId}>
          Registrar traslado ({items.length})
        </Button>
      </DialogFooter>
    </form>
  );
}
