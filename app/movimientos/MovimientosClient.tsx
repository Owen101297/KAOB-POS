'use client';

import { useMemo, useState } from 'react';
import type { MovimientoLista } from '@/lib/actions/inventario';
import DataTable from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { TIPO_MOVIMIENTO_LABEL } from '@/lib/constants';
import { formatoFechaHora } from '@/lib/format';

interface FilaMovimiento {
  id: number;
  fecha: Date;
  tipo: string;
  sku: string;
  producto: string;
  colorTalla: string;
  cantidad: number;
  bodega: string;
  nota: string;
  [key: string]: unknown;
}

const ENTRADAS = new Set(['INICIAL', 'AJUSTE_ENTRADA', 'TRASLADO_ENTRADA', 'COMPRA', 'DEVOLUCION']);

export default function MovimientosClient({ movimientos }: { movimientos: MovimientoLista[] }) {
  const [filtroTipo, setFiltroTipo] = useState('todos');

  const filas = useMemo<FilaMovimiento[]>(
    () =>
      movimientos
        .filter((m) => (filtroTipo === 'todos' ? true : m.tipo === filtroTipo))
        .map((m) => ({
          id: m.id,
          fecha: m.createdAt,
          tipo: m.tipo,
          sku: m.variante.sku,
          producto: m.variante.producto.nombre,
          colorTalla: `${m.variante.color.nombre} · T.${m.variante.talla.valor}`,
          cantidad: m.cantidad,
          bodega:
            (ENTRADAS.has(m.tipo)
              ? m.bodegaDestino?.nombre
              : m.bodegaOrigen?.nombre) ?? '—',
          nota: m.nota ?? m.refDocumento ?? '',
        })),
    [movimientos, filtroTipo]
  );

  return (
    <DataTable
      columns={[
        {
          key: 'fecha',
          label: 'Fecha',
          render: (row: FilaMovimiento) => (
            <span className="whitespace-nowrap text-slate-500">{formatoFechaHora(new Date(row.fecha))}</span>
          ),
        },
        {
          key: 'tipo',
          label: 'Tipo',
          render: (row: FilaMovimiento) => {
            const entrada = ENTRADAS.has(row.tipo);
            const esTraslado = row.tipo.startsWith('TRASLADO');
            return (
              <Badge variant={esTraslado ? 'info' : entrada ? 'success' : 'danger'}>
                {TIPO_MOVIMIENTO_LABEL[row.tipo as keyof typeof TIPO_MOVIMIENTO_LABEL] ?? row.tipo}
              </Badge>
            );
          },
        },
        {
          key: 'sku',
          label: 'SKU',
          render: (row: FilaMovimiento) => (
            <span className="font-mono text-xs font-bold text-slate-800">{row.sku}</span>
          ),
        },
        { key: 'producto', label: 'Producto' },
        { key: 'colorTalla', label: 'Variante' },
        {
          key: 'cantidad',
          label: 'Cant.',
          align: 'right' as const,
          render: (row: FilaMovimiento) => (
            <span
              className={`font-bold ${ENTRADAS.has(row.tipo) && !row.tipo.startsWith('TRASLADO') ? 'text-emerald-600' : row.tipo.startsWith('TRASLADO') ? 'text-sky-600' : 'text-red-500'}`}
            >
              {ENTRADAS.has(row.tipo) ? '+' : '−'}
              {row.cantidad}
            </span>
          ),
        },
        { key: 'bodega', label: 'Bodega' },
        {
          key: 'nota',
          label: 'Detalle',
          render: (row: FilaMovimiento) =>
            row.nota ? <span className="text-xs text-slate-400">{row.nota}</span> : '—',
        },
      ]}
      data={filas}
      pageTitle="Movimientos de inventario"
      description="Bitácora inmutable de todas las entradas y salidas de stock."
      filters={
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {Object.entries(TIPO_MOVIMIENTO_LABEL).map(([valor, label]) => (
              <SelectItem key={valor} value={valor}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
      emptyTitle="Sin movimientos"
      emptyDescription="Los movimientos se registran al crear productos, ajustar stock o hacer traslados."
    />
  );
}
