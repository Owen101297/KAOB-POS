'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Search,
} from 'lucide-react';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { Input } from './Input';
import { PageHeader } from './PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pageTitle?: string;
  description?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
}

type SortDir = 'asc' | 'desc';

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  pageTitle,
  description,
  actions,
  filters,
  emptyTitle = 'No hay registros',
  emptyDescription = 'Aún no se ha creado ningún registro en este módulo.',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const filtered = useMemo(() => {
    let rows = data;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        Object.values(row).some((v) => String(v).toLowerCase().includes(q))
      );
    }
    if (sortKey) {
      rows = [...rows].sort((a, b) => {
        const va = a[sortKey as keyof T];
        const vb = b[sortKey as keyof T];
        const numA = Number(va);
        const numB = Number(vb);
        let cmp: number;
        if (!Number.isNaN(numA) && !Number.isNaN(numB) && va !== '' && vb !== '') {
          cmp = numA - numB;
        } else {
          cmp = String(va ?? '').localeCompare(String(vb ?? ''), 'es', { sensitivity: 'base' });
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }, [data, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Ventana de paginación (máx. 5 páginas visibles centradas en la actual)
  const pageWindow = useMemo(() => {
    const max = 5;
    let start = Math.max(1, safePage - Math.floor(max / 2));
    const end = Math.min(totalPages, start + max - 1);
    start = Math.max(1, end - max + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [safePage, totalPages]);

  const from = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, filtered.length);

  return (
    <div>
      {(pageTitle || actions || description) && (
        <PageHeader title={pageTitle ?? ''} description={description} actions={actions} />
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-card">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-56 pl-9"
              />
            </div>
            {filters}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-slate-400 sm:block">Filas</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {columns.map((col) => {
                  const key = String(col.key);
                  const isSorted = sortKey === key;
                  return (
                    <th
                      key={key}
                      style={col.width ? { width: col.width } : undefined}
                      className={cn(
                        'select-none whitespace-nowrap border-b border-slate-200 bg-slate-50/80 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500',
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        className="inline-flex items-center gap-1 outline-none transition-colors hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-brand-500/40"
                      >
                        {col.label}
                        {isSorted ? (
                          sortDir === 'asc' ? (
                            <ArrowUp className="h-3 w-3 text-brand-600" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-brand-600" />
                          )
                        ) : (
                          <span className="w-3" />
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>
                    <EmptyState
                      icon={Inbox}
                      title={emptyTitle}
                      description={emptyDescription}
                      action={
                        actions ? (
                          <Button size="sm" variant="outline" onClick={() => setSearch('')}>
                            Limpiar búsqueda
                          </Button>
                        ) : undefined
                      }
                      className={search ? 'py-10' : undefined}
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((row, i) => (
                  <tr
                    key={i}
                    className="transition-colors duration-100 hover:bg-brand-50/40"
                  >
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        className={cn(
                          'border-b border-slate-100 px-4 py-2.5 align-middle text-slate-600',
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                              ? 'text-center'
                              : 'text-left'
                        )}
                      >
                        {col.render
                          ? col.render(row)
                          : String(row[col.key as keyof T] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-xs text-slate-400">
            Mostrando <span className="font-semibold text-slate-600">{from}</span> a{' '}
            <span className="font-semibold text-slate-600">{to}</span> de{' '}
            <span className="font-semibold text-slate-600">{filtered.length}</span> registros
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Página anterior"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {pageWindow.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={cn(
                  'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
                  p === safePage
                    ? 'bg-brand-500 text-white shadow-sm hover:bg-brand-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                {p}
              </button>
            ))}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Página siguiente"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
