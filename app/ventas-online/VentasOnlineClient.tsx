'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  Truck,
  Clock,
  Send,
  Copy,
  Check,
  Search,
  Store,
  XCircle,
  Package,
  ShoppingBag,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { formatoCOP } from '@/lib/format';
import { actualizarEstadoPedido, cancelarPedidoOnline } from '@/lib/actions/pedidos';
import type { PedidoOnlineLista } from '@/lib/actions/pedidos';

// Panel real de pedidos online (BD) — sustituye la demo PED-1001..1003.
// Contrato: specs/001-ventas-online-real/contracts/pedidos.md (FR-003 a FR-006).

const ESTADOS_FILTRO = ['TODOS', 'PENDIENTE', 'EMPACADO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO'] as const;

const ESTADO_META: Record<string, { label: string; badge: 'warning' | 'info' | 'success' | 'danger' | 'neutral'; chip: string }> = {
  PENDIENTE: { label: 'Pendiente', badge: 'warning', chip: 'bg-amber-500 text-white' },
  EMPACADO: { label: 'Empacado', badge: 'info', chip: 'bg-sky-600 text-white' },
  EN_CAMINO: { label: 'En camino', badge: 'neutral', chip: 'bg-slate-800 text-white' },
  ENTREGADO: { label: 'Entregado', badge: 'success', chip: 'bg-brand-600 text-white' },
  CANCELADO: { label: 'Cancelado', badge: 'danger', chip: 'bg-red-600 text-white' },
};

const fmtFecha = (d: Date | string | null) =>
  d
    ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' }).format(new Date(d))
    : '—';

interface Props {
  pedidosIniciales: PedidoOnlineLista[];
}

