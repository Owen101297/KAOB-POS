'use client';

import Link from 'next/link';
import { Bell, ChevronDown, LayoutGrid, LogOut, Menu, Package, Settings, Store, User, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useBodega } from '@/components/providers/BodegaProvider';
import { useSession, signOut } from 'next-auth/react';

const NOTIFICATIONS = [
  { title: 'Stock bajo', detail: '2 productos por debajo del mínimo', time: 'Hace 5 min' },
  { title: 'Cierre de caja pendiente', detail: 'Turno de ayer sin cerrar', time: 'Hace 1 h' },
];

const ROL_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  GERENTE: 'Gerente',
  CAJERO: 'Cajero',
  VENDEDOR: 'Vendedor',
  BODEGUERO: 'Bodeguero',
};

function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.trim().slice(0, 2).toUpperCase();
  }
  return 'KB';
}

function BodegaSelector() {
  const { bodegas, bodegaActiva, setBodegaActivaId } = useBodega();
  return (
    <Select
      value={bodegaActiva ? String(bodegaActiva.id) : undefined}
      onValueChange={(v) => setBodegaActivaId(Number(v))}
    >
      <SelectTrigger className="w-[190px]">
        <Package className="mr-1 h-4 w-4 text-slate-400" />
        <SelectValue placeholder="Bodega..." />
      </SelectTrigger>
      <SelectContent>
        {bodegas.map((b) => (
          <SelectItem key={b.id} value={String(b.id)}>
            {b.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const userName = user?.name || user?.email?.split('@')[0] || 'Usuario';
  const userRol = user?.rol || 'CAJERO';
  const initials = getInitials(user?.name, user?.email);
  const isLoading = status === 'loading';

  return (
    <header className="fixed inset-x-0 top-0 z-[1300] flex h-16 items-stretch border-b border-slate-200/70 bg-white/90 backdrop-blur">
      {/* Zona izquierda: hamburguesa (móvil) + marca (desktop) */}
      <div className="flex w-[76px] shrink-0 items-center justify-center">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Abrir menú"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link
          href="/"
          title="KAOB | MODERN WEAR"
          aria-label="Ir al Inicio"
          className="hidden h-10 w-10 items-center justify-center rounded-full bg-transparent transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-400 lg:flex"
        >
          <img src="/brand/isotype.svg" alt="KAOB" className="h-8 w-8 object-contain rounded-full" />
        </Link>
      </div>

      {/* Zona central: logo centrado (móvil) + selector de almacén y tienda (desktop) */}
      <div className="flex flex-1 items-center gap-3 px-4">
        <Link
          href="/"
          title="KAOB | MODERN WEAR"
          aria-label="Ir al Inicio"
          className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-transparent transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-400 lg:hidden"
        >
          <img src="/brand/isotype.svg" alt="KAOB" className="h-8 w-8 object-contain rounded-full" />
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          <BodegaSelector />
        </div>

        <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200">
          <Link
            href="/tienda"
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            <Store className="h-3.5 w-3.5 text-brand-400" />
            <span>Ver Tienda Online</span>
          </Link>
        </div>
      </div>

      {/* Zona derecha */}
      <div className="flex items-center gap-1 pr-3">
        {/* Notificaciones */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Notificaciones"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 outline-none transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-brand-500/40"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                2
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[280px]">
            <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
            {NOTIFICATIONS.map((n) => (
              <DropdownMenuItem key={n.title} className="items-start gap-3 py-2.5">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-semibold text-slate-800">{n.title}</span>
                  <span className="text-xs text-slate-400">{n.detail}</span>
                  <span className="text-[11px] text-slate-300">{n.time}</span>
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Menú de usuario"
              className="ml-1 flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 outline-none transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-brand-500/40"
            >
              {isLoading ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 animate-pulse" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-[11px] font-bold text-white">
                  {initials}
                </span>
              )}
              <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[220px]">
            <div className="flex items-center gap-3 px-2.5 py-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-[11px] font-bold text-white">
                {initials}
              </span>
              <div>
                <p className="text-[13px] font-semibold text-slate-900">{userName}</p>
                <p className="flex items-center gap-1 text-xs text-slate-400">
                  <Shield className="h-3 w-3" />
                  {ROL_LABELS[userRol] || userRol}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User /> Mi perfil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings /> Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
