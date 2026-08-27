'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  Send,
  Copy,
  Check,
  Search,
  Store,
  Clock,
  Users,
  Package,
  PhoneCall,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatoCOP, formatoFechaHora } from '@/lib/format';
import {
  actualizarEstadoPedidoOnline,
  marcarLeadContactado,
  type PedidoOnlineLista,
  type LeadTiendaLista,
} from '@/lib/actions/tienda';

type EstadoPedido = 'PENDIENTE' | 'EMPACADO' | 'DESPACHADO' | 'ENTREGADO' | 'CANCELADO';

const ESTADO_LABEL: Record<EstadoPedido, string> = {
  PENDIENTE: 'Pendiente',
  EMPACADO: 'Empacado',
  DESPACHADO: 'En camino',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

const METODO_LABEL: Record<string, string> = {
  CONTADO: 'Contado',
  PLAN_SEPARE: 'Plan Separe',
  ADDI: 'Addi',
  SISTECREDITO: 'Sistecrédito',
};

interface Props {
  pedidosIniciales: PedidoOnlineLista[];
  leadsIniciales: LeadTiendaLista[];
}

export default function VentasOnlineClient({ pedidosIniciales, leadsIniciales }: Props) {
  const [tab, setTab] = useState<'pedidos' | 'leads'>('pedidos');
  const [copiado, setCopiado] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [pedidos, setPedidos] = useState(pedidosIniciales);
  const [leads, setLeads] = useState(leadsIniciales);
  const [, startTransition] = useTransition();

  const cambiarEstado = (id: number, nuevo: EstadoPedido) => {
    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, estado: nuevo } : p)));
    startTransition(() => {
      actualizarEstadoPedidoOnline(id, nuevo);
    });
  };

  const toggleContactado = (id: number, contactado: boolean) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, contactado } : l)));
    startTransition(() => {
      marcarLeadContactado(id, contactado);
    });
  };

  const copiarEnlaceTienda = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/tienda` : 'https://kaob.com/tienda';
    navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const pedidosFiltrados = pedidos.filter((p) => {
    if (filtroEstado !== 'todos' && p.estado !== filtroEstado) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      return (
        String(p.consecutivo).includes(q) ||
        p.clienteNombre.toLowerCase().includes(q) ||
        p.ciudad.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const leadsSinContactar = leads.filter((l) => !l.contactado).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ventas Online & Pedidos Web"
        description="Gestiona las solicitudes entrantes desde la tienda oficial KAOB MODERN WEAR y recupera visitantes que no completaron su compra."
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
          <div className="h-12 w-12 flex items-center justify-center shrink-0">
            <img src="/brand/isotype.png" alt="KAOB" className="h-full w-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold uppercase tracking-wider">
                Tienda KAOB Online
              </h2>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                En línea & sincronizada
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tu catálogo lee automáticamente las prendas, tallas y existencias de la bodega activa del POS.
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

      {/* Pestañas */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab('pedidos')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            tab === 'pedidos' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Package className="h-3.5 w-3.5" />
          Pedidos Recibidos ({pedidos.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('leads')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            tab === 'leads' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          Leads de Recuperación {leadsSinContactar > 0 && `(${leadsSinContactar} sin contactar)`}
        </button>
      </div>

      {tab === 'pedidos' ? (
        <>
          {/* Barra de Filtros y Buscador */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setFiltroEstado('todos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filtroEstado === 'todos' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({pedidos.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroEstado('PENDIENTE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filtroEstado === 'PENDIENTE' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pendientes ({pedidos.filter((p) => p.estado === 'PENDIENTE').length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroEstado('EMPACADO')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filtroEstado === 'EMPACADO' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Empacados ({pedidos.filter((p) => p.estado === 'EMPACADO').length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroEstado('DESPACHADO')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filtroEstado === 'DESPACHADO' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Despachados ({pedidos.filter((p) => p.estado === 'DESPACHADO').length})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, pedido o ciudad…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Lista de Pedidos Online */}
          {pedidosFiltrados.length === 0 ? (
            <div className="p-10 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
              <p className="text-sm font-bold text-slate-700">Aún no hay pedidos que coincidan</p>
              <p className="text-xs text-slate-400 mt-1">
                Los pedidos se registran automáticamente cuando un cliente finaliza su compra en la tienda web.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pedidosFiltrados.map((ped) => {
                const codigo = `PED-${String(ped.consecutivo).padStart(4, '0')}`;
                const estado = ped.estado as EstadoPedido;
                return (
                  <div
                    key={ped.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                            {codigo}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {formatoFechaHora(ped.createdAt)}
                          </p>
                        </div>

                        <Badge
                          variant={
                            estado === 'PENDIENTE'
                              ? 'warning'
                              : estado === 'EMPACADO'
                              ? 'info'
                              : estado === 'DESPACHADO'
                              ? 'success'
                              : 'neutral'
                          }
                        >
                          {ESTADO_LABEL[estado]}
                        </Badge>
                      </div>

                      {/* Datos del Cliente */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                        <p className="font-bold text-slate-900">{ped.clienteNombre}</p>
                        <p className="text-slate-600">📱 WhatsApp: {ped.clienteTelefono}</p>
                        <p className="text-slate-500 text-[11px]">📍 {ped.ciudad} - {ped.direccion}</p>
                        <p className="text-slate-500 text-[11px]">
                          💳 {METODO_LABEL[ped.metodoFinanciacion] ?? ped.metodoFinanciacion}
                        </p>
                      </div>

                      {/* Prendas */}
                      <div className="space-y-1.5 text-xs">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Prendas Solicitadas</p>
                        {ped.items.map((pr) => (
                          <div key={pr.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200/80">
                            <div>
                              <p className="font-semibold text-slate-800 line-clamp-1">{pr.nombreProducto}</p>
                              <p className="text-[10px] text-slate-400">Talla: {pr.tallaValor} · Color: {pr.colorNombre} · Cant: {pr.cantidad}</p>
                            </div>
                            <span className="font-bold text-slate-900">{formatoCOP(pr.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total y Acciones */}
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium">Total Pedido</span>
                        <span className="text-base font-extrabold text-slate-900">{formatoCOP(ped.total)}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {(() => {
                          let textoMensaje = `¡Hola ${ped.clienteNombre}! Te contactamos de KΛOB MODERN WEAR respecto a tu orden ${codigo} por ${formatoCOP(ped.total)}.`;
                          if (ped.metodoFinanciacion === 'TRANSFERENCIA') {
                            textoMensaje = `¡Hola ${ped.clienteNombre}! Un gusto saludarte de KΛOB MODERN WEAR. Tu pedido ${codigo} por ${formatoCOP(ped.total)} está reservado con éxito. Puedes realizar la transferencia a Nequi: 3136332887 y enviarnos tu comprobante por este medio para despachar hoy mismo.`;
                          } else if (ped.metodoFinanciacion === 'ADDI') {
                            textoMensaje = `¡Hola ${ped.clienteNombre}! Un gusto saludarte de KΛOB MODERN WEAR. Para procesar tu compra ${codigo} con Addi (0% interés), por favor confírmanos tu número de cédula para enviarte el link oficial de pago seguro.`;
                          } else if (ped.metodoFinanciacion === 'SISTECREDITO') {
                            textoMensaje = `¡Hola ${ped.clienteNombre}! Un gusto saludarte de KΛOB MODERN WEAR. Para validar tu crédito de la orden ${codigo} (${formatoCOP(ped.total)}) con Sistecrédito, compártenos tu número de cédula.`;
                          } else if (ped.metodoFinanciacion === 'PLAN_SEPARE') {
                            textoMensaje = `¡Hola ${ped.clienteNombre}! Con gusto apartamos tus prendas de la orden ${codigo}. El abono inicial requerido (30%) es de ${formatoCOP(Math.round(ped.total * 0.3))} a Nequi: 3136332887 para congelar tu talla.`;
                          }

                          const telLimpio = ped.clienteTelefono.replace(/[^0-9]/g, '');
                          const telFinal = telLimpio.startsWith('57') ? telLimpio : `57${telLimpio}`;

                          return (
                            <a
                              href={`https://wa.me/${telFinal}?text=${encodeURIComponent(textoMensaje)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                            >
                              <Send className="h-3.5 w-3.5" /> Atender en WA
                            </a>
                          );
                        })()}

                        {estado === 'PENDIENTE' ? (
                          <Button size="sm" onClick={() => cambiarEstado(ped.id, 'EMPACADO')} className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white">
                            Empacar
                          </Button>
                        ) : estado === 'EMPACADO' ? (
                          <Button
                            size="sm"
                            onClick={() => cambiarEstado(ped.id, 'DESPACHADO')}
                            className="text-xs font-bold bg-brand-600 hover:bg-brand-700"
                          >
                            Despachar
                          </Button>
                        ) : estado === 'DESPACHADO' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cambiarEstado(ped.id, 'ENTREGADO')}
                            className="text-xs font-bold text-emerald-700 border-emerald-300"
                          >
                            ✓ Entregado
                          </Button>
                        ) : (
                          <span className="flex items-center justify-center text-[11px] font-bold text-slate-400">
                            {ESTADO_LABEL[estado]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 max-w-2xl">
            Visitantes que estaban a punto de irse sin comprar y dejaron sus datos a cambio de un descuento (exit-intent). Contáctalos
            manualmente por WhatsApp o correo para recuperar la venta.
          </p>
          {leads.length === 0 ? (
            <div className="p-10 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
              <p className="text-sm font-bold text-slate-700">Aún no hay leads capturados</p>
              <p className="text-xs text-slate-400 mt-1">
                Aparecerán aquí cuando un visitante reciba el cupón de descuento por intención de salida en la tienda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leads.map((lead) => (
                <div key={lead.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Badge variant={lead.origen === 'EXIT_INTENT' ? 'warning' : 'info'}>
                      {lead.origen === 'EXIT_INTENT' ? 'Intención de salida' : lead.origen === 'CARRITO_ABANDONADO' ? 'Carrito abandonado' : 'Newsletter'}
                    </Badge>
                    <span className="text-[10px] text-slate-400">{formatoFechaHora(lead.createdAt)}</span>
                  </div>
                  <div className="text-xs space-y-1">
                    {lead.telefono && <p className="text-slate-700 font-semibold">📱 {lead.telefono}</p>}
                    {lead.email && <p className="text-slate-700 font-semibold">✉️ {lead.email}</p>}
                    {lead.cuponOfrecido && (
                      <p className="text-slate-500">
                        Cupón ofrecido: <span className="font-mono font-bold text-slate-800">{lead.cuponOfrecido}</span> ({lead.descuentoPct}%)
                      </p>
                    )}
                    {lead.carritoResumen && <p className="text-slate-400 text-[11px] line-clamp-2">🛍 {lead.carritoResumen}</p>}
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    {lead.telefono && (
                      <a
                        href={`https://wa.me/57${lead.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`¡Hola! Vimos que estabas armando tu pedido en KAOB MODERN WEAR. Tu cupón ${lead.cuponOfrecido ?? ''} sigue disponible, ¿te ayudo a completarlo?`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-bold"
                      >
                        <PhoneCall className="h-3 w-3" /> Contactar
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleContactado(lead.id, !lead.contactado)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                        lead.contactado
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Check className="h-3 w-3" /> {lead.contactado ? 'Contactado' : 'Marcar contactado'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
