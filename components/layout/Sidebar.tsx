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
  Settings,
  ShoppingCart,
  Store,
  Truck,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useSession } from 'next-auth/react';

interface SubItem {
  label: string;
  href: string;
  roles?: string[];
}
interface MenuItem {
  label: string;
  icon: LucideIcon;
  href?: string;
  sub?: SubItem[];
  roles?: string[];
}

const MENU: MenuItem[] = [
  { label: 'Vender', icon: ShoppingCart, href: '/ventas/nueva', roles: ['ADMIN', 'GERENTE', 'CAJERO', 'VENDEDOR'] },
  { label: 'Nómina Electr.', icon: ReceiptText, roles: ['ADMIN', 'GERENTE'] },
  {
    label: 'Ventas',
    icon: Receipt,
    roles: ['ADMIN', 'GERENTE', 'CAJERO', 'VENDEDOR'],
    sub: [
      { label: 'Remisiones', href: '/remisiones', roles: ['ADMIN', 'GERENTE', 'CAJERO', 'VENDEDOR'] },
      { label: 'Histórico de Ventas', href: '/ventas', roles: ['ADMIN', 'GERENTE', 'CAJERO', 'VENDEDOR'] },
      { label: 'Histórico de Remisiones', href: '/remisiones/historico', roles: ['ADMIN', 'GERENTE', 'CAJERO', 'VENDEDOR'] },
      { label: 'Ingresar Efectivo', href: '/caja/ingreso', roles: ['ADMIN', 'GERENTE', 'CAJERO'] },
      { label: 'Cerrar Caja (Cajero)', href: '/caja/cerrar', roles: ['ADMIN', 'GERENTE', 'CAJERO'] },
      { label: 'Cierres de Caja', href: '/caja/cierres', roles: ['ADMIN', 'GERENTE'] },
      { label: 'Plan Separe', href: '/plan-separe', roles: ['ADMIN', 'GERENTE', 'CAJERO'] },
      { label: 'Ventas Online', href: '/ventas-online', roles: ['ADMIN', 'GERENTE', 'CAJERO', 'VENDEDOR'] },
      { label: 'Cotizaciones', href: '/cotizaciones', roles: ['ADMIN', 'GERENTE', 'CAJERO', 'VENDEDOR'] },
      { label: 'Créditos', href: '/creditos', roles: ['ADMIN', 'GERENTE', 'CAJERO'] },
    ],
  },
  {
    label: 'Inventario',
    icon: Package,
    roles: ['ADMIN', 'GERENTE', 'CAJERO', 'VENDEDOR', 'BODEGUERO'],
    sub: [
      { label: 'Productos', href: '/productos', roles: ['ADMIN', 'GERENTE', 'CAJERO', 'VENDEDOR', 'BODEGUERO'] },
      { label: 'Stock por Bodega', href: '/inventario', roles: ['ADMIN', 'GERENTE', 'CAJERO', 'VENDEDOR', 'BODEGUERO'] },
      { label: 'Traslados', href: '/traslados', roles: ['ADMIN', 'GERENTE', 'BODEGUERO'] },
      { label: 'Movimientos', href: '/movimientos', roles: ['ADMIN', 'GERENTE', 'BODEGUERO'] },
      { label: 'Libro de Precios', href: '/lista-precios', roles: ['ADMIN', 'GERENTE', 'CAJERO', 'VENDEDOR'] },
      { label: 'Producción', href: '/produccion', roles: ['ADMIN', 'GERENTE', 'BODEGUERO'] },
      { label: 'Auditoría Inventario', href: '/auditoria', roles: ['ADMIN', 'GERENTE', 'BODEGUERO'] },
    ],
  },
  {
    label: 'Fidelización',
    icon: Gift,
    roles: ['ADMIN', 'GERENTE', 'CAJERO', 'VENDEDOR'],
    sub: [
      { label: 'Gift Cards', href: '/gift-cards', roles: ['ADMIN', 'GERENTE', 'CAJERO', 'VENDEDOR'] },
      { label: 'Puntos', href: '/puntos', roles: ['ADMIN', 'GERENTE', 'CAJERO', 'VENDEDOR'] },
      { label: 'Promociones', href: '/promociones', roles: ['ADMIN', 'GERENTE', 'CAJERO', 'VENDEDOR'] },
    ],
  },
  {
    label: 'Compras',
    icon: Truck,
    roles: ['ADMIN', 'GERENTE'],
    sub: [
      { label: 'Documento Soporte', href: '/compras/documento-soporte', roles: ['ADMIN', 'GERENTE'] },
      { label: 'Histórico de Doc. Soporte', href: '/compras/historico-doc-soporte', roles: ['ADMIN', 'GERENTE'] },
      { label: 'Gastos', href: '/gastos', roles: ['ADMIN', 'GERENTE'] },
      { label: 'Órdenes de Compras', href: '/ordenes-compra', roles: ['ADMIN', 'GERENTE'] },
      { label: 'Bancos', href: '/bancos', roles: ['ADMIN', 'GERENTE'] },
      { label: 'Movimientos bancarios', href: '/bancos/movimientos', roles: ['ADMIN', 'GERENTE'] },
      { label: 'Conciliaciones', href: '/bancos/conciliaciones', roles: ['ADMIN', 'GERENTE'] },
    ],
  },
  {
    label: 'Contactos',
    icon: Users,
    roles: ['ADMIN', 'GERENTE', 'CAJERO', 'VENDEDOR', 'BODEGUERO'],
    sub: [
      { label: 'Clientes', href: '/clientes', roles: ['ADMIN', 'GERENTE', 'CAJERO', 'VENDEDOR'] },
      { label: 'Vendedores', href: '/vendedores', roles: ['ADMIN', 'GERENTE'] },
      { label: 'Proveedores', href: '/proveedores', roles: ['ADMIN', 'GERENTE', 'BODEGUERO'] },
      { label: 'Domiciliarios', href: '/domiciliarios', roles: ['ADMIN', 'GERENTE'] },
    ],
  },
  { label: 'Informes', icon: BarChart3, href: '/informes', roles: ['ADMIN', 'GERENTE'] },
  { label: 'Tienda', icon: Store, href: '/tienda' },
  {
    label: 'Configuración',
    icon: Settings,
    roles: ['ADMIN'],
    sub: [
      { label: 'General y Tickets', href: '/configuracion', roles: ['ADMIN'] },
      { label: 'Catálogos', href: '/configuracion/catalogos', roles: ['ADMIN'] },
      { label: 'Usuarios', href: '/usuarios', roles: ['ADMIN'] },
    ],
  },
];

