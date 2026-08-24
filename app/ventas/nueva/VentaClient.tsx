"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Barcode,
  Building2,
  Camera,
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
  Sparkles,
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
import { formatoCOP } from "@/lib/format";
import { registrarVenta, buscarProductosPOS, buscarVariantePorSku } from "@/lib/actions/ventas";
import { abrirCaja, obtenerSesionAbierta } from "@/lib/actions/caja";
import { buscarClientesRapido, guardarCliente, listarClientes, listarVendedores } from "@/lib/actions/contactos";
import { obtenerConfiguracion } from "@/lib/actions/configuracion";
import { playScanBeep } from "@/lib/audio";
import CameraScannerModal from "@/components/ventas/CameraScannerModal";
import ModalCobroPOS, { type PagoItem } from "@/components/ventas/ModalCobroPOS";
import TicketVentaModal, { type VentaImpresionData } from "@/components/ventas/TicketVentaModal";

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
  const [pending, startTransition] = useTransition();

  // Estado del carrito y venta
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
  const [bodegaActualId, setBodegaActualId] = useState<number>(1);
  const [baseInicial, setBaseInicial] = useState("0");
  const [mostrarAbrirCaja, setMostrarAbrirCaja] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  // Modales
  const [abrirClienteModal, setAbrirClienteModal] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    telefono: "",
    documento: "",
    tipoDoc: "CC" as const,
    cupoCredito: 0,
  });
  const [clientes, setClientes] = useState<ClienteRapido[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [configTienda, setConfigTienda] = useState<any>(null);

  // Escáner Cámara y Modal Cobro
  const [abrirEscanerCamara, setAbrirEscanerCamara] = useState(false);
  const [abrirModalCobro, setAbrirModalCobro] = useState(false);
  const [ventaParaImprimir, setVentaParaImprimir] = useState<VentaImpresionData | null>(null);
  const [abrirTicketModal, setAbrirTicketModal] = useState(false);

  const inputBusquedaRef = useRef<HTMLInputElement>(null);

  // Totales
  const subtotal = useMemo(() => carrito.reduce((a, i) => a + i.cantidad * i.precio - i.descuento, 0), [carrito]);
  const total = Math.max(0, subtotal - descuentoGlobal);
  const totalItems = carrito.reduce((a, i) => a + i.cantidad, 0);

  // Carga inicial
  useEffect(() => {
    verificarCaja();
    listarClientes(true).then(setClientes);
    listarVendedores(true).then(setVendedores);
    obtenerConfiguracion().then(setConfigTienda);
  }, []);

  async function verificarCaja() {
    const sesion = await obtenerSesionAbierta();
    setCajaAbierta(!!sesion);
    if (sesion?.bodegaId) {
      setBodegaActualId(sesion.bodegaId);
    }
  }

  // Auto-focus en el buscador para pistolas lectoras
  const enfocarBuscador = () => {
    inputBusquedaRef.current?.focus();
  };

  // Buscar productos con debounce
  const debounceRef = useRef<NodeJS.Timeout>();
  const handleBusqueda = (value: string) => {
    setBusqueda(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value || value.length < 2) {
      setResultados([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setCargandoProductos(true);
      try {
        const res = (await buscarProductosPOS(value, bodegaActualId)) as ProductoPOS[];
        setResultados(res);
      } catch {
        setResultados([]);
      } finally {
        setCargandoProductos(false);
      }
    }, 200);
  };

  // Manejador directo de escaneo (Cámara o Pistola USB)
  const handleEscanearCodigo = async (codigo: string): Promise<boolean> => {
    if (!codigo) return false;
    const cleanCode = codigo.trim();

    try {
      const variante = await buscarVariantePorSku(cleanCode, bodegaActualId);
      if (variante) {
        const stock = variante.stocks[0]?.cantidad ?? 0;
        if (stock <= 0) {
          setError(`Prenda sin stock disponible en bodega (${variante.sku})`);
          return false;
        }

        setCarrito((prev) => {
          const existe = prev.find((i) => i.varianteId === variante.id);
          if (existe) {
            if (existe.cantidad >= stock) {
              setError(`Stock máximo alcanzado para ${variante.sku}`);
              return prev;
            }
            return prev.map((i) =>
              i.varianteId === variante.id ? { ...i, cantidad: i.cantidad + 1 } : i
            );
          }
          return [
            ...prev,
            {
              varianteId: variante.id,
              sku: variante.sku,
              nombre: variante.producto.nombre,
              color: variante.color.nombre,
              talla: variante.talla.valor,
              precio: variante.precioOverride ?? variante.producto.precioBase,
              costo: variante.producto.costo,
              stock,
              cantidad: 1,
              descuento: 0,
            },
          ];
        });

        setBusqueda("");
        setResultados([]);
        setError(null);
        setExito(`+1 ${variante.producto.nombre} (${variante.talla.valor} - ${variante.color.nombre})`);
        setTimeout(() => setExito(null), 2500);
        return true;
      } else {
        // Buscar por si es nombre/referencia parcial
        handleBusqueda(cleanCode);
        return false;
      }
    } catch {
      return false;
    }
  };

  function agregarAlCarrito(v: any, prod?: any) {
    const p = prod || v.producto;
    const stock = Array.isArray(v.stocks) && v.stocks.length > 0
      ? v.stocks.reduce((acc: number, s: any) => acc + (s?.cantidad || 0), 0)
      : (typeof v.stock === "number" ? v.stock : 999);

    if (stock <= 0) {
      setError(`Sin stock disponible para esta talla/color (${v.sku || "prenda"})`);
      playScanBeep(false);
      return;
    }

    const nombre = p?.nombre || v.producto?.nombre || v.nombre || "Prenda";
    const color = v.color?.nombre || (typeof v.color === "string" ? v.color : "Único");
    const talla = v.talla?.valor || (typeof v.talla === "string" ? v.talla : "U");
    const precio = v.precioOverride ?? p?.precioBase ?? v.producto?.precioBase ?? v.precio ?? 0;
    const costo = p?.costo ?? v.producto?.costo ?? v.costo ?? 0;

    setCarrito((prev) => {
      const existe = prev.find((i) => i.varianteId === v.id);
      if (existe) {
        if (existe.cantidad >= stock && stock < 999) {
          setError(`Stock máximo disponible alcanzado (${stock} unidades)`);
          playScanBeep(false);
          return prev;
        }
        playScanBeep(true);
        return prev.map((i) =>
          i.varianteId === v.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      playScanBeep(true);
      return [
        ...prev,
        {
          varianteId: v.id,
          sku: v.sku || `VAR-${v.id}`,
          nombre,
          color,
          talla,
          precio,
          costo,
          stock,
          cantidad: 1,
          descuento: 0,
        },
      ];
    });

    setError(null);
    setBusqueda("");
    setResultados([]);
    enfocarBuscador();
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
      prev.map((i) =>
        i.varianteId === varianteId
          ? { ...i, descuento: Math.max(0, Math.min(i.cantidad * i.precio, descuento)) }
          : i
      )
    );
  }

  // Iniciar flujo de cobro
  function iniciarCobro() {
    if (carrito.length === 0) {
      setError("El carrito está vacío");
      return;
    }
    if (!cajaAbierta && tipoVenta !== "COTIZACION") {
      setError("Debe abrir caja antes de realizar ventas");
      setMostrarAbrirCaja(true);
      return;
    }

    if (tipoVenta === "COTIZACION") {
      // Cotizaciones no requieren pago
      confirmarVentaDirecta([], 0, 0);
    } else {
      setAbrirModalCobro(true);
    }
  }

  // Confirmación de Venta con Pagos
  async function confirmarVentaDirecta(
    pagos: PagoItem[],
    recibidoEfectivo: number,
    cambioEfectivo: number
  ) {
    setError(null);
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
      bodegaId: bodegaActualId,
      items,
      pagos,
      descuento: descuentoGlobal,
      nota,
    });

    if (!res.ok) {
      setError(res.error);
      playScanBeep(false);
      return;
    }

    setAbrirModalCobro(false);

    // Preparar datos de tirilla térmica 80mm
    const datosTicket: VentaImpresionData = {
      consecutivo: res.data.consecutivo,
      tipo: tipoVenta,
      codigo: res.data.codigo,
      fecha: new Date(),
      tiendaNombre: configTienda?.nombreTienda || "KAOB POS",
      nit: configTienda?.nit || "900.123.456-7",
      direccion: configTienda?.direccion || "Dirección Principal",
      telefono: configTienda?.telefono || "3000000000",
      ciudad: configTienda?.ciudad || "Bogotá",
      regimen: configTienda?.regimen || "Responsable de IVA",
      mensajeTicket: configTienda?.mensajeTicket || "¡Gracias por su compra!",
      pieTicket: configTienda?.pieTicket || "Conserve este ticket para cambios o garantías.",
      clienteNombre: cliente?.nombre || "CLIENTE GENERAL",
      clienteDoc: cliente?.documento || undefined,
      vendedorNombre: vendedores.find((v) => v.id === vendedorId)?.nombre || undefined,
      items: carrito.map((c) => ({
        nombre: c.nombre,
        color: c.color,
        talla: c.talla,
        cantidad: c.cantidad,
        precio: c.precio,
        subtotal: c.cantidad * c.precio - c.descuento,
      })),
      subtotal,
      descuento: descuentoGlobal,
      total,
      pagos,
      recibido: recibidoEfectivo,
      cambio: cambioEfectivo,
    };

    setVentaParaImprimir(datosTicket);
    setAbrirTicketModal(true);

    // Limpiar carrito
    setCarrito([]);
    setCliente(null);
    setDescuentoGlobal(0);
    setNota("");
    setExito(`✅ ${res.data.codigo} registrada exitosamente`);
    setTimeout(() => setExito(null), 4000);
    startTransition(() => router.refresh());
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-100 dark:bg-slate-950">
      {/* Header Compacto POS */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white">Terminal POS</h1>
          </div>

          <div className="w-36">
            <Select value={tipoVenta} onValueChange={(v) => setTipoVenta(v as any)}>
              <SelectTrigger className="h-8 text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VENTA">Venta Directa</SelectItem>
                <SelectItem value="REMISION">Remisión</SelectItem>
                <SelectItem value="COTIZACION">Cotización</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Estado Caja y Acciones */}
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              cajaAbierta
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-800"
            }`}
          >
            {cajaAbierta ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
            {cajaAbierta ? "Caja Abierta" : "Caja Cerrada"}
          </span>

          {!cajaAbierta && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setMostrarAbrirCaja(true)}
              className="h-8 text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            >
              <Building2 className="h-3.5 w-3.5" /> Abrir Turno de Caja
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Columna Izquierda: Buscador + Escáner + Catálogo */}
        <div className="w-96 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex flex-col overflow-hidden">
          {/* Barra de Búsqueda con Botón de Cámara */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  ref={inputBusquedaRef}
                  value={busqueda}
                  onChange={(e) => handleBusqueda(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && busqueda.trim()) {
                      e.preventDefault();
                      handleEscanearCodigo(busqueda);
                    }
                  }}
                  placeholder="Escanear código o buscar prenda..."
                  className="pl-9 pr-8 h-10 text-sm font-medium rounded-xl"
                  autoFocus
                />
                {cargandoProductos && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500 animate-spin" />
                )}
              </div>

              {/* Botón de Escaneo con Cámara de Celular */}
              <Button
                variant="primary"
                onClick={() => setAbrirEscanerCamara(true)}
                className="h-10 px-3 flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 text-white shrink-0"
                title="Escanear código de barras con la cámara del celular"
              >
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline text-xs font-bold">Cámara</span>
              </Button>
            </div>

            <p className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>💡 Presiona Enter o usa la pistola lectora</span>
              <span className="font-mono text-blue-500 font-semibold">Bodega #{bodegaActualId}</span>
            </p>
          </div>

          {/* Resultados de búsqueda */}
          <div className="flex-1 overflow-y-auto p-3">
            {resultados.length === 0 && !busqueda ? (
              <div className="py-16 text-center space-y-2 text-slate-400">
                <Barcode className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="font-semibold text-sm text-slate-600 dark:text-slate-400">
                  Listo para escanear
                </p>
                <p className="text-xs max-w-xs mx-auto">
                  Enfoca el código de barras con la cámara o pistola para agregar prendas al instante.
                </p>
              </div>
            ) : resultados.length === 0 && busqueda ? (
              <EmptyState
                icon={Search}
                title="Sin resultados"
                description="No se encontraron prendas con esa referencia o código"
                className="py-12"
              />
            ) : (
              <div className="space-y-2.5">
                {resultados.map((p) => (
                  <ProductoPOSCard
                    key={p.id}
                    producto={p}
                    onAgregar={(v) => agregarAlCarrito(v, p)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna Central: Carrito de Compras */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Artículos en Carrito
              </h2>
              <Badge variant="info" className="text-xs font-bold">
                {totalItems} {totalItems === 1 ? "prenda" : "prendas"}
              </Badge>
            </div>
            {carrito.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm("¿Vaciar todo el carrito?")) setCarrito([]);
                }}
                className="h-8 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Vaciar Carrito
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {carrito.length === 0 ? (
              <div className="py-20 text-center space-y-3 text-slate-400">
                <ShoppingCart className="h-16 w-16 mx-auto text-slate-200 dark:text-slate-800" />
                <p className="font-bold text-base text-slate-700 dark:text-slate-300">
                  El carrito está vacío
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Escanea etiquetas de prendas o búscalas en el panel izquierdo para agregarlas.
                </p>
              </div>
            ) : (
              carrito.map((item, idx) => (
                <CarritoItemRow
                  key={item.varianteId}
                  item={item}
                  index={idx}
                  onCantidadChange={(delta) => actualizarCantidad(item.varianteId, delta)}
                  onDescuentoChange={(d) => actualizarDescuentoItem(item.varianteId, d)}
                  onEliminar={() => eliminarDelCarrito(item.varianteId)}
                />
              ))
            )}
          </div>

          {/* Totales y Botón de Cobro Destacado */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatoCOP(subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  Descuento Global:
                </label>
                <div className="relative w-28">
                  <span className="absolute left-2 top-1.5 text-xs text-slate-400">$</span>
                  <Input
                    type="number"
                    min={0}
                    max={subtotal}
                    value={descuentoGlobal || ""}
                    onChange={(e) =>
                      setDescuentoGlobal(Math.min(subtotal, Number(e.target.value) || 0))
                    }
                    placeholder="0"
                    className="h-7 pl-5 pr-2 text-right text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Total Destacado */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shadow-lg">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-indigo-300 font-bold block">
                  Total a Pagar
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {formatoCOP(total)}
                </span>
              </div>

              <Button
                onClick={iniciarCobro}
                disabled={
                  pending || carrito.length === 0 || (!cajaAbierta && tipoVenta !== "COTIZACION")
                }
                className="h-12 px-6 text-base font-extrabold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 rounded-xl"
              >
                <DollarSign className="h-5 w-5 mr-1" />
                {tipoVenta === "COTIZACION" ? "Guardar Cotización" : "COBRAR (F4)"}
              </Button>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Cliente, Vendedor y Resumen */}
        <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Datos de Facturación
            </h3>

            {/* Cliente */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cliente
              </label>
              <div className="flex gap-1.5">
                <Select
                  value={cliente ? String(cliente.id) : ""}
                  onValueChange={(v) => {
                    if (!v) {
                      setCliente(null);
                      return;
                    }
                    const cli = clientes.find((c) => c.id === Number(v));
                    if (cli) setCliente(cli);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Cliente General (Mostrador)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Cliente General (Sin registrar)</SelectItem>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nombre} {c.documento ? `(${c.documento})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    setNuevoCliente({
                      nombre: "",
                      telefono: "",
                      documento: "",
                      tipoDoc: "CC",
                      cupoCredito: 0,
                    });
                    setAbrirClienteModal(true);
                  }}
                  className="h-9 w-9 shrink-0 text-blue-600 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                  title="Crear cliente rápido"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>

              {cliente && (
                <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] space-y-0.5">
                  <p className="font-bold text-blue-950 dark:text-blue-200">{cliente.nombre}</p>
                  <p className="text-blue-700 dark:text-blue-400">
                    Cupo Crédito: <strong>{formatoCOP(cliente.cupoCredito)}</strong> ({cliente.diasCredito} días)
                  </p>
                </div>
              )}
            </div>

            {/* Vendedor */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Vendedor / Asesor
              </label>
              <Select
                value={vendedorId ? String(vendedorId) : ""}
                onValueChange={(v) => setVendedorId(v ? Number(v) : null)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Seleccionar vendedor..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin comisión / General</SelectItem>
                  {vendedores.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.nombre} ({v.comisionPct}% comisión)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nota */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Observaciones del Ticket
              </label>
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                rows={2}
                maxLength={300}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                placeholder="Ej. Prenda separada con apartado, cliente VIP..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Escáner Cámara Celular */}
      <CameraScannerModal
        open={abrirEscanerCamara}
        onClose={() => {
          setAbrirEscanerCamara(false);
          enfocarBuscador();
        }}
        onScan={handleEscanearCodigo}
      />

      {/* Modal: Cobro POS con Billetes y Cambio */}
      <ModalCobroPOS
        open={abrirModalCobro}
        onClose={() => setAbrirModalCobro(false)}
        totalVenta={total}
        onConfirmarVenta={confirmarVentaDirecta}
        cargando={pending}
        clienteNombre={cliente?.nombre}
        cupoCredito={cliente?.cupoCredito}
      />

      {/* Modal: Ticket Térmico 80mm */}
      <TicketVentaModal
        open={abrirTicketModal}
        onClose={() => {
          setAbrirTicketModal(false);
          setVentaParaImprimir(null);
          enfocarBuscador();
        }}
        venta={ventaParaImprimir}
      />

      {/* Modal: Abrir Caja */}
      <Dialog open={mostrarAbrirCaja} onOpenChange={setMostrarAbrirCaja}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              Apertura de Turno de Caja
            </DialogTitle>
            <DialogDescription>
              Ingresa el monto de base inicial en efectivo para iniciar las ventas del día.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await abrirCaja({
                baseInicial: Number(baseInicial) || 0,
                bodegaId: bodegaActualId,
              });
              if (res.ok) {
                setMostrarAbrirCaja(false);
                setCajaAbierta(true);
                setBaseInicial("0");
                setExito("Caja abierta exitosamente");
                setTimeout(() => setExito(null), 3000);
              } else {
                setError(res.error);
              }
            }}
            className="space-y-4 py-2"
          >
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Base Inicial de Efectivo (COP)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-slate-400 font-bold">$</span>
                <Input
                  type="number"
                  min={0}
                  step={5000}
                  value={baseInicial}
                  onChange={(e) => setBaseInicial(e.target.value)}
                  className="pl-8 text-lg font-bold"
                  autoFocus
                />
              </div>
            </div>

            {error && <p className="text-xs font-semibold text-red-500">{error}</p>}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMostrarAbrirCaja(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={pending} className="bg-emerald-600 hover:bg-emerald-700">
                Iniciar Turno
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Crear Cliente Rápido */}
      <Dialog open={abrirClienteModal} onOpenChange={setAbrirClienteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Nuevo Cliente Rápido
            </DialogTitle>
            <DialogDescription>
              Registra los datos básicos del cliente sin perder los artículos del carrito.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await guardarCliente(nuevoCliente);
              if (res.ok) {
                setAbrirClienteModal(false);
                const listaActualizada = await listarClientes(true);
                setClientes(listaActualizada);
                const cli = listaActualizada.find((c) => c.id === res.data.id);
                if (cli) setCliente(cli);
              } else {
                setError(res.error);
              }
            }}
            className="space-y-3 py-2"
          >
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Nombre Completo *
              </label>
              <Input
                value={nuevoCliente.nombre}
                onChange={(e) =>
                  setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })
                }
                placeholder="Ej. Juan Pérez"
                required
                minLength={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Tipo
                </label>
                <Select
                  value={nuevoCliente.tipoDoc}
                  onValueChange={(v) =>
                    setNuevoCliente({ ...nuevoCliente, tipoDoc: v as any })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC">CC</SelectItem>
                    <SelectItem value="NIT">NIT</SelectItem>
                    <SelectItem value="OTRO">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  N° Documento
                </label>
                <Input
                  value={nuevoCliente.documento}
                  onChange={(e) =>
                    setNuevoCliente({ ...nuevoCliente, documento: e.target.value })
                  }
                  placeholder="1020304050"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Teléfono / WhatsApp
              </label>
              <Input
                value={nuevoCliente.telefono}
                onChange={(e) =>
                  setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })
                }
                placeholder="310 123 4567"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Cupo de Crédito Inicial (Opcional)
              </label>
              <Input
                type="number"
                min={0}
                step={50000}
                value={nuevoCliente.cupoCredito || ""}
                onChange={(e) =>
                  setNuevoCliente({
                    ...nuevoCliente,
                    cupoCredito: Number(e.target.value) || 0,
                  })
                }
                placeholder="$0"
              />
            </div>

            {error && <p className="text-xs font-semibold text-red-500">{error}</p>}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAbrirClienteModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={pending}>
                Crear y Seleccionar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alertas Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50 animate-bounce">
          <div className="bg-red-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 max-w-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setError(null)}
              className="text-white hover:bg-red-700 h-6 w-6 ml-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {exito && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
          <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 max-w-sm">
            <Check className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">{exito}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Componentes Internos ─────────────────────────

