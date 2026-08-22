"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Barcode,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Delete,
  DollarSign,
  ExternalLink,
  HelpCircle,
  Loader2,
  Minus,
  Package,
  Plus,
  Printer,
  Save,
  Search,
  ShoppingCart,
  Trash2,
  User,
  UserPlus,
  X,
} from "lucide-react";
import type { Producto, Variante, Cliente, Vendedor } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeading } from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import DataTable from "@/components/ui/DataTable";
import { formatoCOP } from "@/lib/format";
import { registrarVenta, buscarProductosPOS, convertirDocumento } from "@/lib/actions/ventas";
import { abrirCaja, obtenerSesionAbierta } from "@/lib/actions/caja";
import { buscarClientesRapido, guardarCliente, listarClientes, listarVendedores } from "@/lib/actions/contactos";

interface VarianteConRelaciones {
  id: number;
  activa: boolean;
  createdAt: Date;
  productoId: number;
  colorId: number;
  tallaId: number;
  sku: string;
  precioOverride: number | null;
  color: { id: number; nombre: string; hex: string | null };
  talla: { id: number; valor: string; orden: number };
}

interface ProductoPOS {
  id: number;
  referencia: string;
  nombre: string;
  descripcion: string | null;
  categoriaId: number;
  marcaId: number | null;
  genero: "DAMA" | "CABALLERO" | "NINO" | "UNISEX" | null;
  material: string | null;
  calidad: "PREMIUM" | "ALTA" | "ESTANDAR" | "ECONOMICA" | null;
  temporada: string | null;
  costo: number;
  precioBase: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
  variantes: ({
    id: number;
    activa: boolean;
    createdAt: Date;
    productoId: number;
    colorId: number;
    tallaId: number;
    sku: string;
    precioOverride: number | null;
    color: { id: number; nombre: string; hex: string | null };
    talla: { id: number; valor: string; orden: number };
    stocks: { cantidad: number }[];
    producto: { nombre: string; costo: number; precioBase: number };
  })[];
}

interface ItemCarrito {
  varianteId: number;
  sku: string;
  nombre: string;
  color: string;
  talla: string;
  precio: number;
  costo: number;
  stock: number;
  cantidad: number;
  descuento: number;
}

interface ClienteRapido {
  id: number;
  nombre: string;
  tipoDoc: string;
  documento: string | null;
  telefono: string | null;
  cupoCredito: number;
  diasCredito: number;
}

