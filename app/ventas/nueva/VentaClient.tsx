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
  CheckCircle2,
  SlidersHorizontal,
  Flame,
  Shirt,
  Percent,
  Keyboard,
  Info,
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

  // Buscador de Clientes
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [mostrarDropdownCliente, setMostrarDropdownCliente] = useState(false);

  // Notificaciones
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const inputBusquedaRef = useRef<HTMLInputElement>(null);

  // Clientes filtrados por nombre, documento o teléfono
  const clientesFiltrados = useMemo(() => {
    if (!busquedaCliente.trim()) return [];
    const q = busquedaCliente.toLowerCase().trim();
    return clientes
      .filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          (c.documento && c.documento.toLowerCase().includes(q)) ||
          (c.telefono && c.telefono.includes(q))
      )
      .slice(0, 8);
  }, [clientes, busquedaCliente]);

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
  }

  // Modificar cantidad en carrito
  const cambiarCantidad = (varianteId: number, delta: number) => {
    setCarrito((prev) =>
      prev
        .map((item) => {
          if (item.varianteId === varianteId) {
            const nuevaCantidad = item.cantidad + delta;
            if (nuevaCantidad <= 0) return null;
            if (nuevaCantidad > item.stock && item.stock < 999) {
              setError(`Solo hay ${item.stock} unidades en bodega.`);
              return item;
            }
            return { ...item, cantidad: nuevaCantidad };
          }
          return item;
        })
        .filter(Boolean) as ItemCarrito[]
    );
  };

  const eliminarItem = (varianteId: number) => {
    setCarrito((prev) => prev.filter((i) => i.varianteId !== varianteId));
  };

  const aplicarDescuentoRapido = (pct: number) => {
    setDescuentoPctSeleccionado(pct);
    if (pct === 0) {
      setDescuentoGlobal(0);
    } else {
      setDescuentoGlobal(Math.round((subtotal * pct) / 100));
    }
  };

  // Pausar Venta (Poner en Espera)
  const pausarVentaActual = () => {
    if (carrito.length === 0) return;
    const nuevaPausada: CuentaPausada = {
      id: Math.random().toString(36).substr(2, 9),
      cliente,
      carrito: [...carrito],
      descuentoGlobal,
      nota,
      tipoVenta,
      vendedorId,
      total,
      fecha: new Date(),
    };
    setCuentasPausadas((prev) => [nuevaPausada, ...prev]);
    vaciarCarrito();
    setExito("Venta guardada en espera ⏸️");
    setTimeout(() => setExito(null), 3000);
  };

  const recuperarVentaPausada = (cuenta: CuentaPausada) => {
    setCarrito(cuenta.carrito);
    setCliente(cuenta.cliente);
    setDescuentoGlobal(cuenta.descuentoGlobal);
    setNota(cuenta.nota);
    setTipoVenta(cuenta.tipoVenta);
    setVendedorId(cuenta.vendedorId);
    setCuentasPausadas((prev) => prev.filter((c) => c.id !== cuenta.id));
    setMostrarModalPausadas(false);
    setExito("Venta recuperada al mostrador");
    setTimeout(() => setExito(null), 3000);
  };

  const vaciarCarrito = () => {
    setCarrito([]);
    setCliente(null);
    setBusquedaCliente("");
    setDescuentoGlobal(0);
    setDescuentoPctSeleccionado(0);
    setNota("");
    setError(null);
  };

  // Confirmar Venta POS
  const handleConfirmarVentaPOS = async (
    pagos: PagoItem[],
    recibidoEfectivo: number,
    cambioEfectivo: number
  ) => {
    if (carrito.length === 0) return;

    setError(null);
    startTransition(async () => {
      const res = await registrarVenta({
        clienteId: cliente?.id,
        tipoVenta,
        vendedorId: vendedorId ?? undefined,
        bodegaId: bodegaActualId,
        descuentoGlobal,
        nota,
        items: carrito.map((i) => ({
          varianteId: i.varianteId,
          cantidad: i.cantidad,
          precioUnitario: i.precio,
          descuento: i.descuento,
        })),
        pagos,
      });

      if (res.ok) {
        const ventaGuardada = res.data;
        const totalVentaNum = total;

        setVentaParaImprimir({
          consecutivo: ventaGuardada.consecutivo,
          tipo: tipoVenta,
          codigo: `V-${String(ventaGuardada.consecutivo).padStart(4, "0")}`,
          fecha: new Date(),
          clienteNombre: cliente?.nombre || "CLIENTE GENERAL",
          clienteDoc: cliente?.documento || undefined,
          vendedorNombre: vendedores.find((v) => v.id === vendedorId)?.nombre,
          items: carrito.map((i) => ({
            nombre: i.nombre,
            talla: i.talla,
            color: i.color,
            cantidad: i.cantidad,
            precio: i.precio,
            subtotal: i.cantidad * i.precio - i.descuento,
          })),
          subtotal,
          descuento: descuentoGlobal,
          total: totalVentaNum,
          pagos: pagos.map((p) => ({
            metodo: p.metodo,
            monto: p.monto,
          })),
          recibido: recibidoEfectivo,
          cambio: cambioEfectivo,
        });

        vaciarCarrito();
        setAbrirModalCobro(false);
        setAbrirTicketModal(true);
        cargarCatalogo(busqueda, categoriaSeleccionada);
      } else {
        setError(res.error);
      }
    });
  };

  // Crear Cliente Rápido
  const handleGuardarNuevoCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoCliente.nombre.trim()) return;

    startTransition(async () => {
      const res = await guardarCliente({
        nombre: nuevoCliente.nombre,
        telefono: nuevoCliente.telefono || undefined,
        documento: nuevoCliente.documento || undefined,
        tipoDoc: nuevoCliente.tipoDoc,
        cupoCredito: Number(nuevoCliente.cupoCredito) || 0,
        activo: true,
      });

      if (res.ok) {
        const cCreado: ClienteRapido = {
          id: res.data.id,
          nombre: nuevoCliente.nombre,
          tipoDoc: nuevoCliente.tipoDoc,
          documento: nuevoCliente.documento || null,
          telefono: nuevoCliente.telefono || null,
          cupoCredito: Number(nuevoCliente.cupoCredito) || 0,
          diasCredito: 30,
        };
        setClientes((prev) => [cCreado, ...prev]);
        setCliente(cCreado);
        setAbrirClienteModal(false);
        setNuevoCliente({
          nombre: "",
          telefono: "",
          documento: "",
          tipoDoc: "CC",
          cupoCredito: 0,
        });
        setExito(`Cliente ${cCreado.nombre} registrado con éxito`);
        setTimeout(() => setExito(null), 3000);
      } else {
        setError(res.error);
      }
    });
  };

  // Apertura de caja rápida si está cerrada
  const handleAbrirCaja = async () => {
    const base = Number(baseInicial) || 0;
    const res = await abrirCaja({ baseInicial: base, bodegaId: bodegaActualId });
    if (res.ok) {
      setCajaAbierta(true);
      setMostrarAbrirCaja(false);
      setExito("Caja abierta correctamente. ¡Buenas ventas!");
      setTimeout(() => setExito(null), 3000);
    } else {
      setError(res.error);
    }
  };

  // Atajos de Teclado Globales del POS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (abrirModalCobro || abrirTicketModal || abrirClienteModal || abrirEscanerCamara) return;

      if (e.key === "F2") {
        e.preventDefault();
        enfocarBuscador();
      } else if (e.key === "F4" && carrito.length > 0) {
        e.preventDefault();
        setAbrirModalCobro(true);
      } else if (e.key === "F8" && carrito.length > 0) {
        e.preventDefault();
        vaciarCarrito();
      } else if (e.key === "F9" && carrito.length > 0) {
        e.preventDefault();
        pausarVentaActual();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [carrito, abrirModalCobro, abrirTicketModal, abrirClienteModal, abrirEscanerCamara]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-100 overflow-hidden select-none">
      {/* ───────────────────────── 1. TOP COCKPIT BAR (Estilo 21st.dev) ───────────────────────── */}
      <header className="h-14 bg-slate-900 text-white px-4 flex items-center justify-between border-b border-slate-800 shrink-0 z-20 shadow-md">
        {/* Lado Izquierdo: Estado de Caja & Modos de Venta */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                cajaAbierta ? "bg-emerald-400 animate-pulse" : "bg-red-500"
              }`}
            />
            <span className="text-xs font-black tracking-tight text-white hidden sm:inline">
              {cajaAbierta ? "CAJA ACTIVA" : "CAJA CERRADA"}
            </span>
            {!cajaAbierta && (
              <button
                type="button"
                onClick={() => setMostrarAbrirCaja(true)}
                className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                Abrir Caja
              </button>
            )}
          </div>

          {/* Selector de Modo: Venta / Remisión / Cotización */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => setTipoVenta("VENTA")}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                tipoVenta === "VENTA"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Venta Directa
            </button>
            <button
              type="button"
              onClick={() => setTipoVenta("REMISION")}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                tipoVenta === "REMISION"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Remisión
            </button>
            <button
              type="button"
              onClick={() => setTipoVenta("COTIZACION")}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                tipoVenta === "COTIZACION"
                  ? "bg-purple-600 text-white shadow-2xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Cotización
            </button>
          </div>
        </div>

        {/* Lado Derecho: Atajos, En Espera & Cámara */}
        <div className="flex items-center gap-2">
          {/* Botón de Cuentas Pausadas */}
          {cuentasPausadas.length > 0 && (
            <button
              type="button"
              onClick={() => setMostrarModalPausadas(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-black transition-colors"
            >
              <PauseCircle className="h-4 w-4" />
              <span>En Espera</span>
              <span className="h-5 w-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black">
                {cuentasPausadas.length}
              </span>
            </button>
          )}

          {/* Escáner de Cámara */}
          <button
            type="button"
            onClick={() => setAbrirEscanerCamara(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
            title="Escanear con Cámara del Dispositivo"
          >
            <Camera className="h-4 w-4 text-teal-400" />
            <span className="hidden md:inline">Cámara</span>
          </button>

          {/* Atajos de Teclado Info */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <span><kbd className="text-white font-bold">F2</kbd> Buscar</span>
            <span>•</span>
            <span><kbd className="text-white font-bold">F4</kbd> Cobrar</span>
            <span>•</span>
            <span><kbd className="text-white font-bold">F9</kbd> Pausar</span>
          </div>
        </div>
      </header>

      {/* Notificaciones Flotantes */}
      {exito && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-600 text-white text-xs font-black rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{exito}</span>
        </div>
      )}
      {error && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-600 text-white text-xs font-black rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="ml-2 text-white/80 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ───────────────────────── 2. CUERPO PRINCIPAL DIVIDIDO EN 2 PANELES ───────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ───────── PANEL IZQUIERDO: CATÁLOGO Y BUSCADOR (Flex-1) ───────── */}
        <section className="flex-1 flex flex-col min-w-0 bg-slate-100 overflow-hidden">
          {/* Barra de Búsqueda Inteligente */}
          <div className="p-3.5 bg-white border-b border-slate-200 shadow-2xs space-y-2.5">
            <div className="relative">
              <div className="absolute left-3.5 top-3 text-slate-400 flex items-center gap-1">
                <Search className="h-4 w-4" />
                <Barcode className="h-4 w-4 text-blue-600" />
              </div>
              <input
                ref={inputBusquedaRef}
                type="text"
                value={busqueda}
                onChange={(e) => handleBusqueda(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && busqueda.trim()) {
                    e.preventDefault();
                    handleEscanearCodigo(busqueda.trim());
                  }
                }}
                placeholder="Escanea el código de barras con la pistola o busca por nombre, ref, talla o color... (F2)"
                className="w-full h-11 pl-16 pr-24 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 shadow-2xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                autoFocus
              />
              <div className="absolute right-3 top-2.5 flex items-center gap-1">
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => {
                      setBusqueda("");
                      cargarCatalogo("", categoriaSeleccionada);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-mono">
                  F2
                </span>
              </div>
            </div>

            {/* Carrusel de Categorías (Pills) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => handleSeleccionarCategoria(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-1.5 ${
                  categoriaSeleccionada === null
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Todos los Productos</span>
              </button>
              {categorias.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSeleccionarCategoria(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all ${
                    categoriaSeleccionada === cat.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Grilla de Productos (Estilo 21st.dev) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cargandoProductos ? (
              <div className="py-24 text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                <p className="text-xs font-bold text-slate-500">Cargando inventario del punto de venta...</p>
              </div>
            ) : productos.length === 0 ? (
              <div className="py-24 text-center space-y-2">
                <Package className="h-12 w-12 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-sm font-black text-slate-800">No encontramos prendas en inventario</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Prueba buscando con otro término o selecciona otra categoría.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {productos.map((prod) => {
                  const stockTotal = prod.variantes.reduce((acc, v) => {
                    const st = Array.isArray(v.stocks) && v.stocks.length > 0
                      ? v.stocks.reduce((a, s) => a + (s?.cantidad || 0), 0)
                      : 0;
                    return acc + st;
                  }, 0);

                  return (
                    <div
                      key={prod.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-all hover:border-slate-300 flex flex-col justify-between group"
                    >
                      {/* Header de la Prenda */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            REF: {prod.referencia}
                          </span>
                          {prod.genero && (
                            <span className="text-[10px] font-bold text-slate-600 uppercase">
                              {prod.genero}
                            </span>
                          )}
                        </div>

                        <h3 className="text-xs font-black text-slate-900 line-clamp-1 leading-tight" title={prod.nombre}>
                          {prod.nombre}
                        </h3>

                        <div className="flex items-baseline justify-between pt-1">
                          <span className="text-base font-black text-slate-900">
                            {formatoCOP(prod.precioBase)}
                          </span>
                          <span
                            className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                              stockTotal > 0
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {stockTotal > 0 ? `${stockTotal} en stock` : "Agotado"}
                          </span>
                        </div>
                      </div>

                      {/* Selector Rápido de Tallas & Variantes en 1 Clic */}
                      <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Tallas & Colores Disponibles:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {prod.variantes.map((v) => {
                            const stockVar = Array.isArray(v.stocks) && v.stocks.length > 0
                              ? v.stocks.reduce((acc, s) => acc + (s?.cantidad || 0), 0)
                              : 0;
                            const sinStock = stockVar <= 0;

                            return (
                              <button
                                key={v.id}
                                type="button"
                                disabled={sinStock}
                                onClick={() => agregarAlCarrito(v, prod)}
                                title={`${v.talla.valor} - ${v.color.nombre} (${stockVar} disponibles)`}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  sinStock
                                    ? "bg-slate-100 text-slate-300 border border-slate-200 line-through cursor-not-allowed"
                                    : "bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-800 border border-slate-200 hover:border-blue-600 shadow-2xs hover:scale-105 active:scale-95"
                                }`}
                              >
                                {v.color.hex && (
                                  <span
                                    className="h-2.5 w-2.5 rounded-full border border-black/10 shrink-0"
                                    style={{ backgroundColor: v.color.hex }}
                                  />
                                )}
                                <span>{v.talla.valor}</span>
                                <span className="text-[10px] opacity-70">({stockVar})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ───────── PANEL DERECHO: COMANDO DE VENTA & CARRITO (420px Sticky) ───────── */}
        <aside className="w-full max-w-[420px] bg-white border-l border-slate-200 flex flex-col justify-between shrink-0 shadow-lg z-10">
          {/* Header del Carrito: Cliente y Vendedor */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
            {/* Buscador Integrado de Cliente */}
            <div className="space-y-1.5 relative">
              <div className="flex items-center justify-between">
                <label className="text-[10.5px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-slate-500" />
                  <span>Cliente</span>
                </label>
                {cliente ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCliente(null);
                      setBusquedaCliente("");
                    }}
                    className="text-[10.5px] font-bold text-red-600 hover:underline"
                  >
                    Cambiar
                  </button>
                ) : (
                  <span className="text-[10.5px] text-slate-400 font-medium">Opcional</span>
                )}
              </div>

              {!cliente ? (
                <div className="relative">
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={busquedaCliente}
                        onChange={(e) => {
                          setBusquedaCliente(e.target.value);
                          setMostrarDropdownCliente(true);
                        }}
                        onFocus={() => setMostrarDropdownCliente(true)}
                        placeholder="Buscar por Nombre, Cédula o Tel..."
                        className="w-full h-9 pl-8 pr-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNuevoCliente((prev) => ({
                          ...prev,
                          nombre: busquedaCliente,
                        }));
                        setAbrirClienteModal(true);
                      }}
                      className="h-9 px-2.5 text-xs font-black bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shrink-0"
                      title="Registrar nuevo cliente"
                    >
                      <UserPlus className="h-3.5 w-3.5 text-blue-600 mr-1" />
                      + Nuevo
                    </Button>
                  </div>

                  {/* Dropdown de Coincidencias */}
                  {mostrarDropdownCliente && busquedaCliente.trim() && (
                    <div className="absolute left-0 right-0 top-10 bg-white rounded-xl border border-slate-300 shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {clientesFiltrados.length > 0 ? (
                        clientesFiltrados.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setCliente(c);
                              setMostrarDropdownCliente(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 transition-colors flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-slate-900">{c.nombre}</p>
                              <p className="text-[10px] text-slate-500">
                                {c.documento ? `CC: ${c.documento}` : "Sin Doc"} {c.telefono ? `• Tel: ${c.telefono}` : ""}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-bold text-emerald-700 bg-emerald-50">
                              Cupo: {formatoCOP(c.cupoCredito)}
                            </Badge>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center space-y-1.5">
                          <p className="text-[11px] text-slate-500">No hay clientes con &quot;{busquedaCliente}&quot;</p>
                          <button
                            type="button"
                            onClick={() => {
                              setNuevoCliente((prev) => ({ ...prev, nombre: busquedaCliente }));
                              setMostrarDropdownCliente(false);
                              setAbrirClienteModal(true);
                            }}
                            className="text-xs font-black text-blue-600 hover:underline"
                          >
                            + Crear cliente ahora
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                      {cliente.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 line-clamp-1">{cliente.nombre}</p>
                      <p className="text-[10px] text-blue-800 font-mono">
                        {cliente.documento ? `CC: ${cliente.documento}` : "Sin Cédula"} • Cupo: {formatoCOP(cliente.cupoCredito)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Selector de Vendedor */}
            <div className="flex items-center gap-2">
              <label className="text-[10.5px] font-bold text-slate-500 uppercase shrink-0">
                Vendedor:
              </label>
              <select
                value={vendedorId || ""}
                onChange={(e) => setVendedorId(e.target.value ? Number(e.target.value) : null)}
                className="flex-1 h-8 px-2 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Sin Vendedor Asignado</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista de Prendas en el Carrito (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100">
            {carrito.length === 0 ? (
              <div className="py-20 text-center space-y-2 text-slate-400">
                <ShoppingCart className="h-10 w-10 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-bold text-slate-600">El carrito está vacío</p>
                <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                  Selecciona prendas del catálogo o escanea con la pistola de códigos.
                </p>
              </div>
            ) : (
              carrito.map((item) => (
                <div key={item.varianteId} className="pt-2 first:pt-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-slate-900 leading-tight">
                        {item.nombre}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                          {item.talla}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {item.color}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          • {item.sku}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => eliminarItem(item.varianteId)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Eliminar prenda"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Stepper de Cantidad & Subtotal */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(item.varianteId, -1)}
                        className="h-7 w-7 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="h-7 px-2.5 flex items-center justify-center text-xs font-black text-slate-900 border-x border-slate-200">
                        {item.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(item.varianteId, 1)}
                        className="h-7 w-7 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900">
                        {formatoCOP(item.cantidad * item.precio - item.descuento)}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {formatoCOP(item.precio)} c/u
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sección de Totales, Descuentos & Cobro */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 shrink-0">
            {/* Descuentos Rápidos */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                <span>Descuento Global:</span>
                {descuentoGlobal > 0 && (
                  <span className="text-red-600 font-black">-{formatoCOP(descuentoGlobal)}</span>
                )}
              </div>
              <div className="grid grid-cols-5 gap-1">
                {DESCUENTOS_RAPIDOS.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => aplicarDescuentoRapido(pct)}
                    className={`py-1 rounded-lg text-[10.5px] font-black transition-all ${
                      descuentoPctSeleccionado === pct
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {pct === 0 ? "0%" : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Subtotales y Conteo */}
            <div className="pt-2 border-t border-slate-200 space-y-1 text-xs font-bold text-slate-600">
              <div className="flex items-center justify-between">
                <span>Prendas en Carrito:</span>
                <span className="font-black text-slate-900">{totalItems} uds</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Subtotal:</span>
                <span className="font-black text-slate-900">{formatoCOP(subtotal)}</span>
              </div>
            </div>

            {/* Gran Total Card */}
            <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total a Cobrar
                </span>
                <span className="text-2xl font-black text-white">
                  {formatoCOP(total)}
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold text-emerald-400 border-emerald-400/40 bg-emerald-950/40">
                {tipoVenta}
              </Badge>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={pausarVentaActual}
                disabled={carrito.length === 0}
                className="p-3 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-bold transition-colors disabled:opacity-50"
                title="Poner Venta en Espera (F9)"
              >
                <PauseCircle className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={vaciarCarrito}
                disabled={carrito.length === 0}
                className="p-3 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-bold transition-colors disabled:opacity-50"
                title="Vaciar Carrito (F8)"
              >
                <Trash2 className="h-5 w-5" />
              </button>

              {/* Botón Principal de Cobro */}
              <Button
                size="lg"
                disabled={carrito.length === 0 || pending}
                onClick={() => setAbrirModalCobro(true)}
                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Receipt className="h-5 w-5" />
                <span>COBRAR ({formatoCOP(total)})</span>
                <kbd className="hidden sm:inline text-[10px] font-mono bg-emerald-800/80 text-emerald-200 px-1.5 py-0.5 rounded">
                  F4
                </kbd>
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* ───────────────────────── 3. MODALES COMPONENTIZADOS ───────────────────────── */}

      {/* Modal de Cobro POS */}
      <ModalCobroPOS
        open={abrirModalCobro}
        onClose={() => setAbrirModalCobro(false)}
        totalVenta={total}
        onConfirmarVenta={handleConfirmarVentaPOS}
        cargando={pending}
        clienteNombre={cliente?.nombre}
        cupoCredito={cliente?.cupoCredito}
        clientes={clientes}
        onSeleccionarCliente={(c) => setCliente(c as any)}
        onAbrirRegistrarCliente={(prefill) => {
          setNuevoCliente((prev) => ({
            ...prev,
            nombre: prefill || "",
          }));
          setAbrirClienteModal(true);
        }}
      />

      {/* Modal de Ticket de Venta */}
      {ventaParaImprimir && (
        <TicketVentaModal
          open={abrirTicketModal}
          onClose={() => {
            setAbrirTicketModal(false);
            setVentaParaImprimir(null);
          }}
          venta={ventaParaImprimir}
        />
      )}

      {/* Modal de Apertura de Caja */}
      <Dialog open={mostrarAbrirCaja} onOpenChange={setMostrarAbrirCaja}>
        <DialogContent className="max-w-md bg-white text-slate-900 border-slate-200 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2 text-slate-900">
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                <DollarSign className="h-5 w-5" />
              </div>
              <span>Apertura de Turno de Caja</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Ingresa el monto de base en efectivo con el que inicias operaciones hoy.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Base Inicial en Efectivo (COP)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-lg font-black text-slate-400">$</span>
                <input
                  type="number"
                  min={0}
                  value={baseInicial}
                  onChange={(e) => setBaseInicial(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xl font-black rounded-xl border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  autoFocus
                />
              </div>
            </div>

            {error && <p className="text-xs font-bold text-red-600">{error}</p>}
          </div>

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setMostrarAbrirCaja(false)} className="text-xs font-bold">
              Cancelar
            </Button>
            <Button onClick={handleAbrirCaja} className="text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white">
              Abrir Caja e Iniciar Ventas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Escáner de Cámara */}
      <CameraScannerModal
        open={abrirEscanerCamara}
        onClose={() => setAbrirEscanerCamara(false)}
        onScan={handleEscanearCodigo}
      />

      {/* Modal de Cuentas Pausadas */}
      <Dialog open={mostrarModalPausadas} onOpenChange={setMostrarModalPausadas}>
        <DialogContent className="max-w-xl bg-white text-slate-900 border-slate-200 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2 text-slate-900">
              <PauseCircle className="h-5 w-5 text-amber-500" />
              <span>Ventas en Espera ({cuentasPausadas.length})</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Recupera una venta para continuar cobrando en el mostrador.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 py-2 max-h-72 overflow-y-auto">
            {cuentasPausadas.map((c) => (
              <div
                key={c.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-amber-50/60 transition-colors"
              >
                <div>
                  <p className="text-xs font-black text-slate-900">
                    {c.cliente?.nombre || "Cliente General"} •{" "}
                    <span className="text-slate-500 font-medium">{c.carrito.length} prendas</span>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Pausada a las {c.fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-900">{formatoCOP(c.total)}</span>
                  <Button
                    size="sm"
                    onClick={() => recuperarVentaPausada(c)}
                    className="h-8 text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 px-3"
                  >
                    Retomar
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarModalPausadas(false)} className="text-xs font-bold">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Registro Rápido de Cliente */}
      <Dialog open={abrirClienteModal} onOpenChange={setAbrirClienteModal}>
        <DialogContent className="max-w-md bg-white text-slate-900 border-slate-200 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2 text-slate-900">
              <UserPlus className="h-5 w-5 text-blue-600" />
              <span>Registrar Nuevo Cliente</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Ingresa los datos para facturar o asignarle cupo de crédito.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGuardarNuevoCliente} className="space-y-3.5 py-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={nuevoCliente.nombre}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                placeholder="Ej. Carolina Gómez"
                className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Cédula / NIT
                </label>
                <input
                  type="text"
                  value={nuevoCliente.documento}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, documento: e.target.value })}
                  placeholder="Ej. 10928374"
                  className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Celular / WhatsApp
                </label>
                <input
                  type="text"
                  value={nuevoCliente.telefono}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                  placeholder="Ej. 3101234567"
                  className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Cupo de Crédito Directo (COP)
              </label>
              <input
                type="number"
                min={0}
                value={nuevoCliente.cupoCredito}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, cupoCredito: Number(e.target.value) })}
                placeholder="0"
                className="w-full h-10 px-3 text-xs font-black rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {error && <p className="text-xs font-bold text-red-600">{error}</p>}

            <DialogFooter className="pt-2 flex justify-between">
              <Button type="button" variant="outline" onClick={() => setAbrirClienteModal(false)} className="text-xs font-bold">
                Cancelar
              </Button>
              <Button type="submit" disabled={pending} className="text-xs font-black bg-blue-600 hover:bg-blue-700 text-white">
                Guardar y Asignar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}