export default function VentasOnlineClient({ pedidosIniciales }: Props) {
  const [pedidos, setPedidos] = useState<PedidoOnlineLista[]>(pedidosIniciales);
  const [copiado, setCopiado] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState('');

  const [pedidoEnProgreso, setPedidoEnProgreso] = useState<number | null>(null);
  const [error, setError] = useState<{ id: number | null; mensaje: string } | null>(null);
  const [idACancelar, setIdACancelar] = useState<number | null>(null);

  const copiarEnlaceTienda = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/tienda` : 'https://kaob.com/tienda';
    navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const pedidosFiltrados = pedidos.filter((p) => {
    if (filtroEstado !== 'TODOS' && p.estado !== filtroEstado) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      return (
        p.referencia.toLowerCase().includes(q) ||
        p.nombreContacto.toLowerCase().includes(q) ||
        p.telefonoContacto.includes(q) ||
        (p.ciudad ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const conteo = (estado: string) => pedidos.filter((p) => p.estado === estado).length;

  const avanzar = async (id: number, nuevoEstado: 'EMPACADO' | 'EN_CAMINO' | 'ENTREGADO') => {
    setPedidoEnProgreso(id);
    setError(null);
    const res = await actualizarEstadoPedido({ id, nuevoEstado });
    setPedidoEnProgreso(null);
    if (!res.ok) {
      setError({ id, mensaje: res.error });
      return;
    }
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, estado: nuevoEstado, estadoPor: 'Administrador', estadoEn: new Date().toISOString() }
          : p
      )
    );
  };

  const cancelarConfirmado = async () => {
    if (!idACancelar) return;
    const id = idACancelar;
    setIdACancelar(null);
    setPedidoEnProgreso(id);
    setError(null);
    const res = await cancelarPedidoOnline({ id });
    setPedidoEnProgreso(null);
    if (!res.ok) {
      setError({ id, mensaje: res.error });
      return;
    }
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, estado: 'CANCELADO', estadoPor: 'Administrador', estadoEn: new Date().toISOString() }
          : p
      )
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ventas Online & Pedidos Web"
        description="Gestiona los pedidos reales recibidos desde la tienda oficial KAOB MODERN WEAR."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={copiarEnlaceTienda}
              className="flex items-center gap-1.5 text-xs font-semibold"
            >
              {copiado ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copiado ? 'Enlace copiado' : 'Copiar enlace de tienda'}
            </Button>

            <Link href="/tienda" target="_blank">
              <Button variant="primary" className="flex items-center gap-1.5 text-xs font-semibold">
                <Store className="h-4 w-4" />
                Abrir Tienda Web <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        }
      />

      {/* Banner de Estado de la Tienda */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-zinc-950 via-black to-zinc-900 text-white border border-zinc-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white p-1 flex items-center justify-center shrink-0">
            <img src="/brand/isotype.svg" alt="KAOB" className="h-10 w-10 rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold uppercase tracking-wider">
                Tienda KAOB Online
              </h2>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Pedidos sincronizados con la BD del POS
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Cada checkout de la tienda queda registrado aquí con su referencia PED y ciclo de despacho.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Link href="/tienda" target="_blank" className="w-full md:w-auto">
            <Button size="sm" className="w-full bg-white text-black hover:bg-zinc-200 text-xs font-bold uppercase tracking-wider">
              Ver vitrina de clientes
            </Button>
          </Link>
        </div>
      </div>

      {/* Barra de Filtros y Buscador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          {ESTADOS_FILTRO.map((est) => (
            <button
              key={est}
              type="button"
              onClick={() => setFiltroEstado(est)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filtroEstado === est
                  ? est === 'TODOS'
                    ? 'bg-slate-900 text-white'
                    : ESTADO_META[est].chip
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {est === 'TODOS' ? 'Todos' : ESTADO_META[est].label}{' '}
              ({est === 'TODOS' ? pedidos.length : conteo(est)})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por referencia, cliente o ciudad…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Lista de Pedidos Online */}
      {pedidosFiltrados.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No hay pedidos que mostrar"
          description={`Sin pedidos en ${filtroEstado === 'TODOS' ? 'esta vista' : ESTADO_META[filtroEstado]?.label?.toLowerCase()}. Los checkouts de la tienda aparecen aquí al instante.`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pedidosFiltrados.map((ped) => {
            const meta = ESTADO_META[ped.estado] ?? ESTADO_META.PENDIENTE;
            const enProgreso = pedidoEnProgreso === ped.id;
            const esFinal = ped.estado === 'ENTREGADO' || ped.estado === 'CANCELADO';

            return (
              <div
                key={ped.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {ped.referencia}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {fmtFecha(ped.createdAt)}
                      </p>
                    </div>

                    <Badge variant={meta.badge}>{meta.label}</Badge>
                  </div>

                  {/* Datos del Cliente */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <p className="font-bold text-slate-900">{ped.nombreContacto}</p>
                    <p className="text-slate-600">📱 WhatsApp: {ped.telefonoContacto}</p>
                    {(ped.ciudad || ped.direccion) && (
                      <p className="text-slate-500 text-[11px]">📍 {ped.ciudad ?? ''}{ped.direccion ? ` - ${ped.direccion}` : ''}</p>
                    )}
                    {ped.notas && <p className="text-slate-500 text-[11px] italic">📝 {ped.notas}</p>}
                  </div>

                  {/* Prendas */}
                  <div className="space-y-1.5 text-xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Prendas Solicitadas</p>
                    {ped.items.map((pr) => (
                      <div key={pr.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200/80">
                        <div>
                          <p className="font-semibold text-slate-800 line-clamp-1">{pr.nombre}</p>
                          <p className="text-[10px] text-slate-400">Ref: {pr.referencia} · Talla: {pr.tallaValor} · Color: {pr.colorNombre} · Cant: {pr.cantidad}</p>
                        </div>
                        <span className="font-bold text-slate-900">{formatoCOP(pr.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Trazado del último cambio */}
                  {ped.estadoEn && (
                    <p className="text-[10px] text-slate-400">
                      Cambio por <strong className="text-slate-600">{ped.estadoPor ?? '—'}</strong> el {fmtFecha(ped.estadoEn)}
                    </p>
                  )}

                  {error?.id === ped.id && (
                    <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                      {error.mensaje}
                    </p>
                  )}
                </div>

                {/* Total y Acciones */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">Total Pedido</span>
                    <span className="text-base font-extrabold text-slate-900">{formatoCOP(ped.total)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`https://wa.me/57${ped.telefonoContacto.replace(/^57/, '')}?text=${encodeURIComponent(`¡Hola ${ped.nombreContacto}! Te contactamos de KAOB MODERN WEAR respecto a tu pedido ${ped.referencia}.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" /> WhatsApp
                    </a>

                    {!esFinal && (
                      <Button
                        size="sm"
                        disabled={enProgreso}
                        onClick={() => setIdACancelar(ped.id)}
                        className="text-xs font-bold text-red-600 border-red-300"
                        variant="outline"
                      >
                        {enProgreso ? '…' : <><XCircle className="h-3.5 w-3.5" /> Cancelar</>}
                      </Button>
                    )}

                    {ped.estado === 'PENDIENTE' && (
                      <Button
                        size="sm"
                        disabled={enProgreso}
                        onClick={() => avanzar(ped.id, 'EMPACADO')}
                        className="col-span-2 text-xs font-bold"
                      >
                        <Package className="mr-1 h-3.5 w-3.5 inline" />
                        {enProgreso ? 'Empacando…' : 'Empacar'}
                      </Button>
                    )}
                    {ped.estado === 'EMPACADO' && (
                      <Button
                        size="sm"
                        disabled={enProgreso}
                        onClick={() => avanzar(ped.id, 'EN_CAMINO')}
                        className="col-span-2 text-xs font-bold bg-brand-600 hover:bg-brand-700"
                      >
                        <Truck className="mr-1 h-3.5 w-3.5 inline" />
                        {enProgreso ? 'Despachando…' : 'Despachar'}
                      </Button>
                    )}
                    {ped.estado === 'EN_CAMINO' && (
                      <Button
                        size="sm"
                        disabled={enProgreso}
                        onClick={() => avanzar(ped.id, 'ENTREGADO')}
                        className="col-span-2 text-xs font-bold text-emerald-700 border-emerald-300"
                        variant="outline"
                      >
                        <Check className="mr-1 h-3.5 w-3.5 inline" />
                        {enProgreso ? 'Confirmando…' : '✓ Entregado'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog de cancelación */}
      <Dialog open={idACancelar !== null} onOpenChange={(open) => !open && setIdACancelar(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar pedido</DialogTitle>
            <DialogDescription>
              El pedido quedará con estado <strong>Cancelado</strong> conservando el rastro para auditoría.
              Esta acción no es reversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIdACancelar(null)} className="text-xs">
              Volver
            </Button>
            <Button onClick={cancelarConfirmado} className="text-xs bg-red-600 hover:bg-red-700 text-white">
              Cancelar pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
