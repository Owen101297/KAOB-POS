"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  DollarSign,
  CreditCard,
  Building,
  Wallet,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Plus,
  Trash2,
  Delete,
  Zap,
  Smartphone,
  Check,
  Search,
  UserPlus,
  UserCheck,
  X,
} from "lucide-react";
import { formatoCOP } from "@/lib/format";

export interface PagoItem {
  metodo: "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "PUNTOS" | "CREDITO" | "OTRO";
  monto: number;
  referencia?: string;
}

export interface ClienteItem {
  id: number;
  nombre: string;
  documento?: string | null;
  telefono?: string | null;
  cupoCredito?: number;
}

interface ModalCobroPOSProps {
  open: boolean;
  onClose: () => void;
  totalVenta: number;
  onConfirmarVenta: (pagos: PagoItem[], recibidoEfectivo: number, cambioEfectivo: number) => Promise<void>;
  cargando: boolean;
  clienteNombre?: string;
  cupoCredito?: number;
  clientes?: ClienteItem[];
  onSeleccionarCliente?: (cliente: ClienteItem | null) => void;
  onAbrirRegistrarCliente?: (prefill?: string) => void;
}

const DENOMINACIONES = [
  { valor: 10000, label: "$10K" },
  { valor: 20000, label: "$20K" },
  { valor: 50000, label: "$50K" },
  { valor: 100000, label: "$100K" },
  { valor: 200000, label: "$200K" },
];

