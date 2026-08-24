"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Barcode,
  Building2,
  Camera,
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  HelpCircle,
  History,
  Layers,
  Loader2,
  Minus,
  Package,
  PauseCircle,
  PlayCircle,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  Search,
  ShoppingCart,
  Sparkles,
  Tag,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import type { Vendedor } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
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
import { listarCategorias } from "@/lib/actions/catalogos";
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
  categoria?: { id: number; nombre: string };
  marcaId: number | null;
  genero: "DAMA" | "CABALLERO" | "NINO" | "UNISEX" | null;
  material: string | null;
  calidad: "PREMIUM" | "ALTA" | "ESTANDAR" | "ECONOMICA" | null;
  temporada: string | null;
  costo: number;
  precioBase: number;
  activo: boolean;
  variantes: {
    id: number;
    sku: string;
    productoId: number;
    colorId: number;
    tallaId: number;
    precioOverride: number | null;
    activa: boolean;
    color: { id: number; nombre: string; hex: string | null };
    talla: { id: number; valor: string; orden: number };
    stocks: { cantidad: number }[];
  }[];
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

interface CuentaPausada {
  id: string;
  cliente: ClienteRapido | null;
  carrito: ItemCarrito[];
  descuentoGlobal: number;
  nota: string;
  tipoVenta: "VENTA" | "REMISION" | "COTIZACION";
  vendedorId: number | null;
  total: number;
  fecha: Date;
}

const DESCUENTOS_RAPIDOS = [0, 5, 10, 15, 20];

