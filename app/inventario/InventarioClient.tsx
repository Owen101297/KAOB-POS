'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Download, PackageCheck, Pencil, Plus, Minus, SlidersHorizontal, TrendingDown } from 'lucide-react';
import type { StockFila } from '@/lib/actions/inventario';
import type { Bodega } from '@prisma/client';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
import { StatCard } from '@/components/ui/StatCard';
import { useBodega } from '@/components/providers/BodegaProvider';
import { formatoCOP } from '@/lib/format';
import BotonImportarExcel from './BotonImportarExcel';
import { ajustarStock, actualizarMinimo } from '@/lib/actions/inventario';

interface FilaStock {
  varianteId: number;
  bodegaId: number;
  sku: string;
  producto: string;
  referencia: string;
  color: string;
  talla: string;
  cantidad: number;
  minimo: number;
  estado: 'agotado' | 'bajo' | 'ok';
  costo: number;
  [key: string]: unknown;
}

export default function InventarioClient({
  stock,
  bodegas,
}: {
  stock: StockFila[];
  bodegas: Bodega[];
}) {
  const router = useRouter();
  const { bodegaActiva } = useBodega();
  const [pending, startTransition] = useTransition();
  const [bodegaFiltro, setBodegaFiltro] = useState('activa');
  const [soloAlertas, setSoloAlertas] = useState(false);
  const [ajustando, setAjustando] = useState<StockFila | null>(null);

  const refrescar = () => startTransition(() => router.refresh());
  const bodegaIdEfectiva =
    bodegaFiltro === 'activa' ? bodegaActiva?.id : bodegaFiltro === 'todas' ? null : Number(bodegaFiltro);

  const filas = useMemo<FilaStock[]>(() => {
    let rows = stock;
    if (bodegaIdEfectiva) rows = rows.filter((f) => f.bodegaId === bodegaIdEfectiva);
    if (soloAlertas) rows = rows.filter((f) => f.cantidad === 0 || (f.minimo > 0 && f.cantidad <= f.minimo));
    return rows.map((f) => ({
      varianteId: f.varianteId,
      bodegaId: f.bodegaId,
      sku: f.variante.sku,
      producto: f.variante.producto.nombre,
      referencia: f.variante.producto.referencia,
      color: f.variante.color.nombre,
      talla: f.variante.talla.valor,
      cantidad: f.cantidad,
      minimo: f.minimo,
      estado: f.cantidad === 0 ? 'agotado' : f.minimo > 0 && f.cantidad <= f.minimo ? 'bajo' : 'ok',
      costo: f.variante.producto.costo,
    }));
  }, [stock, bodegaIdEfectiva, soloAlertas]);

  const stats = useMemo(() => {
    const unidades = filas.reduce((a, f) => a + f.cantidad, 0);
    const valor = filas.reduce((a, f) => a + f.cantidad * f.costo, 0);
    const alertas = filas.filter((f) => f.estado !== 'ok').length;
    return { unidades, valor, alertas };
  }, [filas]);

  const columnas = [
    {
      key: 'sku',
      label: 'SKU',
      render: (row: FilaStock) => <span className="font-mono text-xs font-bold text-slate-800">{row.sku}</span>,
    },
    {
      key: 'producto',
      label: 'Producto',
      render: (row: FilaStock) => (
        <div>
          <p className="font-medium text-slate-800">{row.producto}</p>
          <p className="font-mono text-[11px] text-slate-400">{row.referencia}</p>
        </div>
      ),
    },
    { key: 'color', label: 'Color' },
    { key: 'talla', label: 'Talla', align: 'center' as const },
    ...(bodegaIdEfectiva
      ? []
      : [
          {
            key: 'bodega',
            label: 'Bodega',
            render: (row: FilaStock) =>
              bodegas.find((b) => b.id === row.bodegaId)?.nombre ?? String(row.bodegaId),
          },
        ]),
    {
      key: 'cantidad',
      label: 'Cantidad',
      align: 'right' as const,
      render: (row: FilaStock) => {
        const original = stock.find(
          (f) => f.varianteId === row.varianteId && f.bodegaId === row.bodegaId
        );
        return (
          <button
            type="button"
            onClick={() => original && setAjustando(original)}
            className="group inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-transparent hover:border-slate-300 hover:bg-slate-50 transition-colors"
            title="Clic para editar el stock"
          >
            <span
              className={
                row.cantidad === 0
                  ? 'font-extrabold text-red-500 text-sm'
                  : 'font-extrabold text-slate-900 text-sm'
              }
            >
              {row.cantidad}
            </span>
            <Pencil className="h-3 w-3 text-slate-400 group-hover:text-brand-600 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        );
      },
    },
    {
      key: 'minimo',
      label: 'Mínimo',
      align: 'right' as const,
      render: (row: FilaStock) => (
        <InlineMinimo fila={row} disabled={pending} onGuardado={refrescar} />
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      align: 'center' as const,
      render: (row: FilaStock) =>
        row.estado === 'agotado' ? (
          <Badge variant="danger">Agotado</Badge>
        ) : row.estado === 'bajo' ? (
          <Badge variant="warning">Bajo</Badge>
        ) : (
          <Badge variant="success">OK</Badge>
        ),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      width: '100px',
      align: 'center' as const,
      render: (row: FilaStock) => {
        const original = stock.find(
          (f) => f.varianteId === row.varianteId && f.bodegaId === row.bodegaId
        );
        if (!original) return null;
        return (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs font-semibold text-slate-700 hover:text-brand-700 hover:border-brand-300 hover:bg-brand-50"
            onClick={() => setAjustando(original)}
            title="Editar existencias de esta prenda"
          >
            <Pencil className="h-3.5 w-3.5 text-brand-600" />
            Editar
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Unidades" value={String(stats.unidades)} icon={<PackageCheck className="h-4 w-4" />} />
        <StatCard label="Valor a costo" value={formatoCOP(stats.valor)} icon={<TrendingDown className="h-4 w-4" />} color="sky" />
        <StatCard
          label="Alertas de stock"
          value={String(stats.alertas)}
          icon={<AlertTriangle className="h-4 w-4" />}
          color={stats.alertas > 0 ? 'red' : 'brand'}
        />
      </div>

      <DataTable
        columns={columnas}
        data={filas}
        pageTitle="Inventario"
        description="Existencias por variante y bodega. Ajusta cantidades con motivo obligatorio."
        actions={
          <>
            <a
              href="/api/excel/exportar"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <Download className="h-4 w-4" /> Exportar
            </a>
            <BotonImportarExcel />
          </>
        }
        filters={
          <>
            <Select value={bodegaFiltro} onValueChange={setBodegaFiltro}>
              <SelectTrigger className="h-9 w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="activa">Bodega activa{bodegaActiva ? ` · ${bodegaActiva.nombre}` : ''}</SelectItem>
                <SelectItem value="todas">Todas las bodegas</SelectItem>
                {bodegas.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>{b.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant={soloAlertas ? 'primary' : 'outline'}
              onClick={() => setSoloAlertas(!soloAlertas)}
            >
              <AlertTriangle className="h-4 w-4" /> Solo alertas
            </Button>
          </>
        }
        emptyTitle="Sin filas de inventario"
        emptyDescription="Cuando crees productos con variantes verás su stock aquí."
      />

      <Dialog open={!!ajustando} onOpenChange={(v) => !v && setAjustando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar stock</DialogTitle>
            <DialogDescription>
              {ajustando && `${ajustando.variante.sku} · ${ajustando.bodega.nombre}`}
            </DialogDescription>
          </DialogHeader>
          {ajustando && (
            <DialogAjuste
              fila={ajustando}
              disabled={pending}
              onListo={() => {
                setAjustando(null);
                refrescar();
              }}
              onCancelar={() => setAjustando(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────── mínimo inline ─────────────────────────

function InlineMinimo({
  fila,
  disabled,
  onGuardado,
}: {
  fila: FilaStock;
  disabled: boolean;
  onGuardado: () => void;
}) {
  const [valor, setValor] = useState(String(fila.minimo));
  const sucio = Number(valor) !== fila.minimo;

  return (
    <span className="inline-flex items-center justify-end gap-1">
      <input
        type="number"
        min={0}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className="w-14 rounded-md border border-slate-200 px-2 py-1 text-right text-xs outline-none focus:border-brand-400"
      />
      {sucio && (
        <Button
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={async () => {
            await actualizarMinimo({
              varianteId: fila.varianteId,
              bodegaId: fila.bodegaId,
              minimo: Number(valor) || 0,
            });
            onGuardado();
          }}
        >
          ✓
        </Button>
      )}
    </span>
  );
}

// ───────────────────────── dialog ajuste ───────────────────────

const MOTIVOS_PREDEFINIDOS = [
  'Conteo físico / Auditoría',
  'Ingreso manual de prendas',
  'Devolución de cliente',
  'Prenda dañada / Merma',
  'Ajuste por descuadre',
];

function DialogAjuste({
  fila,
  disabled,
  onListo,
  onCancelar,
}: {
  fila: StockFila;
  disabled: boolean;
  onListo: () => void;
  onCancelar: () => void;
}) {
  const [nuevaCantidad, setNuevaCantidad] = useState(String(fila.cantidad));
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cantNum = Math.max(0, Number(nuevaCantidad) || 0);
    const res = await ajustarStock({
      varianteId: fila.varianteId,
      bodegaId: fila.bodegaId,
      nuevaCantidad: cantNum,
      motivo: motivo.trim(),
    });
    if (!res.ok) return setError(res.error);
    onListo();
  }

  const delta = (Number(nuevaCantidad) || 0) - fila.cantidad;

  const aplicarDelta = (diff: number) => {
    const actual = Number(nuevaCantidad) || 0;
    const nuevo = Math.max(0, actual + diff);
    setNuevaCantidad(String(nuevo));
  };

  return (
    <form onSubmit={enviar} className="grid gap-3.5">
      <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-[13px] space-y-1">
        <p className="font-bold text-slate-800 text-sm">{fila.variante.producto.nombre}</p>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">{fila.variante.sku}</span>
          <span>Color: <strong>{fila.variante.color.nombre}</strong></span>
          <span>Talla: <strong>{fila.variante.talla.valor}</strong></span>
          <span>Bodega: <strong>{fila.bodega.nombre}</strong></span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Nueva cantidad en inventario *</span>
          <span className="text-xs text-slate-500">
            Actual: <strong className="text-slate-800">{fila.cantidad}</strong>
            {delta !== 0 && (
              <span className={delta > 0 ? 'ml-2 font-bold text-emerald-600' : 'ml-2 font-bold text-red-500'}>
                ({delta > 0 ? `+${delta}` : delta})
              </span>
            )}
          </span>
        </div>

        <Input
          type="number"
          min={0}
          value={nuevaCantidad}
          onChange={(e) => setNuevaCantidad(e.target.value)}
          required
          autoFocus
          className="text-base font-bold"
        />

        {/* BOTONES DE AJUSTE RÁPIDO */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => aplicarDelta(-10)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            -10
          </button>
          <button
            type="button"
            onClick={() => aplicarDelta(-5)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            -5
          </button>
          <button
            type="button"
            onClick={() => aplicarDelta(-1)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            -1
          </button>
          <button
            type="button"
            onClick={() => aplicarDelta(1)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            +1
          </button>
          <button
            type="button"
            onClick={() => aplicarDelta(5)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            +5
          </button>
          <button
            type="button"
            onClick={() => aplicarDelta(10)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            +10
          </button>
          <button
            type="button"
            onClick={() => setNuevaCantidad('0')}
            className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
          >
            Poner en 0
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-700">
          Motivo del ajuste *
        </label>
        <Input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          required
          minLength={3}
          maxLength={300}
          placeholder="Ingresa el motivo del ajuste o selecciona una opción rápida…"
        />

        {/* MOTIVOS PREDEFINIDOS */}
        <div className="flex flex-wrap gap-1 pt-1">
          {MOTIVOS_PREDEFINIDOS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMotivo(m)}
              className="text-[11px] rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}

      <DialogFooter className="gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={disabled || motivo.trim().length < 3}>
          Guardar cambios en inventario
        </Button>
      </DialogFooter>
    </form>
  );
}