function matchHref(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/');
}

export default function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const rol = (session?.user?.rol || 'CAJERO').toUpperCase();

  const [hovered, setHovered] = useState<{ item: MenuItem; top: number } | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});

  // Filtrar menú y subítems según el rol del usuario
  const filteredMenu: MenuItem[] = MENU.filter((item) => {
    if (!item.roles) return true;
    if (rol === 'ADMIN') return true;
    return item.roles.includes(rol);
  }).map((item) => {
    if (!item.sub) return item;
    const filteredSub = item.sub.filter((s) => {
      if (!s.roles) return true;
      if (rol === 'ADMIN') return true;
      return s.roles.includes(rol);
    });
    return { ...item, sub: filteredSub };
  }).filter((item) => {
    // Si era un menú con subítems y todos fueron filtrados, no mostrar la categoría
    if (item.sub && item.sub.length === 0 && !item.href) return false;
    return true;
  });

  // El href más largo y coincidente gana (evita que /ventas/nueva active también "Ventas")
  let bestMatch: string | null = null;
  for (const item of filteredMenu) {
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
    if (!item.sub || !el || item.sub.length === 0) return setHovered(null);
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
        {filteredMenu.map((item) => {
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
                  onClick={(e) => {
                    if (item.sub) {
                      if (hovered?.item.label === item.label) {
                        setHovered(null);
                      } else {
                        openFlyout(item, e.currentTarget.closest('li'));
                      }
                    }
                  }}
                  className="relative mx-auto flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-xl py-2 outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </nav>

      {/* Submenú flotante adaptado a desktop, tablet y móvil */}
      {hovered?.item.sub && (
        <div
          className="fixed left-[76px] z-[1600] w-64 animate-slide-left block"
          style={{ top: Math.max(16, Math.min(hovered.top, typeof window !== 'undefined' ? window.innerHeight - 340 : hovered.top)) }}
          onMouseEnter={() => {
            if (hideTimer.current) clearTimeout(hideTimer.current);
          }}
          onMouseLeave={scheduleClose}
        >
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
            <div className="px-3 pb-1.5 pt-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-100 mb-1 flex items-center justify-between">
              <span>{hovered.item.label}</span>
              <button
                type="button"
                onClick={() => setHovered(null)}
                className="lg:hidden text-slate-400 hover:text-slate-700 p-1 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto space-y-0.5">
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
                      active ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    )}
                  >
                    {subItem.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
