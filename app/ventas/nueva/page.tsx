'use client';

import { useMemo, useState } from 'react';
import {
  Banknote,
  CreditCard,
  Minus,
  Package,
  Plus,
  ScanBarcode,
  Search,
  ShoppingBasket,
  Trash2,
  UserRound,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { cn } from '@/lib/utils';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
}

interface CartLine extends Product {
  qty: number;
}

const CATEGORIES = ['Todos', 'Abarrotes', 'Bebidas', 'Aseo', 'Snacks'];

const PRODUCTS: Product[] = [
  { id: 1, name: 'Arroz Diana 500g', price: 2600, stock: 42, category: 'Abarrotes' },
  { id: 2, name: 'Aceite Girasol 1L', price: 8900, stock: 18, category: 'Abarrotes' },
  { id: 3, name: 'Azúcar Blanca 1kg', price: 4300, stock: 25, category: 'Abarrotes' },
  { id: 4, name: 'Coca-Cola 600ml', price: 2800, stock: 60, category: 'Bebidas' },
  { id: 5, name: 'Agua Cristal 600ml', price: 1700, stock: 80, category: 'Bebidas' },
  { id: 6, name: 'Jugo Hit Naranja 1L', price: 3500, stock: 12, category: 'Bebidas' },
  { id: 7, name: 'Jabón Rey x3', price: 5900, stock: 30, category: 'Aseo' },
  { id: 8, name: 'Detergente Fab 1kg', price: 7400, stock: 0, category: 'Aseo' },
  { id: 9, name: 'Papas Margarita 105g', price: 2900, stock: 55, category: 'Snacks' },
  { id: 10, name: 'Chocolatina Jet', price: 1400, stock: 100, category: 'Snacks' },
];

const fmt = (n: number) =>
  n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const CARD_TONES = [
  'from-brand-50 to-brand-100 text-brand-600',
  'from-sky-50 to-sky-100 text-sky-600',
  'from-amber-50 to-amber-100 text-amber-600',
  'from-violet-50 to-violet-100 text-violet-600',
];

type PayMethod = 'efectivo' | 'transferencia' | 'credito';

