'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, DollarSign } from 'lucide-react';
import type { ProductoLista } from '@/lib/actions/productos';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { formatoCOP } from '@/lib/format';
import { actualizarPrecios } from '@/lib/actions/productos';

interface FilaPrecio {
  id: number;
  referencia: string;
  producto: string;
  categoria: string;
  marca: string;
  costo: number;
  precio: number;
  [key: string]: unknown;
}

export default function ListaPreciosClient({ productos }: { productos: ProductoLista[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const filas = useMemo<FilaPrecio[]>(
    () =>
      productos.map((p) => ({
        id: p.id,
        referencia: p.referencia,
        producto: p.nombre,
        categoria: p.categoria?.nombre ?? '—',
        marca: p.marca?.nombre ?? '—',
        costo: p.costo,
        precio: p.precioBase,
      })),
    [productos]
  );

  const columnas = [
    {
      key: 'referencia',
      label: 'Referencia',
      render: (row: FilaPrecio) => (
        <span className="font-mono text-xs font-bold text-slate-800">{row.referencia}</span>
      ),
    },
    {
      key: 'producto',
      label: 'Producto',
      render: (row: FilaPrecio) => (
        <div>
          <p className="font-medium text-slate-800">{row.producto}</p>
          <p className="text-[11px] text-slate-400">{row.categoria} · {row.marca}</p>
        </div>
      ),
    },
    {
      key: 'costo',
      label: 'Costo',
      width: '150px',
      align: 'right' as const,
      render: (row: FilaPrecio) => (
        <InlinePrecio
          fila={row}
          campo="costo"
          inicial={row.costo}
          disabled={pending}
          onGuardado={() => startTransition(() => router.refresh())}
        />
      ),
    },
    {
      key: 'precio',
      label: 'Precio venta',
      width: '150px',
      align: 'right' as const,
      render: (row: FilaPrecio) => (
        <InlinePrecio
          fila={row}
          campo="precio"
          inicial={row.precio}
          disabled={pending}
          onGuardado={() => startTransition(() => router.refresh())}
        />
      ),
    },
    {
      key: 'margen',
      label: 'Margen',
      align: 'right' as const,
      render: (row: FilaPrecio) => {
        if (!row.precio || row.precio <= row.costo) {
          return <span className="text-xs font-semibold text-red-500">Sin margen</span>;
        }
        const margen = Math.round(((row.precio - row.costo) / row.precio) * 100);
        return (
          <span className={margen < 20 ? 'text-xs font-bold text-amber-500' : 'text-xs font-bold text-emerald-600'}>
            {margen}%
          </span>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columnas}
      data={filas}
      pageTitle="Libro de precios"
      description="Edita costo y precio de venta directamente en la tabla."
      actions={
        <span className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-[12px] font-semibold text-brand-700">
          <DollarSign className="h-4 w-4" /> {filas.length} producto(s)
        </span>
      }
      emptyTitle="Sin productos"
      emptyDescription="Crea productos para administrar sus precios."
    />
  );
}

function InlinePrecio({
  fila,
  campo,
  inicial,
  disabled,
  onGuardado,
}: {
  fila: FilaPrecio;
  campo: 'costo' | 'precio';
  inicial: number;
  disabled: boolean;
  onGuardado: () => void;
}) {
  const [texto, setTexto] = useState(String(inicial));
  const sucio = Number(texto) !== inicial && texto !== '';

  return (
    <span className="inline-flex items-center justify-end gap-1">
      <input
        type="number"
        min={0}
        value={texto}
        title={formatoCOP(Number(texto) || 0)}
        onChange={(e) => setTexto(e.target.value)}
        className={`w-24 rounded-md border px-2 py-1 text-right text-xs outline-none focus:border-brand-400 ${
          sucio ? 'border-brand-400 bg-brand-50/50' : 'border-transparent bg-transparent hover:border-slate-200'
        }`}
      />
      {sucio && (
        <Button
          size="icon"
          variant="ghost"
          aria-label="Guardar precio"
          disabled={disabled}
          onClick={async () => {
            await actualizarPrecios({
              id: fila.id,
              costo: campo === 'costo' ? Number(texto) : fila.costo,
              precioBase: campo === 'precio' ? Number(texto) : fila.precio,
            });
            onGuardado();
          }}
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
      )}
    </span>
  );
}