export default function VentaClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  // Estado del carrito
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [cliente, setCliente] = useState<ClienteRapido | null>(null);
  const [vendedorId, setVendedorId] = useState<number | null>(null);
  const [tipoVenta, setTipoVenta] = useState<"VENTA" | "REMISION" | "COTIZACION">("VENTA");
  const [descuentoGlobal, setDescuentoGlobal] = useState(0);
  const [nota, setNota] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ProductoPOS[]>([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [baseInicial, setBaseInicial] = useState("0");
  const [mostrarAbrirCaja, setMostrarAbrirCaja] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [abrirClienteModal, setAbrirClienteModal] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", telefono: "", documento: "", tipoDoc: "CC" as const });
  const [clientes, setClientes] = useState<ClienteRapido[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);

  // Totales
  const subtotal = useMemo(() => carrito.reduce((a, i) => a + i.cantidad * i.precio - i.descuento, 0), [carrito]);
  const total = subtotal - descuentoGlobal;
  const totalItems = carrito.reduce((a, i) => a + i.cantidad, 0);

  // Verificar caja al montar
  useEffect(() => {
    verificarCaja();
    listarClientes(true).then(setClientes);
    listarVendedores(true).then(setVendedores);
  }, []);

  async function verificarCaja() {
    const sesion = await obtenerSesionAbierta();
    setCajaAbierta(!!sesion);
  }

  // Buscar productos con debounce
  const debounceRef = useRef<NodeJS.Timeout>();
  const handleBusqueda = (value: string) => {
    setBusqueda(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value || value.length < 2) { setResultados([]); return; }
    debounceRef.current = setTimeout(async () => {
      setCargandoProductos(true);
      try {
        // Obtener bodega de la sesión abierta
        const sesion = await obtenerSesionAbierta();
        const bodegaId = sesion?.bodegaId ?? 1;
        const res = await buscarProductosPOS(value, bodegaId) as ProductoPOS[];
        setResultados(res);
      } catch {
        setResultados([]);
      } finally {
        setCargandoProductos(false);
      }
    }, 250);
  };

  function agregarAlCarrito(v: {
    id: number;
    activa: boolean;
    createdAt: Date;
    productoId: number;
    colorId: number;
    tallaId: number;
    sku: string;
    precioOverride: number | null;
    color: { id: number; nombre: string; hex: string | null };
    talla: { id: number; valor: string; orden: number };
    stocks: { cantidad: number }[];
    producto: { nombre: string; costo: number; precioBase: number };
  }) {
    const stock = v.stocks[0]?.cantidad ?? 0;
    if (stock <= 0) { setError("Sin stock disponible"); return; }
    setCarrito((prev) => {
      const existe = prev.find((i) => i.varianteId === v.id);
      if (existe) {
        if (existe.cantidad >= stock) { setError("Stock máximo alcanzado"); return prev; }
        return prev.map((i) => i.varianteId === v.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, {
        varianteId: v.id,
        sku: v.sku,
        nombre: v.producto.nombre,
        color: v.color.nombre,
        talla: v.talla.valor,
        precio: v.precioOverride ?? v.producto.precioBase,
        costo: v.producto.costo,
        stock,
        cantidad: 1,
        descuento: 0,
      }];
    });
    setBusqueda("");
    setResultados([]);
  }

  function actualizarCantidad(varianteId: number, delta: number) {
    setCarrito((prev) =>
      prev.map((i) => {
        if (i.varianteId !== varianteId) return i;
        const nueva = Math.max(1, Math.min(i.stock, i.cantidad + delta));
        return { ...i, cantidad: nueva };
      })
    );
  }

  function eliminarDelCarrito(varianteId: number) {
    setCarrito((prev) => prev.filter((i) => i.varianteId !== varianteId));
  }

  function actualizarDescuentoItem(varianteId: number, descuento: number) {
    setCarrito((prev) =>
      prev.map((i) => i.varianteId === varianteId ? { ...i, descuento: Math.max(0, Math.min(i.cantidad * i.precio, descuento)) } : i)
    );
  }

  async function procesarVenta() {
    if (carrito.length === 0) { setError("El carrito está vacío"); return; }
    if (!cajaAbierta && tipoVenta !== "COTIZACION") { setError("Debe abrir caja para vender"); return; }

    const sesion = await obtenerSesionAbierta();
    const bodegaId = sesion?.bodegaId ?? 1;

    const items = carrito.map((i) => ({
      varianteId: i.varianteId,
      cantidad: i.cantidad,
      precioUnitario: i.precio,
      costoUnitario: i.costo,
      descuento: i.descuento,
    }));

    const res = await registrarVenta({
      tipo: tipoVenta,
      clienteId: cliente?.id ?? null,
      vendedorId: vendedorId,
      bodegaId,
      items,
      pagos: [], // pagos se manejan aparte en UI completa; aquí asumimos contado simple
      descuento: descuentoGlobal,
      nota,
    });

    if (!res.ok) return setError(res.error);

    setExito(`✅ ${res.data.codigo} registrada correctamente`);
    setCarrito([]);
    setCliente(null);
    setDescuentoGlobal(0);
    setNota("");
    setTimeout(() => setExito(null), 4000);
    startTransition(() => router.refresh());
  }

  // Pagos rápidos (solo para referencia, no se guardan aquí)
  const pagos = [
    { metodo: "EFECTIVO", label: "Efectivo", icon: DollarSign },
    { metodo: "TRANSFERENCIA", label: "Transferencia", icon: CreditCard },
    { metodo: "TARJETA", label: "Tarjeta", icon: CreditCard },
    { metodo: "PUNTOS", label: "Puntos", icon: Package },
    { metodo: "OTRO", label: "Otro", icon: HelpCircle },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header compacto */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-900">Nueva venta</h1>
          <div className="w-36">
            <Select value={tipoVenta} onValueChange={(v) => setTipoVenta(v as any)}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="VENTA">Venta</SelectItem>
                <SelectItem value="REMISION">Remisión</SelectItem>
                <SelectItem value="COTIZACION">Cotización</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Estado caja */}
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cajaAbierta ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
            {cajaAbierta ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            {cajaAbierta ? "Caja abierta" : "Caja cerrada"}
          </span>
          {!cajaAbierta && (
            <Button variant="outline" size="sm" onClick={() => setMostrarAbrirCaja(true)}>
              <Building2 className="h-3.5 w-3.5" /> Abrir caja
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Columna izquierda: búsqueda + resultados */}
        <div className="w-96 border-r border-slate-200 bg-slate-50/30 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-200">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={busqueda}
                onChange={(e) => handleBusqueda(e.target.value)}
                placeholder="Buscar por SKU, referencia, nombre…"
                className="pl-9 h-9"
                autoFocus
              />
              {cargandoProductos && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500 animate-spin" />}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {resultados.length === 0 && !busqueda ? (
              <EmptyState icon={Barcode} title="Buscar producto" description="Escribe referencia, SKU o nombre" className="py-12" />
            ) : resultados.length === 0 && busqueda ? (
              <EmptyState icon={Search} title="Sin resultados" description="Prueba con otros términos" className="py-12" />
            ) : (
              <div className="space-y-2">
                {resultados.map((p) => (
                  <ProductoPOSCard key={p.id} producto={p} onAgregar={agregarAlCarrito} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna central: carrito */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Carrito ({totalItems})</h2>
            {carrito.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => { if (confirm("¿Vaciar carrito?")) setCarrito([]); }}>
                <Trash2 className="h-4 w-4" /> Vaciar
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {carrito.length === 0 ? (
              <EmptyState icon={ShoppingCart} title="Carrito vacío" description="Busca y agrega productos" className="py-16" />
            ) : (
              <div className="space-y-2">
                {carrito.map((item, idx) => (
                  <CarritoItemRow
                    key={item.varianteId}
                    item={item}
                    index={idx}
                    onCantidadChange={(delta) => actualizarCantidad(item.varianteId, delta)}
                    onDescuentoChange={(d) => actualizarDescuentoItem(item.varianteId, d)}
                    onEliminar={() => eliminarDelCarrito(item.varianteId)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Totales y pagos */}
          <div className="border-t border-slate-200 bg-white p-3 space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="sm:col-span-2 flex items-center justify-between gap-2">
                <label className="text-sm font-medium text-slate-600">Descuento global</label>
                <Input type="number" min={0} max={subtotal} value={descuentoGlobal} onChange={(e) => setDescuentoGlobal(Math.min(subtotal, Number(e.target.value) || 0))} className="w-32 text-right" />
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatoCOP(subtotal)}</span></div>
              {descuentoGlobal > 0 && <div className="flex justify-between text-sm text-red-500"><span>Descuento</span><span>−{formatoCOP(descuentoGlobal)}</span></div>}
              <div className="flex justify-between text-lg font-bold text-slate-900 border-t border-slate-200 pt-2"><span>TOTAL</span><span>{formatoCOP(total)}</span></div>
            </div>

            {/* Métodos de pago rápidos */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Pagos (referencia)</label>
              <div className="flex flex-wrap gap-2">
                {pagos.map((p) => (
                  <Button key={p.metodo} variant="outline" size="sm" className="flex-1 min-w-[100px]">
                    <p.icon className="h-3.5 w-3.5" /> {p.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={procesarVenta} disabled={pending || carrito.length === 0 || (!cajaAbierta && tipoVenta !== "COTIZACION")} className="flex-1 h-12 text-lg">
                {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} {tipoVenta === "COTIZACION" ? "Guardar cotización" : tipoVenta === "REMISION" ? "Crear remisión" : "Cobrar y vender"}
              </Button>
              <Button variant="outline" onClick={() => { if (confirm("¿Imprimir ticket?")) window.print(); }} disabled={carrito.length === 0}>
                <Printer className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Columna derecha: cliente, vendedor, nota */}
        <div className="w-80 border-l border-slate-200 bg-slate-50/30 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-white">
            <h3 className="font-semibold text-slate-800 mb-2">Datos de la venta</h3>
            <div className="space-y-3">
              {/* Cliente */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Cliente</label>
                <div className="flex gap-1">
                  <Select value={cliente ? String(cliente.id) : ""} onValueChange={(v) => {
                    if (!v) { setCliente(null); return; }
                    listarClientes(true).then((clientes) => {
                      const cli = clientes.find((c) => c.id === Number(v));
                      if (cli) setCliente(cli);
                    });
                  }}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar cliente…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin cliente</SelectItem>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.nombre} {c.documento ? `(${c.tipoDoc} ${c.documento})` : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="outline" onClick={() => { setNuevoCliente({ nombre: "", telefono: "", documento: "", tipoDoc: "CC" }); setAbrirClienteModal(true); }} aria-label="Nuevo cliente rápido">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
                {cliente && <p className="mt-1 text-xs text-slate-500">{cliente.nombre} · Cupo: {formatoCOP(cliente.cupoCredito)} · {cliente.diasCredito}d</p>}
              </div>

              {/* Vendedor */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Vendedor</label>
                <Select value={vendedorId ? String(vendedorId) : ""} onValueChange={(v) => setVendedorId(v ? Number(v) : null)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Sin vendedor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin vendedor</SelectItem>
                    {vendedores.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>{v.nombre} ({v.comisionPct}%)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Nota */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nota</label>
                <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2} maxLength={300} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" placeholder="Observaciones…" />
              </div>
            </div>
          </div>

          <div className="flex-1" />
        </div>
      </div>

      {/* Modales */}
      <Dialog open={mostrarAbrirCaja} onOpenChange={setMostrarAbrirCaja}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir caja</DialogTitle>
            <DialogDescription>Ingresa la base inicial de efectivo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => { e.preventDefault(); const res = await abrirCaja({ baseInicial: Number(baseInicial) || 0 }); if (res.ok) { setMostrarAbrirCaja(false); setCajaAbierta(true); setBaseInicial("0"); } else setError(res.error); }} className="grid gap-3">
            <label className="grid gap-1"><span className="text-xs font-semibold text-slate-600">Base inicial (COP)</span><Input type="number" min={0} value={baseInicial} onChange={(e) => setBaseInicial(e.target.value)} /></label>
            {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMostrarAbrirCaja(false)}>Cancelar</Button>
              <Button type="submit" disabled={pending}>Abrir caja</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={abrirClienteModal} onOpenChange={setAbrirClienteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo cliente rápido</DialogTitle>
            <DialogDescription>Solo datos esenciales para facturar.</DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => { e.preventDefault(); const res = await guardarCliente(nuevoCliente); if (res.ok) { setAbrirClienteModal(false); const cli = (await listarClientes(true)).find((c) => c.id === res.data.id); if (cli) setCliente(cli); } else setError(res.error); }} className="grid gap-3">
            <label className="grid gap-1"><span className="text-xs font-semibold text-slate-600">Nombre *</span><Input value={nuevoCliente.nombre} onChange={(e) => setNuevoCliente({...nuevoCliente, nombre: e.target.value})} required minLength={2} maxLength={80} /></label>
            <div className="grid gap-1 sm:grid-cols-2">
              <label className="grid gap-1"><span className="text-xs font-semibold text-slate-600">Tipo doc</span><Select value={nuevoCliente.tipoDoc} onValueChange={(v) => setNuevoCliente({...nuevoCliente, tipoDoc: v as any})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CC">CC</SelectItem><SelectItem value="NIT">NIT</SelectItem><SelectItem value="OTRO">Otro</SelectItem></SelectContent></Select></label>
              <label className="grid gap-1"><span className="text-xs font-semibold text-slate-600">Documento</span><Input value={nuevoCliente.documento} onChange={(e) => setNuevoCliente({...nuevoCliente, documento: e.target.value})} maxLength={20} /></label>
            </div>
            <label className="grid gap-1"><span className="text-xs font-semibold text-slate-600">Teléfono</span><Input value={nuevoCliente.telefono} onChange={(e) => setNuevoCliente({...nuevoCliente, telefono: e.target.value})} maxLength={20} placeholder="300 123 4567" /></label>
            {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAbrirClienteModal(false)}>Cancelar</Button>
              <Button type="submit" disabled={pending}>Crear y seleccionar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {error && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-in">
          <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <Button variant="ghost" size="icon" onClick={() => setError(null)}><X className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
      {exito && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-in">
          <div className="bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-sm">
            <Check className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{exito}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Componentes internos ─────────────────────────

function ProductoPOSCard({ producto, onAgregar }: { 
  producto: ProductoPOS; 
  onAgregar: (v: {
    id: number;
    activa: boolean;
    createdAt: Date;
    productoId: number;
    colorId: number;
    tallaId: number;
    sku: string;
    precioOverride: number | null;
    color: { id: number; nombre: string; hex: string | null };
    talla: { id: number; valor: string; orden: number };
    stocks: { cantidad: number }[];
    producto: { nombre: string; costo: number; precioBase: number };
  }) => void }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-brand-300 hover:shadow-sm">
      <p className="font-medium text-slate-800 truncate">{producto.nombre}</p>
      <p className="font-mono text-[11px] text-slate-400">{producto.referencia}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {producto.variantes
          .filter((v) => (v.stocks[0]?.cantidad ?? 0) > 0)
          .slice(0, 6)
          .map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onAgregar(v)}
              className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] hover:bg-brand-50 hover:border-brand-300 transition-colors"
            >
              <span className="font-bold">{v.color.nombre}</span>
              <span className="text-slate-500">/</span>
              <span className="font-mono">{v.talla.valor}</span>
              <span className="text-emerald-600 font-semibold ml-1">×{v.stocks[0]?.cantidad ?? 0}</span>
            </button>
          ))}
        {producto.variantes.filter((v) => (v.stocks[0]?.cantidad ?? 0) > 0).length > 6 && (
          <span className="text-[11px] text-slate-400 px-1">+{producto.variantes.filter((v) => (v.stocks[0]?.cantidad ?? 0) > 0).length - 6} más</span>
        )}
      </div>
    </div>
  );
}

function CarritoItemRow({
  item,
  index,
  onCantidadChange,
  onDescuentoChange,
  onEliminar,
}: {
  item: ItemCarrito;
  index: number;
  onCantidadChange: (delta: number) => void;
  onDescuentoChange: (d: number) => void;
  onEliminar: () => void;
}) {
  const subtotal = item.cantidad * item.precio - item.descuento;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 truncate">{item.nombre}</p>
          <p className="font-mono text-[11px] text-slate-400">{item.sku} · {item.color} / T.{item.talla}</p>
        </div>
        <Button size="icon" variant="ghost" onClick={onEliminar} aria-label="Eliminar"><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
      <div className="mt-2 grid grid-cols-5 gap-2 items-center">
        <div className="flex items-center gap-1">
          <Button size="icon" variant="outline" onClick={() => onCantidadChange(-1)} disabled={item.cantidad <= 1}><Minus className="h-3.5 w-3.5" /></Button>
          <span className="w-10 text-center font-bold text-slate-800">{item.cantidad}</span>
          <Button size="icon" variant="outline" onClick={() => onCantidadChange(1)} disabled={item.cantidad >= item.stock}><Plus className="h-3.5 w-3.5" /></Button>
        </div>
        <div>
          <label className="block text-[10px] text-slate-400">Precio</label>
          <Input type="number" min={0} step={100} value={item.precio} onChange={(e) => { /* TODO: actualizar precio */ }} className="h-7 text-right text-xs" />
        </div>
        <div>
          <label className="block text-[10px] text-slate-400">Desc.</label>
          <Input type="number" min={0} max={item.cantidad * item.precio} value={item.descuento} onChange={(e) => onDescuentoChange(Number(e.target.value) || 0)} className="h-7 text-right text-xs" />
        </div>
        <div className="text-right">
          <label className="block text-[10px] text-slate-400">Stock</label>
          <span className="text-xs font-semibold text-slate-600">{item.stock}</span>
        </div>
        <div className="text-right">
          <label className="block text-[10px] text-slate-400">Subtotal</label>
          <span className="font-bold text-slate-900">{formatoCOP(subtotal)}</span>
        </div>
      </div>
    </div>
  );
}