export default function ModalCobroPOS({
  open,
  onClose,
  totalVenta,
  onConfirmarVenta,
  cargando,
  clienteNombre,
  cupoCredito = 0,
  clientes = [],
  onSeleccionarCliente,
  onAbrirRegistrarCliente,
}: ModalCobroPOSProps) {
  const [metodoPrincipal, setMetodoPrincipal] = useState<
    "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "CREDITO" | "MIXTO"
  >("EFECTIVO");

  // Efectivo directo
  const [efectivoRecibido, setEfectivoRecibido] = useState<number>(totalVenta);
  const [referenciaTransferencia, setReferenciaTransferencia] = useState("");
  const [bancoSeleccionado, setBancoSeleccionado] = useState<string>("Nequi");

  // Búsqueda de cliente en crédito
  const [busquedaCredito, setBusquedaCredito] = useState("");

  // Pagos mixtos
  const [pagosMixtos, setPagosMixtos] = useState<PagoItem[]>([
    { metodo: "EFECTIVO", monto: totalVenta },
  ]);

  useEffect(() => {
    if (open) {
      setMetodoPrincipal("EFECTIVO");
      setEfectivoRecibido(totalVenta);
      setReferenciaTransferencia("");
      setBancoSeleccionado("Nequi");
      setBusquedaCredito("");
      setPagosMixtos([{ metodo: "EFECTIVO", monto: totalVenta }]);
    }
  }, [open, totalVenta]);

  const cambioEfectivo = Math.max(0, efectivoRecibido - totalVenta);
  const faltanteEfectivo = Math.max(0, totalVenta - efectivoRecibido);
  const esEfectivoCompleto = efectivoRecibido >= totalVenta;

  const totalMixto = pagosMixtos.reduce((a, p) => a + (p.monto || 0), 0);
  const faltanteMixto = Math.max(0, totalVenta - totalMixto);
  const esMixtoCompleto = Math.abs(totalVenta - totalMixto) < 1;

  // Filtrado de clientes para crédito
  const clientesFiltradosCredito = useMemo(() => {
    if (!busquedaCredito.trim()) return clientes.slice(0, 5);
    const q = busquedaCredito.toLowerCase().trim();
    return clientes
      .filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          (c.documento && c.documento.toLowerCase().includes(q)) ||
          (c.telefono && c.telefono.includes(q))
      )
      .slice(0, 6);
  }, [clientes, busquedaCredito]);

  // Atajos de Teclado Numérico Táctil
  const presionarNumero = (num: string) => {
    const actualStr = String(efectivoRecibido || "");
    if (num === "CLEAR") {
      setEfectivoRecibido(0);
    } else if (num === "BACKSPACE") {
      const nuevoStr = actualStr.slice(0, -1);
      setEfectivoRecibido(nuevoStr ? Number(nuevoStr) : 0);
    } else if (num === "EXACTO") {
      setEfectivoRecibido(totalVenta);
    } else {
      const nuevoStr = actualStr === "0" || efectivoRecibido === totalVenta ? num : actualStr + num;
      setEfectivoRecibido(Number(nuevoStr));
    }
  };

  const sumarBillete = (monto: number) => {
    setEfectivoRecibido((prev) => {
      if (prev === totalVenta || prev === 0) return monto;
      return prev + monto;
    });
  };

  const handleConfirmar = async () => {
    let pagosFinales: PagoItem[] = [];

    if (metodoPrincipal === "EFECTIVO") {
      if (!esEfectivoCompleto) return;
      pagosFinales = [{ metodo: "EFECTIVO", monto: totalVenta }];
    } else if (metodoPrincipal === "TRANSFERENCIA") {
      pagosFinales = [
        {
          metodo: "TRANSFERENCIA",
          monto: totalVenta,
          referencia: `${bancoSeleccionado}: ${referenciaTransferencia.trim() || "Aprobado"}`,
        },
      ];
    } else if (metodoPrincipal === "TARJETA") {
      pagosFinales = [{ metodo: "TARJETA", monto: totalVenta }];
    } else if (metodoPrincipal === "CREDITO") {
      if (!clienteNombre) return;
      pagosFinales = [{ metodo: "CREDITO", monto: totalVenta }];
    } else {
      if (!esMixtoCompleto) return;
      pagosFinales = pagosMixtos;
    }

    await onConfirmarVenta(pagosFinales, efectivoRecibido, cambioEfectivo);
  };

  const agregarLineaMixta = () => {
    if (faltanteMixto > 0) {
      setPagosMixtos((prev) => [...prev, { metodo: "TRANSFERENCIA", monto: faltanteMixto }]);
    }
  };

  const actualizarLineaMixta = (index: number, campo: keyof PagoItem, valor: any) => {
    setPagosMixtos((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [campo]: valor };
      return copy;
    });
  };

  const eliminarLineaMixta = (index: number) => {
    setPagosMixtos((prev) => prev.filter((_, i) => i !== index));
  };

  // Manejo de atajo Enter para cobrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Enter" && !cargando) {
        if (metodoPrincipal === "EFECTIVO" && esEfectivoCompleto) {
          e.preventDefault();
          handleConfirmar();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, cargando, metodoPrincipal, esEfectivoCompleto, totalVenta, efectivoRecibido]);

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white border border-slate-200 text-slate-900 shadow-2xl rounded-2xl">
        {/* Cabecera Principal del Cobro */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block">
              Total a Pagar
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-0.5">
              {formatoCOP(totalVenta)}
            </h2>
            {clienteNombre && (
              <p className="text-xs text-slate-300 font-medium mt-1">
                Cliente: <strong className="text-white">{clienteNombre}</strong>
              </p>
            )}
          </div>

          {/* Selector de Método de Pago */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60 self-start sm:self-center overflow-x-auto">
            <button
              type="button"
              onClick={() => setMetodoPrincipal("EFECTIVO")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                metodoPrincipal === "EFECTIVO"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <DollarSign className="h-4 w-4" />
              Efectivo
            </button>

            <button
              type="button"
              onClick={() => setMetodoPrincipal("TRANSFERENCIA")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                metodoPrincipal === "TRANSFERENCIA"
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Smartphone className="h-4 w-4" />
              Transferencia
            </button>

            <button
              type="button"
              onClick={() => setMetodoPrincipal("TARJETA")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                metodoPrincipal === "TARJETA"
                  ? "bg-purple-500 text-white shadow-md shadow-purple-500/20"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <CreditCard className="h-4 w-4" />
              Datáfono
            </button>

            <button
              type="button"
              onClick={() => setMetodoPrincipal("CREDITO")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                metodoPrincipal === "CREDITO"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Wallet className="h-4 w-4" />
              Crédito
            </button>

            <button
              type="button"
              onClick={() => setMetodoPrincipal("MIXTO")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                metodoPrincipal === "MIXTO"
                  ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Dividido
            </button>
          </div>
        </div>

        {/* Cuerpo Dinámico según Método */}
        <div className="p-5 sm:p-6 bg-slate-50/50 space-y-5">
          {/* 1. VISTA EFECTIVO INTERACTIVO (BILLETES + TECLADO TÁCTIL + CAMBIO) */}
          {metodoPrincipal === "EFECTIVO" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Lado Izquierdo: Input Recibido + Billetes Rápidos + Banner Vueltas (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    Monto Recibido del Cliente
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xl font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      min={0}
                      value={efectivoRecibido || ""}
                      onChange={(e) => setEfectivoRecibido(Number(e.target.value))}
                      className="w-full pl-9 pr-4 py-2.5 text-2xl font-black rounded-xl border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>

                {/* Botones de Denominaciones Rápidas de Billetes */}
                <div>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Billetes Rápidos
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEfectivoRecibido(totalVenta)}
                      className="py-2 px-1 rounded-lg text-xs font-black bg-slate-800 text-white hover:bg-slate-900 transition-colors shadow-2xs text-center truncate"
                    >
                      ⚡ Exacto
                    </button>
                    {DENOMINACIONES.map((d) => (
                      <button
                        key={d.valor}
                        type="button"
                        onClick={() => sumarBillete(d.valor)}
                        className="py-2 px-1 rounded-lg text-xs font-black bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 border border-slate-300 hover:border-emerald-300 transition-colors shadow-2xs text-center"
                      >
                        +{d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Banner de Cambio / Vueltas */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                    esEfectivoCompleto
                      ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                      : "bg-red-50 border-red-200 text-red-950"
                  }`}
                >
                  <div>
                    <span className="text-[11px] uppercase font-bold tracking-wider opacity-80 block">
                      {esEfectivoCompleto ? "Cambio / Vueltas a Devolver" : "Dinero Faltante"}
                    </span>
                    <span
                      className={`text-2xl sm:text-3xl font-black ${
                        esEfectivoCompleto ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {formatoCOP(esEfectivoCompleto ? cambioEfectivo : faltanteEfectivo)}
                    </span>
                  </div>
                  {esEfectivoCompleto ? (
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Check className="h-6 w-6 stroke-[3]" />
                    </div>
                  ) : (
                    <Badge variant="danger" className="text-xs font-bold">
                      Incompleto
                    </Badge>
                  )}
                </div>
              </div>

              {/* Lado Derecho: Teclado Numérico Táctil Express (5 cols) */}
              <div className="lg:col-span-5 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-2 text-center">
                  Teclado Táctil Express
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "00", "BACKSPACE"].map((tecla) => (
                    <button
                      key={tecla}
                      type="button"
                      onClick={() => presionarNumero(tecla)}
                      className={`h-11 rounded-lg text-sm font-black transition-all flex items-center justify-center ${
                        tecla === "BACKSPACE"
                          ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                          : "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200"
                      }`}
                    >
                      {tecla === "BACKSPACE" ? <Delete className="h-5 w-5" /> : tecla}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => presionarNumero("CLEAR")}
                    className="py-2 rounded-lg text-xs font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
                  >
                    Borrar Todo
                  </button>
                  <button
                    type="button"
                    onClick={() => presionarNumero("EXACTO")}
                    className="py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    Pagar Exacto
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. VISTA TRANSFERENCIA BANCARIA (NEQUI, BANCOLOMBIA, DAVIPLATA) */}
          {metodoPrincipal === "TRANSFERENCIA" && (
            <div className="space-y-4 max-w-xl mx-auto bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Selecciona la Entidad o Billetera
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["Nequi", "Bancolombia", "Daviplata", "Otro Banco"].map((banco) => (
                    <button
                      key={banco}
                      type="button"
                      onClick={() => setBancoSeleccionado(banco)}
                      className={`py-2.5 px-2 rounded-lg text-xs font-bold border transition-all text-center ${
                        bancoSeleccionado === banco
                          ? "bg-blue-50 border-blue-500 text-blue-800 shadow-2xs ring-2 ring-blue-500/20"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {banco}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Número de Aprobación / Comprobante
                </label>
                <input
                  type="text"
                  value={referenciaTransferencia}
                  onChange={(e) => setReferenciaTransferencia(e.target.value)}
                  placeholder="Ej. M1928374 o N° de Aprobación"
                  className="w-full h-10 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  El comprobante se vinculará a la venta para cuadre en caja y conciliación bancaria.
                </p>
              </div>
            </div>
          )}

          {/* 3. VISTA DATÁFONO / TARJETA */}
          {metodoPrincipal === "TARJETA" && (
            <div className="p-6 max-w-xl mx-auto bg-white rounded-xl border border-purple-200 text-center space-y-3 shadow-2xs">
              <div className="h-12 w-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <CreditCard className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Cobro con Datáfono (Débito / Crédito)</h4>
              <p className="text-xs text-slate-500">
                Pasa la tarjeta en tu datáfono físico por el valor exacto de{" "}
                <strong className="text-slate-900">{formatoCOP(totalVenta)}</strong> y confirma la venta.
              </p>
            </div>
          )}

          {/* 4. VISTA CRÉDITO CLIENTE (CON BUSCADOR Y REGISTRO EN VIVO) */}
          {metodoPrincipal === "CREDITO" && (
            <div className="p-5 max-w-xl mx-auto bg-white rounded-xl border border-amber-200 space-y-4 shadow-2xs">
              {!clienteNombre ? (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                      Selecciona o registra un cliente para venta a crédito
                    </p>
                    <p className="mt-1 text-[11px] text-amber-800">
                      Busca el cliente por cédula, NIT o nombre a continuación, o regístralo en 1 clic:
                    </p>
                  </div>

                  {/* Buscador Integrado en la pestaña de Crédito */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={busquedaCredito}
                          onChange={(e) => setBusquedaCredito(e.target.value)}
                          placeholder="Escribe Cédula, NIT o Nombre del cliente..."
                          className="w-full h-10 pl-9 pr-3 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                          autoFocus
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (onAbrirRegistrarCliente) {
                            onAbrirRegistrarCliente(busquedaCredito);
                          }
                        }}
                        className="h-10 text-xs font-bold border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 shrink-0 px-3 flex items-center gap-1.5"
                      >
                        <UserPlus className="h-4 w-4 text-amber-700" />
                        + Registrar
                      </Button>
                    </div>

                    {/* Lista rápida de resultados de clientes */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-slate-50">
                      {clientesFiltradosCredito.length > 0 ? (
                        clientesFiltradosCredito.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              if (onSeleccionarCliente) onSeleccionarCliente(c);
                            }}
                            className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-amber-100/70 transition-colors border-b border-slate-200/70 last:border-0 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-slate-900">{c.nombre}</p>
                              <p className="text-[10.5px] text-slate-500">
                                {c.documento ? `Doc: ${c.documento}` : "Sin Documento"}{" "}
                                {c.telefono ? `• Tel: ${c.telefono}` : ""}
                              </p>
                            </div>
                            <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                              Cupo: {formatoCOP(c.cupoCredito || 0)}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center space-y-2">
                          <p className="text-xs text-slate-500">No encontramos coincidencias para &quot;{busquedaCredito}&quot;</p>
                          <Button
                            size="sm"
                            onClick={() => {
                              if (onAbrirRegistrarCliente) {
                                onAbrirRegistrarCliente(busquedaCredito);
                              }
                            }}
                            className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            <UserPlus className="h-3.5 w-3.5 mr-1" /> Registrar cliente con este dato
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">{clienteNombre}</p>
                        <p className="text-[11px] text-amber-900 font-bold">
                          Cupo Disponible: {formatoCOP(cupoCredito)}
                        </p>
                      </div>
                    </div>
                    {onSeleccionarCliente && (
                      <button
                        type="button"
                        onClick={() => onSeleccionarCliente(null)}
                        className="text-xs font-bold text-amber-900 hover:text-red-700 px-2 py-1 bg-white/80 rounded-lg border border-amber-200 transition-colors"
                      >
                        Cambiar Cliente
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Esta venta por valor de <strong>{formatoCOP(totalVenta)}</strong> se cargará automáticamente como saldo pendiente en la cartera del cliente con plazo de vencimiento a 30 días.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 5. VISTA PAGO DIVIDIDO / MIXTO */}
          {metodoPrincipal === "MIXTO" && (
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700">Dividir cuenta en múltiples métodos:</span>
                <span className={faltanteMixto === 0 ? "text-emerald-600" : "text-red-600 font-black"}>
                  {faltanteMixto === 0 ? "✅ Total Cuadrado" : `Faltan: ${formatoCOP(faltanteMixto)}`}
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {pagosMixtos.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <select
                      value={p.metodo}
                      onChange={(e) => actualizarLineaMixta(idx, "metodo", e.target.value)}
                      className="w-36 h-9 px-2 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-800"
                    >
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TRANSFERENCIA">Transferencia</option>
                      <option value="TARJETA">Datáfono</option>
                      <option value="CREDITO">Crédito</option>
                    </select>

                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">$</span>
                      <input
                        type="number"
                        min={1}
                        value={p.monto || ""}
                        onChange={(e) => actualizarLineaMixta(idx, "monto", Number(e.target.value))}
                        className="w-full h-9 pl-6 pr-3 text-xs font-black text-right rounded-lg border border-slate-300 bg-white text-slate-900"
                      />
                    </div>

                    {pagosMixtos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarLineaMixta(idx)}
                        className="h-9 w-9 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {faltanteMixto > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={agregarLineaMixta}
                  className="w-full text-xs font-bold bg-white text-brand-600 border-brand-200 hover:bg-brand-50"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Añadir otro método por {formatoCOP(faltanteMixto)}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer con Botón Gigante de Cobro y Confirmación */}
        <DialogFooter className="p-4 bg-white border-t border-slate-200 flex flex-row items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={cargando} className="font-bold">
            Cancelar (Esc)
          </Button>
          <Button
            size="sm"
            onClick={handleConfirmar}
            disabled={
              cargando ||
              (metodoPrincipal === "EFECTIVO" && !esEfectivoCompleto) ||
              (metodoPrincipal === "MIXTO" && !esMixtoCompleto) ||
              (metodoPrincipal === "CREDITO" && !clienteNombre)
            }
            className="h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/20 flex items-center gap-2"
          >
            <Receipt className="h-5 w-5" />
            {cargando ? "Procesando Venta..." : `Completar Venta (${formatoCOP(totalVenta)})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
