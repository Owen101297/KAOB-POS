'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Gift,
  Package,
  Receipt,
  ReceiptText,
  ShoppingCart,
  Store,
  Truck,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubItem {
  label: string;
  href: string;
}
interface MenuItem {
  label: string;
  icon: LucideIcon;
  href?: string;
  sub?: SubItem[];
}

const MENU: MenuItem[] = [
  { label: 'Vender', icon: ShoppingCart, href: '/ventas/nueva' },
  { label: 'Nómina Electr.', icon: ReceiptText },
  {
    label: 'Ventas',
    icon: Receipt,
    sub: [
      { label: 'Remisiones', href: '/remisiones' },
      { label: 'Histórico de Ventas', href: '/ventas' },
      { label: 'Histórico de Remisiones', href: '/remisiones/historico' },
      { label: 'Ingresar Efectivo', href: '/caja/ingreso' },
      { label: 'Cerrar Caja (Cajero)', href: '/caja/cerrar' },
      { label: 'Cierres de Caja', href: '/caja/cierres' },
      { label: 'Plan Separe', href: '/plan-separe' },
      { label: 'Ventas Online', href: '/ventas-online' },
      { label: 'Cotizaciones', href: '/cotizaciones' },
      { label: 'Créditos', href: '/creditos' },
    ],
  },
  {
    label: 'Inventario',
    icon: Package,
    sub: [
      { label: 'Productos', href: '/productos' },
      { label: 'Categorías', href: '/categorias' },
      { label: 'Movimientos', href: '/inventario' },
      { label: 'Libro de Precios', href: '/lista-precios' },
      { label: 'Producción', href: '/produccion' },
      { label: 'Auditoría Inventario', href: '/auditoria' },
    ],
  },
  {
    label: 'Fidelización',
    icon: Gift,
    sub: [
      { label: 'Gift Cards', href: '/gift-cards' },
      { label: 'Puntos', href: '/puntos' },
      { label: 'Promociones', href: '/promociones' },
    ],
  },
  {
    label: 'Compras',
    icon: Truck,
    sub: [
      { label: 'Documento Soporte', href: '/compras/documento-soporte' },
      { label: 'Histórico de Doc. Soporte', href: '/compras/historico-doc-soporte' },
      { label: 'Gastos', href: '/gastos' },
      { label: 'Órdenes de Compras', href: '/ordenes-compra' },
      { label: 'Bancos', href: '/bancos' },
      { label: 'Movimientos bancarios', href: '/bancos/movimientos' },
      { label: 'Conciliaciones', href: '/bancos/conciliaciones' },
    ],
  },
  {
    label: 'Contactos',
    icon: Users,
    sub: [
      { label: 'Clientes', href: '/clientes' },
      { label: 'Vendedores', href: '/vendedores' },
      { label: 'Proveedores', href: '/proveedores' },
      { label: 'Domiciliarios', href: '/domiciliarios' },
    ],
  },
  { label: 'Informes', icon: BarChart3, href: '/informes' },
  { label: 'Tienda', icon: Store, href: '/tienda' },
];

function matchHref(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/');
}

export default function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState<{ item: MenuItem; top: number } | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});

  // El href más largo y coincidente gana (evita que /ventas/nueva active también "Ventas")
  let bestMatch: string | null = null;
  for (const item of MENU) {
    const candidates = [...(item.href ? [item.href] : []), ...(item.sub?.map((s) => s.href) ?? [])];
    for (const c of candidates) {
      if (matchHref(pathname, c) && (!bestMatch || c.length > bestMatch.length)) bestMatch = c;
    }
  }

  const ownsBest = (item: MenuItem) =>
    bestMatch !== null &&
    ((item.href && item.href === bestMatch) ||
      (!!item.sub && item.sub.some((s) => s.href === bestMatch)));

  const openFlyout = (item: MenuItem, el: HTMLLIElement | null) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (!item.sub || !el) return setHovered(null);
    const rect = el.getBoundingClientRect();
    const estimated = 46 + item.sub.length * 38 + 12;
    const top = Math.max(72, Math.min(rect.top - 4, window.innerHeight - estimated - 12));
    setHovered({ item, top });
  };

  const scheduleClose = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setHovered(null), 120);
  };

  return (
    <>
      {/* Overlay móvil */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[1400] bg-slate-950/50 backdrop-blur-sm animate-fade-in lg:hidden"
          onClick={onClose}
        />
      )}

      <nav
        className={cn(
          'fixed left-0 top-16 bottom-0 z-[1500] flex w-[76px] flex-col gap-1 overflow-y-auto overflow-x-visible bg-slate-900 px-2 py-3 scrollbar-none transition-transform duration-300 ease-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ scrollbarWidth: 'none' }}
      >
        {MENU.map((item) => {
          const Icon = item.icon;
          const isActive = ownsBest(item);
          const content = (
            <>
              <span
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 [&_svg]:h-[18px] [&_svg]:w-[18px]',
                  isActive
                    ? 'bg-brand-500/15 text-brand-400'
                    : 'text-slate-400 group-hover:bg-white/10 group-hover:text-white'
                )}
              >
                <Icon />
              </span>
              <span
                className={cn(
                  'text-center text-[10px] font-medium leading-tight transition-colors',
                  isActive ? 'text-brand-400' : 'text-slate-300 group-hover:text-white'
                )}
              >
                {item.label}
              </span>
              {/* Indicador activo */}
              {isActive && (
                <span className="absolute -left-2 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-brand-400" />
              )}
            </>
          );

          return (
            <li
              key={item.label}
              ref={(el) => {
                if (item.sub) itemRefs.current[item.label] = el;
              }}
              className="group relative list-none"
              onMouseEnter={(e) => openFlyout(item, e.currentTarget)}
              onMouseLeave={scheduleClose}
            >
              {item.href ? (
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="relative mx-auto flex w-full flex-col items-center gap-1.5 rounded-xl py-2 outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
                >
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  className="relative mx-auto flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-xl py-2 outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </nav>

      {/* Submenú flotante */}
      {hovered?.item.sub && (
        <div
          className="fixed left-[76px] z-[1600] hidden w-60 animate-slide-left lg:block"
          style={{ top: hovered.top }}
          onMouseEnter={() => {
            if (hideTimer.current) clearTimeout(hideTimer.current);
          }}
          onMouseLeave={scheduleClose}
        >
          <div className="overflow-hidden rounded-xl border border-slate-100 bg-white p-1.5 shadow-menu">
            <div className="px-3 pb-1.5 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {hovered.item.label}
            </div>
            {hovered.item.sub.map((subItem) => {
              const active = bestMatch === subItem.href;
              return (
                <Link
                  key={subItem.href}
                  href={subItem.href}
                  onClick={() => {
                    setHovered(null);
                    onClose();
                  }}
                  className={cn(
                    'block rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                    active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  {subItem.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