function ProductoPOSCard({
  producto,
  onAgregar,
}: {
  producto: ProductoPOS;
  onAgregar: (v: any) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 transition-all hover:border-blue-400 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="truncate">
          <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
            {producto.nombre}
          </p>
          <p className="font-mono text-[11px] text-slate-400">Ref: {producto.referencia}</p>
        </div>
        <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
          {formatoCOP(producto.precioBase)}
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {producto.variantes.map((v) => {
          const cantStock = Array.isArray(v.stocks) && v.stocks.length > 0
            ? v.stocks.reduce((a: number, s: any) => a + (s?.cantidad || 0), 0)
            : 0;

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onAgregar(v)}
              className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-all ${
                cantStock > 0
                  ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-400 cursor-pointer"
                  : "border-slate-100 dark:border-slate-800/40 bg-slate-50/50 text-slate-400 opacity-60"
              }`}
            >
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {v.color.nombre}
              </span>
              <span className="text-slate-400">/</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                T.{v.talla.valor}
              </span>
              <span
                className={`font-bold ml-1 ${
                  cantStock > 0 ? "text-emerald-600" : "text-amber-500"
                }`}
              >
                {cantStock > 0 ? `×${cantStock}` : "0 disp."}
              </span>
            </button>
          );
        })}
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
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
            {item.nombre}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-[11px] text-slate-400">{item.sku}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {item.color} • Talla {item.talla}
            </span>
          </div>
        </div>

        <Button
          size="icon"
          variant="ghost"
          onClick={onEliminar}
          className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-5 gap-2 items-center">
        {/* Controles de Cantidad */}
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="outline"
            onClick={() => onCantidadChange(-1)}
            disabled={item.cantidad <= 1}
            className="h-7 w-7"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-8 text-center font-extrabold text-sm text-slate-900 dark:text-white">
            {item.cantidad}
          </span>
          <Button
            size="icon"
            variant="outline"
            onClick={() => onCantidadChange(1)}
            disabled={item.cantidad >= item.stock}
            className="h-7 w-7"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-semibold text-slate-400">Precio</label>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {formatoCOP(item.precio)}
          </span>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-semibold text-slate-400">Desc.</label>
          <Input
            type="number"
            min={0}
            max={item.cantidad * item.precio}
            value={item.descuento || ""}
            onChange={(e) => onDescuentoChange(Number(e.target.value) || 0)}
            placeholder="$0"
            className="h-7 text-right text-xs"
          />
        </div>

        <div className="text-right">
          <label className="block text-[10px] uppercase font-semibold text-slate-400">Stock</label>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {item.stock} disp.
          </span>
        </div>

        <div className="text-right">
          <label className="block text-[10px] uppercase font-semibold text-slate-400">Subtotal</label>
          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
            {formatoCOP(subtotal)}
          </span>
        </div>
      </div>
    </div>
  );
}