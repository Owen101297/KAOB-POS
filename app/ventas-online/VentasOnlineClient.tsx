'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  ExternalLink,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  Send,
  Copy,
  Check,
  Search,
  Store,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatoCOP } from '@/lib/format';

interface PedidoOnline {
  id: string;
  cliente: string;
  telefono: string;
  ciudad: string;
  direccion: string;
  total: number;
  fecha: string;
  estado: 'pendiente' | 'empacado' | 'despachado' | 'entregado';
  prendas: { nombre: string; talla: string; color: string; cantidad: number; subtotal: number }[];
}

export default function VentasOnlineClient() {
  const [copiado, setCopiado] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');

  // Pedidos online de ejemplo / demostración en tiempo real
  const [pedidos, setPedidos] = useState<PedidoOnline[]>([
    {
      id: 'PED-1001',
      cliente: 'Mariana Gómez',
      telefono: '3124567890',
      ciudad: 'Medellín',
      direccion: 'Cra 43A # 1-50 Apto 802',
      total: 185000,
      fecha: 'Hoy, hace 25 min',
      estado: 'pendiente',
      prendas: [
        { nombre: 'Camiseta Oversize Heavyweight', talla: 'M', color: 'Negro', cantidad: 2, subtotal: 130000 },
        { nombre: 'Gorra Essential KAOB', talla: 'U', color: 'Blanco', cantidad: 1, subtotal: 55000 },
      ],
    },
    {
      id: 'PED-1002',
      cliente: 'Andrés Felipe Restrepo',
      telefono: '3009876543',
      ciudad: 'Bogotá',
      direccion: 'Calle 100 # 15-20',
      total: 240000,
      fecha: 'Hoy, hace 2 horas',
      estado: 'empacado',
      prendas: [
        { nombre: 'Hoodie Boxy Fit Fleece', talla: 'L', color: 'Gris Plomo', cantidad: 1, subtotal: 160000 },
        { nombre: 'Camiseta Minimal Stamp', talla: 'L', color: 'Negro', cantidad: 1, subtotal: 80000 },
      ],
    },
    {
      id: 'PED-1003',
      cliente: 'Camila Torres',
      telefono: '3157891234',
      ciudad: 'Cali',
      direccion: 'Av 6N # 25-10',
      total: 95000,
      fecha: 'Ayer',
      estado: 'despachado',
      prendas: [
        { nombre: 'Pantalón Cargo Loose', talla: '30', color: 'Beige', cantidad: 1, subtotal: 95000 },
      ],
    },
  ]);

  const cambiarEstado = (id: string, nuevo: PedidoOnline['estado']) => {
    setPedidos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, estado: nuevo } : p))
    );
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
        p.id.toLowerCase().includes(q) ||
        p.cliente.toLowerCase().includes(q) ||
        p.ciudad.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ventas Online & Pedidos Web"
        description="Gestiona las solicitudes entrantes desde la tienda oficial KAOB MODERN WEAR y WhatsApp."
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
            onClick={() => setFiltroEstado('pendiente')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filtroEstado === 'pendiente' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pendientes ({pedidos.filter((p) => p.estado === 'pendiente').length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('empacado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filtroEstado === 'empacado' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Empacados ({pedidos.filter((p) => p.estado === 'empacado').length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('despachado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filtroEstado === 'despachado' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Despachados ({pedidos.filter((p) => p.estado === 'despachado').length})
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pedidosFiltrados.map((ped) => (
          <div
            key={ped.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {ped.id}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {ped.fecha}
                  </p>
                </div>

                <Badge
                  variant={
                    ped.estado === 'pendiente'
                      ? 'warning'
                      : ped.estado === 'empacado'
                      ? 'info'
                      : ped.estado === 'despachado'
                      ? 'success'
                      : 'neutral'
                  }
                >
                  {ped.estado === 'pendiente'
                    ? 'Pendiente'
                    : ped.estado === 'empacado'
                    ? 'Empacado'
                    : ped.estado === 'despachado'
                    ? 'En camino'
                    : 'Entregado'}
                </Badge>
              </div>

              {/* Datos del Cliente */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <p className="font-bold text-slate-900">{ped.cliente}</p>
                <p className="text-slate-600">📱 WhatsApp: {ped.telefono}</p>
                <p className="text-slate-500 text-[11px]">📍 {ped.ciudad} - {ped.direccion}</p>
              </div>

              {/* Prendas */}
              <div className="space-y-1.5 text-xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Prendas Solicitadas</p>
                {ped.prendas.map((pr, i) => (
                  <div key={i} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200/80">
                    <div>
                      <p className="font-semibold text-slate-800 line-clamp-1">{pr.nombre}</p>
                      <p className="text-[10px] text-slate-400">Talla: {pr.talla} · Color: {pr.color} · Cant: {pr.cantidad}</p>
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
                <a
                  href={`https://wa.me/57${ped.telefono}?text=${encodeURIComponent(`¡Hola ${ped.cliente}! Te contactamos de KAOB MODERN WEAR respecto a tu pedido ${ped.id}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-colors"
                >
                  <Send className="h-3.5 w-3.5" /> WhatsApp
                </a>

                {ped.estado === 'pendiente' ? (
                  <Button
                    size="sm"
                    onClick={() => cambiarEstado(ped.id, 'empacado')}
                    className="text-xs font-bold"
                  >
                    Empacar
                  </Button>
                ) : ped.estado === 'empacado' ? (
                  <Button
                    size="sm"
                    onClick={() => cambiarEstado(ped.id, 'despachado')}
                    className="text-xs font-bold bg-brand-600 hover:bg-brand-700"
                  >
                    Despachar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cambiarEstado(ped.id, 'entregado')}
                    className="text-xs font-bold text-emerald-700 border-emerald-300"
                  >
                    ✓ Entregado
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