export default function NuevaVentaPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [payMethod, setPayMethod] = useState<PayMethod>('efectivo');

  const visible = useMemo(() => {
    return PRODUCTS.filter(
      (p) =>
        (category === 'Todos' || p.category === category) &&
        p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, category]);

  const addToCart = (p: Product) => {
    if (p.stock === 0) return;
    setCart((prev) => {
      const found = prev.find((l) => l.id === p.id);
      if (found) {
        return prev.map((l) => (l.id === p.id ? { ...l, qty: Math.min(l.qty + 1, p.stock) } : l));
      }
      return [...prev, { ...p, qty: 1 }];
    });
  };

  const changeQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, qty: Math.max(0, Math.min(l.qty + delta, l.stock)) } : l))
        .filter((l) => l.qty > 0)
    );
  };

  const total = cart.reduce((acc, l) => acc + l.price * l.qty, 0);
  const itemCount = cart.reduce((acc, l) => acc + l.qty, 0);

  return (
    <div className="flex h-[calc(100vh-var(--topbar-height)-56px)] flex-col gap-5 xl:flex-row">
      {/* Panel de productos */}
      <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Nueva venta</h1>
          <Badge variant="success" className="px-2.5 py-1">
            <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
            Caja abierta · Turno actual
          </Badge>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar producto por nombre o referencia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 pl-10 pr-24 text-sm"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-400 sm:flex">
            <ScanBarcode className="h-3 w-3" /> F2
          </kbd>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-semibold outline-none transition-all focus-visible:ring-2 focus-visible:ring-brand-500/40',
                category === c
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-slate-700'
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
            {visible.map((p, i) => (
              <button
                key={p.id}
                type="button"
                disabled={p.stock === 0}
                onClick={() => addToCart(p)}
                className={cn(
                  'group flex flex-col items-start gap-2 rounded-xl border border-slate-200/70 bg-white p-3.5 text-left shadow-card outline-none transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:pointer-events-none disabled:opacity-45'
                )}
              >
                <span
                  className={cn(
                    'flex h-16 w-full items-center justify-center rounded-lg bg-gradient-to-br transition-transform group-hover:scale-[1.02]',
                    CARD_TONES[i % CARD_TONES.length]
                  )}
                >
                  <Package className="h-7 w-7" />
                </span>
                <span className="line-clamp-2 min-h-[32px] text-[12.5px] font-medium leading-snug text-slate-700">
                  {p.name}
                </span>
                <span className="flex w-full items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">{fmt(p.price)}</span>
                  {p.stock === 0 ? (
                    <Badge variant="danger">Agotado</Badge>
                  ) : (
                    <Badge variant={p.stock <= 15 ? 'warning' : 'neutral'}>{p.stock}</Badge>
                  )}
                </span>
              </button>
            ))}
            {visible.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-slate-200 py-14 text-center">
                <Package className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                <p className="text-sm font-medium text-slate-400">Sin resultados para “{search}”</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Carrito */}
      <aside className="flex max-h-full min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-card xl:w-[400px]">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <ShoppingBasket className="h-4.5 w-4.5 text-brand-600" />
            Carrito
            {itemCount > 0 && (
              <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setCart([])}>
              <Trash2 className="h-3.5 w-3.5" /> Limpiar
            </Button>
          )}
        </div>

        <div className="border-b border-slate-100 px-4 py-3">
          <Select defaultValue="consumidor">
            <SelectTrigger className="w-full">
              <UserRound className="h-4 w-4 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consumidor">Consumidor final</SelectItem>
              <SelectItem value="cliente1">Cliente ocasional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {cart.length === 0 ? (
            <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 ring-1 ring-inset ring-slate-200/70">
                <ShoppingBasket className="h-6 w-6 text-slate-400" />
              </span>
              <p className="text-sm font-semibold text-slate-600">El carrito está vacío</p>
              <p className="max-w-[220px] text-xs leading-relaxed text-slate-400">
                Selecciona productos del catálogo o escanea un código de barras.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {cart.map((l) => (
                <li key={l.id} className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-inset ring-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-semibold leading-snug text-slate-800">{l.name}</p>
                    <button
                      type="button"
                      aria-label={`Quitar ${l.name}`}
                      onClick={() => changeQty(l.id, -l.qty)}
                      className="text-slate-300 transition-colors hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Restar"
                        onClick={() => changeQty(l.id, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white ring-1 ring-inset ring-slate-200 transition hover:bg-slate-100"
                      >
                        <Minus className="h-3 w-3 text-slate-600" />
                      </button>
                      <span className="w-9 text-center text-[13px] font-bold tabular-nums text-slate-800">
                        {l.qty}
                      </span>
                      <button
                        type="button"
                        aria-label="Sumar"
                        onClick={() => changeQty(l.id, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white ring-1 ring-inset ring-slate-200 transition hover:bg-slate-100"
                      >
                        <Plus className="h-3 w-3 text-slate-600" />
                      </button>
                    </div>
                    <span className="text-[13px] font-bold tabular-nums text-slate-900">
                      {fmt(l.price * l.qty)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 p-4">
          <dl className="space-y-1.5 text-[13px]">
            <div className="flex justify-between text-slate-500">
              <dt>Subtotal</dt>
              <dd className="font-medium tabular-nums">{fmt(total)}</dd>
            </div>
            <div className="flex justify-between text-slate-500">
              <dt>Descuento</dt>
              <dd className="font-medium tabular-nums">$ 0</dd>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <dt className="text-sm font-bold uppercase tracking-wide text-slate-700">Total</dt>
              <dd className="text-2xl font-extrabold tracking-tight tabular-nums text-brand-600">
                {fmt(total)}
              </dd>
            </div>
          </dl>

          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { key: 'efectivo', label: 'Efectivo', icon: <Banknote className="h-4 w-4" /> },
                { key: 'transferencia', label: 'Transf.', icon: <CreditCard className="h-4 w-4" /> },
                { key: 'credito', label: 'Crédito', icon: <UserRound className="h-4 w-4" /> },
              ] as const
            ).map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setPayMethod(m.key)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] font-semibold outline-none transition-all focus-visible:ring-2 focus-visible:ring-brand-500/40',
                  payMethod === m.key
                    ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'
                )}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>

          <Button size="lg" className="w-full text-base" disabled={cart.length === 0}>
            Cobrar {fmt(total)}
          </Button>
        </div>
      </aside>
    </div>
  );
}