export default function VentaClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Estado del Carrito Actual
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [cliente, setCliente] = useState<ClienteRapido | null>(null);
  const [vendedorId, setVendedorId] = useState<number | null>(null);
  const [tipoVenta, setTipoVenta] = useState<"VENTA" | "REMISION" | "COTIZACION">("VENTA");
  const [descuentoGlobal, setDescuentoGlobal] = useState(0);
  const [descuentoPctSeleccionado, setDescuentoPctSeleccionado] = useState<number>(0);
  const [nota, setNota] = useState("");

  // Búsqueda y Catálogo
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | null>(null);
  const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([]);
  const [productos, setProductos] = useState<ProductoPOS[]>([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);

  // Sesión y Bodega
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [bodegaActualId, setBodegaActualId] = useState<number>(1);
  const [baseInicial, setBaseInicial] = useState("0");
  const [mostrarAbrirCaja, setMostrarAbrirCaja] = useState(false);

  // Cuentas en Espera (Pausadas)
  const [cuentasPausadas, setCuentasPausadas] = useState<CuentaPausada[]>([]);
  const [mostrarModalPausadas, setMostrarModalPausadas] = useState(false);

  // Listados de Referencia
  const [clientes, setClientes] = useState<ClienteRapido[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [configTienda, setConfigTienda] = useState<any>(null);

  // Modales
  const [abrirClienteModal, setAbrirClienteModal] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    telefono: "",
    documento: "",
    tipoDoc: "CC" as const,
    cupoCredito: 0,
  });
  const [abrirEscanerCamara, setAbrirEscanerCamara] = useState(false);
  const [abrirModalCobro, setAbrirModalCobro] = useState(false);
  const [ventaParaImprimir, setVentaParaImprimir] = useState<VentaImpresionData | null>(null);
  const [abrirTicketModal, setAbrirTicketModal] = useState(false);

  // Notificaciones
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const inputBusquedaRef = useRef<HTMLInputElement>(null);

  // Totales Calculados
  const subtotal = useMemo(
    () => carrito.reduce((a, i) => a + i.cantidad * i.precio - i.descuento, 0),
    [carrito]
  );
  const total = Math.max(0, subtotal - descuentoGlobal);
  const totalItems = carrito.reduce((a, i) => a + i.cantidad, 0);

  // Carga inicial
  useEffect(() => {
    verificarCaja();
    listarCategorias().then(setCategorias);
    listarClientes(true).then(setClientes);
    listarVendedores(true).then(setVendedores);
    obtenerConfiguracion().then(setConfigTienda);
    cargarCatalogo();
  }, []);

  async function verificarCaja() {
    const sesion = await obtenerSesionAbierta();
    setCajaAbierta(!!sesion);
    if (sesion?.bodegaId) {
      setBodegaActualId(sesion.bodegaId);
    }
  }

  const cargarCatalogo = async (query = "", catId: number | null = null) => {
    setCargandoProductos(true);
    try {
      const res = (await buscarProductosPOS(
        query,
        bodegaActualId,
        catId ?? undefined
      )) as ProductoPOS[];
      setProductos(res);
    } catch {
      setProductos([]);
    } finally {
      setCargandoProductos(false);
    }
  };

  const enfocarBuscador = () => {
    inputBusquedaRef.current?.focus();
  };

  // Debounce de Búsqueda
  const debounceRef = useRef<NodeJS.Timeout>();
  const handleBusqueda = (val: string) => {
    setBusqueda(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      cargarCatalogo(val, categoriaSeleccionada);
    }, 200);
  };

  const handleSeleccionarCategoria = (catId: number | null) => {
    setCategoriaSeleccionada(catId);
    cargarCatalogo(busqueda, catId);
  };

  // Manejador de Escaneo Barcode (Pistola o Cámara)
  const handleEscanearCodigo = async (codigo: string): Promise<boolean> => {
    if (!codigo) return false;
    const cleanCode = codigo.trim();

    try {
      const variante = await buscarVariantePorSku(cleanCode, bodegaActualId);
      if (variante) {
        const stock = Array.isArray(variante.stocks) && variante.stocks.length > 0
          ? variante.stocks.reduce((acc: number, s: any) => acc + (s?.cantidad || 0), 0)
          : 0;

        if (stock <= 0) {
          setError(`Prenda sin existencias en bodega (${variante.sku})`);
          playScanBeep(false);
          return false;
        }

        agregarAlCarrito(variante, variante.producto);
        setExito(`+1 ${variante.producto.nombre} (${variante.talla.valor} - ${variante.color.nombre})`);
        setTimeout(() => setExito(null), 2500);
        return true;
      } else {
        handleBusqueda(cleanCode);
        return false;
      }
    } catch {
      return false;
    }
  };

  // Agregar prenda al carrito de venta
  function agregarAlCarrito(v: any, prod?: any) {
    const p = prod || v.producto;
    const stock = Array.isArray(v.stocks) && v.stocks.length > 0
      ? v.stocks.reduce((acc: number, s: any) => acc + (s?.cantidad || 0), 0)
      : (typeof v.stock === "number" ? v.stock : 999);

    if (stock <= 0) {
      setError(`Sin stock disponible (${v.sku || "prenda"})`);
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
          setError(`Stock máximo alcanzado (${stock} unidades)`);
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

  // Descuento rápido porcentual
  const aplicarDescuentoPorcentaje = (pct: number) => {
    setDescuentoPctSeleccionado(pct);
    const montoDesc = Math.round((subtotal * pct) / 100);
    setDescuentoGlobal(montoDesc);
  };

  // Pausar Venta / Poner en Espera (F8)
  const pausarVentaActual = () => {
    if (carrito.length === 0) return;
    const nuevaPausa: CuentaPausada = {
      id: Math.random().toString(36).substring(2, 9),
      cliente,
      carrito,
      descuentoGlobal,
      nota,
      tipoVenta,
      vendedorId,
      total,
      fecha: new Date(),
    };

    setCuentasPausadas((prev) => [nuevaPausa, ...prev]);
    setCarrito([]);
    setCliente(null);
    setDescuentoGlobal(0);
    setNota("");
    setExito("Venta guardada en espera (F8)");
    setTimeout(() => setExito(null), 3000);
  };

  // Reanudar Venta en Espera
  const reanudarVentaPausada = (cuenta: CuentaPausada) => {
    setCarrito(cuenta.carrito);
    setCliente(cuenta.cliente);
    setDescuentoGlobal(cuenta.descuentoGlobal);
    setNota(cuenta.nota);
    setTipoVenta(cuenta.tipoVenta);
    setVendedorId(cuenta.vendedorId);
    setCuentasPausadas((prev) => prev.filter((c) => c.id !== cuenta.id));
    setMostrarModalPausadas(false);
    setExito("Venta reanudada");
    setTimeout(() => setExito(null), 2500);
  };

  // Atajos de Teclado Globales
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        enfocarBuscador();
      } else if (e.key === "F4") {
        e.preventDefault();
        if (carrito.length > 0) {
          iniciarCobro();
        }
      } else if (e.key === "F8") {
        e.preventDefault();
        if (carrito.length > 0) {
          pausarVentaActual();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [carrito, cliente, subtotal, total, cajaAbierta, tipoVenta]);

  // Iniciar flujo de cobro
  function iniciarCobro() {
    if (carrito.length === 0) {
      setError("El carrito está vacío");
      return;
    }
    if (!cajaAbierta && tipoVenta !== "COTIZACION") {
      setError("Debe abrir turno de caja para vender");
      setMostrarAbrirCaja(true);
      return;
    }

    if (tipoVenta === "COTIZACION") {
      confirmarVentaDirecta([], 0, 0);
    } else {
      setAbrirModalCobro(true);
    }
  }

  // Confirmar Venta
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

    // Preparar ticket térmico 80mm
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
    setDescuentoPctSeleccionado(0);
    setNota("");
    setExito(`✅ ${res.data.codigo} registrada correctamente`);
    setTimeout(() => setExito(null), 4000);
    startTransition(() => router.refresh());
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-900 text-slate-100 select-none overflow-hidden">
      {/* 1. Header Cockpit del POS */}
      <header className="h-14 px-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0 shadow-md">
        {/* Lado Izquierdo: Marca + Tipo de Venta Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 rounded-xl text-white font-black text-xs tracking-wider shadow-md shadow-blue-500/20">
            <Zap className="h-3.5 w-3.5 fill-current text-yellow-300" />
            <span>POS PRO</span>
          </div>

          {/* Selector de Tipo de Documento */}
          <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
            {(["VENTA", "REMISION", "COTIZACION"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipoVenta(t)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  tipoVenta === t
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t === "VENTA" ? "Venta Mostrador" : t === "REMISION" ? "Remisión" : "Cotización"}
              </button>
            ))}
          </div>
        </div>

        {/* Lado Derecho: Cuentas en Pausa + Estado Caja + Atajos */}
        <div className="flex items-center gap-2.5">
          {/* Botón Cuentas en Espera */}
          {cuentasPausadas.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarModalPausadas(true)}
              className="h-8 text-xs font-bold bg-amber-950/40 text-amber-300 border-amber-800/80 hover:bg-amber-900/50 flex items-center gap-1.5 animate-pulse"
            >
              <PauseCircle className="h-4 w-4" />
              <span>{cuentasPausadas.length} en espera</span>
            </Button>
          )}

          {/* Atajos de Teclado Chips */}
          <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">F2: Buscar</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">F4: Cobrar</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">F8: Pausar</span>
          </div>

          {/* Estado de Turno de Caja */}
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                cajaAbierta
                  ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/80"
                  : "bg-red-950/60 text-red-300 border border-red-800/80"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${cajaAbierta ? "bg-emerald-400 animate-ping" : "bg-red-400"}`} />
              {cajaAbierta ? "Caja Abierta" : "Caja Cerrada"}
            </span>

            {!cajaAbierta && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setMostrarAbrirCaja(true)}
                className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
              >
                Abrir Caja
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Cuerpo Principal: 2 Columnas (Catálogo Izquierda 60% / Carrito y Cobro Derecha 40%) */}
      <div className="flex-1 flex overflow-hidden">
        {/* COLUMNA IZQUIERDA: Catálogo de Productos y Buscador */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800 bg-slate-950/50">
          {/* Barra de Comandos y Escaneo */}
          <div className="p-3 border-b border-slate-800 bg-slate-950 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
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
                  placeholder="Escanear código de barras o escribir nombre/referencia (F2)..."
                  className="pl-10 pr-9 h-11 bg-slate-900 border-slate-800 text-white rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 shadow-inner"
                  autoFocus
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => handleBusqueda("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Botón de Cámara Móvil */}
              <Button
                variant="primary"
                onClick={() => setAbrirEscanerCamara(true)}
                className="h-11 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 shrink-0"
              >
                <Camera className="h-4 w-4 text-white" />
                <span>Escanear con Cámara</span>
              </Button>
            </div>

            {/* Píldoras de Categorías */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <button
                type="button"
                onClick={() => handleSeleccionarCategoria(null)}
                className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all ${
                  categoriaSeleccionada === null
                    ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                🏷️ Todas las Prendas
              </button>

              {categorias.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSeleccionarCategoria(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all ${
                    categoriaSeleccionada === cat.id
                      ? "bg-blue-600 text-white border border-blue-500 shadow-md shadow-blue-600/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Grilla Visual de Prendas */}
          <div className="flex-1 overflow-y-auto p-4">
            {cargandoProductos ? (
              <div className="py-24 text-center space-y-2 text-slate-400">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
                <p className="text-xs">Cargando catálogo...</p>
              </div>
            ) : productos.length === 0 ? (
              <EmptyState
                icon={Search}
                title="Sin resultados"
                description="No se encontraron prendas con esa búsqueda o categoría"
                className="py-24 text-slate-400"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {productos.map((prod) => (
                  <ProductoCardPOS
                    key={prod.id}
                    producto={prod}
                    onAgregar={(v) => agregarAlCarrito(v, prod)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: Carrito de Compra & Cockpit de Cobro (40% Width) */}
        <div className="w-full lg:w-[440px] xl:w-[480px] flex flex-col bg-slate-950 border-l border-slate-800 shadow-2xl shrink-0">
          {/* Header del Carrito: Cliente y Vendedor */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-900/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShoppingCart className="h-4 w-4 text-blue-400" />
                Orden Actual ({totalItems} prendas)
              </span>

              {carrito.length > 0 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={pausarVentaActual}
                    title="Pausar venta para atender a otro cliente (F8)"
                    className="h-7 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 px-2"
                  >
                    <PauseCircle className="h-3.5 w-3.5 mr-1" />
                    Pausar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("¿Vaciar todo el carrito?")) setCarrito([]);
                    }}
                    className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 px-2"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Vaciar
                  </Button>
                </div>
              )}
            </div>

            {/* Barra de Selección de Cliente Rápida */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
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
                  <SelectTrigger className="h-9 bg-slate-900 border-slate-800 text-xs text-white">
                    <UserCheck className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                    <SelectValue placeholder="Cliente General (Mostrador)" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    <SelectItem value="">Cliente General (Sin registrar)</SelectItem>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nombre} {c.documento ? `(${c.documento})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                className="h-9 w-9 border-slate-800 bg-slate-900 text-blue-400 hover:bg-slate-800 hover:text-blue-300 shrink-0"
                title="Nuevo cliente rápido"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Lista de Artículos en Carrito */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {carrito.length === 0 ? (
              <div className="py-24 text-center space-y-3 text-slate-500">
                <ShoppingCart className="h-16 w-16 mx-auto text-slate-800 stroke-[1.2]" />
                <p className="font-bold text-sm text-slate-400">Carrito sin productos</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Haz clic en las tallas del catálogo o escanea con el lector de código de barras.
                </p>
              </div>
            ) : (
              carrito.map((item, idx) => (
                <div
                  key={item.varianteId}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-white truncate">{item.nombre}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] text-slate-400">{item.sku}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {item.color} • Talla {item.talla}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => eliminarDelCarrito(item.varianteId)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                    {/* Stepper de Cantidad */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => actualizarCantidad(item.varianteId, -1)}
                        disabled={item.cantidad <= 1}
                        className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center disabled:opacity-40"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center font-black text-xs text-white">
                        {item.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => actualizarCantidad(item.varianteId, 1)}
                        disabled={item.cantidad >= item.stock}
                        className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Precio y Subtotal */}
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">
                        {formatoCOP(item.precio)} c/u
                      </span>
                      <span className="font-black text-sm text-emerald-400">
                        {formatoCOP(item.cantidad * item.precio - item.descuento)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cockpit de Totales y Cobro (Bottom Fixed) */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/90 space-y-3 shrink-0">
            {/* Descuentos Rápidos Porcentuales */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-400">Descuento Global:</span>
              <div className="flex items-center gap-1">
                {DESCUENTOS_RAPIDOS.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => aplicarDescuentoPorcentaje(pct)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      descuentoPctSeleccionado === pct && descuentoGlobal > 0
                        ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {pct === 0 ? "0%" : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Grande */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 border border-slate-800 text-white flex items-center justify-between shadow-xl">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 block">
                  Total a Pagar
                </span>
                <span className="text-3xl font-black tracking-tight text-white">
                  {formatoCOP(total)}
                </span>
              </div>

              {descuentoGlobal > 0 && (
                <div className="text-right text-xs">
                  <span className="text-slate-400 block">Subtotal: {formatoCOP(subtotal)}</span>
                  <span className="text-red-400 font-bold">-{formatoCOP(descuentoGlobal)}</span>
                </div>
              )}
            </div>

            {/* Botón Principal de Cobro */}
            <Button
              onClick={iniciarCobro}
              disabled={
                pending || carrito.length === 0 || (!cajaAbierta && tipoVenta !== "COTIZACION")
              }
              className="w-full h-13 py-3.5 text-base font-black tracking-wider uppercase bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-xl shadow-emerald-500/25 rounded-2xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.99]"
            >
              <DollarSign className="h-5 w-5" />
              <span>
                {tipoVenta === "COTIZACION" ? "Guardar Cotización" : "COBRAR (F4)"}
              </span>
            </Button>
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

      {/* Modal: Cobro POS */}
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

      {/* Modal: Cuentas Pausadas en Espera */}
      <Dialog open={mostrarModalPausadas} onOpenChange={setMostrarModalPausadas}>
        <DialogContent className="max-w-md bg-slate-900 text-white border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <PauseCircle className="h-5 w-5" />
              Cuentas Pausadas en Espera
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Selecciona una cuenta para reanudar su cobro en el carrito.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-3 max-h-60 overflow-y-auto">
            {cuentasPausadas.map((cuenta) => (
              <div
                key={cuenta.id}
                className="p-3 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between hover:border-blue-500 transition-all"
              >
                <div>
                  <p className="font-bold text-sm text-white">
                    {cuenta.cliente?.nombre || "Cliente General"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {cuenta.carrito.length} prendas • {new Date(cuenta.fecha).toLocaleTimeString("es-CO")}
                  </p>
                  <p className="font-bold text-xs text-emerald-400">{formatoCOP(cuenta.total)}</p>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => reanudarVentaPausada(cuenta)}
                  className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700"
                >
                  <PlayCircle className="h-4 w-4 mr-1" /> Reanudar
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Abrir Caja */}
      <Dialog open={mostrarAbrirCaja} onOpenChange={setMostrarAbrirCaja}>
        <DialogContent className="max-w-md bg-slate-900 text-white border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-400">
              <Building2 className="h-5 w-5" />
              Apertura de Turno de Caja
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Ingresa el monto de base inicial en efectivo para iniciar las ventas.
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
                setExito("Caja abierta correctamente");
                setTimeout(() => setExito(null), 3000);
              } else {
                setError(res.error);
              }
            }}
            className="space-y-4 py-2"
          >
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Base Inicial de Efectivo (COP)
              </label>
              <Input
                type="number"
                min={0}
                step={5000}
                value={baseInicial}
                onChange={(e) => setBaseInicial(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white text-lg font-bold"
                autoFocus
              />
            </div>

            {error && <p className="text-xs font-semibold text-red-400">{error}</p>}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMostrarAbrirCaja(false)}
                className="text-white border-slate-700 hover:bg-slate-800"
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
        <DialogContent className="max-w-md bg-slate-900 text-white border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-400">
              <UserPlus className="h-5 w-5" />
              Nuevo Cliente Rápido
            </DialogTitle>
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
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Nombre Completo *
              </label>
              <Input
                value={nuevoCliente.nombre}
                onChange={(e) =>
                  setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-white"
                required
                minLength={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Tipo
                </label>
                <Select
                  value={nuevoCliente.tipoDoc}
                  onValueChange={(v) =>
                    setNuevoCliente({ ...nuevoCliente, tipoDoc: v as any })
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    <SelectItem value="CC">CC</SelectItem>
                    <SelectItem value="NIT">NIT</SelectItem>
                    <SelectItem value="OTRO">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  N° Documento
                </label>
                <Input
                  value={nuevoCliente.documento}
                  onChange={(e) =>
                    setNuevoCliente({ ...nuevoCliente, documento: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Teléfono / WhatsApp
              </label>
              <Input
                value={nuevoCliente.telefono}
                onChange={(e) =>
                  setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            {error && <p className="text-xs font-semibold text-red-400">{error}</p>}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAbrirClienteModal(false)}
                className="text-white border-slate-700 hover:bg-slate-800"
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={pending} className="bg-blue-600 hover:bg-blue-700">
                Crear y Seleccionar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Toast Feedback */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50 animate-bounce">
          <div className="bg-red-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 max-w-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-xs font-bold">{error}</span>
            <button type="button" onClick={() => setError(null)} className="ml-auto p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {exito && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
          <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 max-w-sm font-bold text-xs">
            <Check className="h-4 w-4 shrink-0" />
            <span>{exito}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────── Tarjeta de Producto Interactiva ─────────────────────

function ProductoCardPOS({
  producto,
  onAgregar,
}: {
  producto: ProductoPOS;
  onAgregar: (v: any) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-3.5 transition-all hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 space-y-3 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="truncate">
            <p className="font-bold text-sm text-white truncate leading-tight">
              {producto.nombre}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="font-mono text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                {producto.referencia}
              </span>
              {producto.categoria && (
                <span className="text-[10px] text-slate-400 truncate">
                  {producto.categoria.nombre}
                </span>
              )}
            </div>
          </div>

          <span className="font-black text-sm text-emerald-400 shrink-0">
            {formatoCOP(producto.precioBase)}
          </span>
        </div>
      </div>

      {/* Matriz de Variantes Tallas / Colores */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] uppercase font-bold text-slate-500 block">
          Selecciona Talla / Color:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {producto.variantes.map((v) => {
            const cantStock = Array.isArray(v.stocks) && v.stocks.length > 0
              ? v.stocks.reduce((a: number, s: any) => a + (s?.cantidad || 0), 0)
              : 0;

            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onAgregar(v)}
                disabled={cantStock <= 0}
                className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all transform active:scale-95 ${
                  cantStock > 0
                    ? "border-slate-700 bg-slate-800 hover:bg-blue-600 hover:border-blue-500 text-slate-200 hover:text-white shadow-sm cursor-pointer"
                    : "border-slate-800/40 bg-slate-900/40 text-slate-600 opacity-50 cursor-not-allowed"
                }`}
              >
                {/* Indicador de Color */}
                <span
                  className="h-2 w-2 rounded-full border border-slate-500"
                  style={{ backgroundColor: v.color.hex || "#94a3b8" }}
                />
                <span className="font-black">{v.talla.valor}</span>
                <span
                  className={`text-[10px] font-bold ${
                    cantStock > 0 ? "text-emerald-400" : "text-slate-600"
                  }`}
                >
                  {cantStock > 0 ? `(${cantStock})` : "0"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}