"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
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
  CircleDollarSign,
  Landmark,
  ChevronRight,
  ShieldCheck,
  Tag,
  ArrowRight,
} from "lucide-react";
import { formatoCOP } from "@/lib/format";

export interface PagoItem {
  metodo: "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "PUNTOS" | "CREDITO" | "ADDI" | "SISTECREDITO" | "OTRO";
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

const PLATAFORMAS_PREDEFINIDAS = [
  { id: "ADDI", nombre: "Addi", icon: CircleDollarSign, badge: "Cuotas sin interés", tagColor: "bg-teal-50 text-teal-800 border-teal-200" },
  { id: "SISTECREDITO", nombre: "Sistecrédito", icon: Zap, badge: "Crédito al instante", tagColor: "bg-sky-50 text-sky-800 border-sky-200" },
  { id: "BOLD", nombre: "Bold Cuotas", icon: CreditCard, badge: "Link / Datáfono", tagColor: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { id: "SUPAY", nombre: "Su+Pay", icon: Wallet, badge: "Billetera digital", tagColor: "bg-amber-50 text-amber-800 border-amber-200" },
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
  // Método Principal
  const [metodoPrincipal, setMetodoPrincipal] = useState<
    "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "CREDITO" | "MIXTO"
  >("EFECTIVO");

  // Efectivo
  const [efectivoRecibido, setEfectivoRecibido] = useState<number>(totalVenta);

  // Transferencia
  const [referenciaTransferencia, setReferenciaTransferencia] = useState("");
  const [bancoSeleccionado, setBancoSeleccionado] = useState<string>("Nequi");

  // Crédito Unificado
  const [subTipoCredito, setSubTipoCredito] = useState<"PLATAFORMA" | "DIRECTO">("PLATAFORMA");
  const [plataformaSeleccionada, setPlataformaSeleccionada] = useState<string>("ADDI");
  const [nombreOtraPlataforma, setNombreOtraPlataforma] = useState("");
  const [referenciaAprobacionPlataforma, setReferenciaAprobacionPlataforma] = useState("");

  // Búsqueda de cliente en crédito directo
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
      setSubTipoCredito("PLATAFORMA");
      setPlataformaSeleccionada("ADDI");
      setNombreOtraPlataforma("");
      setReferenciaAprobacionPlataforma("");
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

  // Filtrado de clientes para crédito directo
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

  // Atajos Numpad Táctil
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
      if (subTipoCredito === "PLATAFORMA") {
        const platNombre =
          plataformaSeleccionada === "OTRA"
            ? nombreOtraPlataforma.trim() || "Plataforma Crédito"
            : plataformaSeleccionada;

        const metodoReal =
          plataformaSeleccionada === "ADDI"
            ? "ADDI"
            : plataformaSeleccionada === "SISTECREDITO"
            ? "SISTECREDITO"
            : "TRANSFERENCIA";

        pagosFinales = [
          {
            metodo: metodoReal,
            monto: totalVenta,
            referencia: `${platNombre}: ${referenciaAprobacionPlataforma.trim() || "Aprobado"}`,
          },
        ];
      } else {
        if (!clienteNombre) return;
        pagosFinales = [{ metodo: "CREDITO", monto: totalVenta }];
      }
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

  // Atajo Enter para cobrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Enter" && !cargando) {
        if (
          (metodoPrincipal === "EFECTIVO" && esEfectivoCompleto) ||
          metodoPrincipal === "TARJETA" ||
          (metodoPrincipal === "CREDITO" && subTipoCredito === "PLATAFORMA") ||
          (metodoPrincipal === "CREDITO" && subTipoCredito === "DIRECTO" && !!clienteNombre)
        ) {
          e.preventDefault();
          handleConfirmar();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, cargando, metodoPrincipal, esEfectivoCompleto, subTipoCredito, clienteNombre, totalVenta]);

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-5xl w-[96vw] max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white border border-slate-200 text-slate-900 shadow-2xl rounded-2xl sm:rounded-3xl">
        {/* Layout Responsive: Stack vertical en móviles/tablets y dos columnas en desktop */}
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 min-h-0 overflow-hidden">
          {/* ───────────────────────── COLUMNA IZQUIERDA: MENÚ DE MÉTODOS & TOTAL (4 cols) ───────────────────────── */}
          <div className="lg:col-span-4 bg-slate-900 text-white p-4 sm:p-5 lg:p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 shrink-0">
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              {/* Header Total Responsive */}
              <div className="flex items-center justify-between lg:block">
                <div>
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 block">
                    Total a Cobrar
                  </span>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mt-0.5">
                    {formatoCOP(totalVenta)}
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700 lg:bg-transparent lg:border-0 lg:p-0 lg:mt-2">
                  <UserCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="truncate max-w-[120px] sm:max-w-[180px]">
                    {clienteNombre ? (
                      <strong className="text-white">{clienteNombre}</strong>
                    ) : (
                      "Cliente General"
                    )}
                  </span>
                </div>
              </div>

              {/* Botones de Métodos de Pago: Horizontal en mobile/tablet, vertical en Desktop */}
              <div className="space-y-1.5 lg:space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hidden lg:block">
                  Forma de Cobro
                </span>

                <div className="grid grid-cols-5 lg:grid-cols-1 gap-1 sm:gap-1.5 lg:gap-2">
                  {/* 1. Efectivo */}
                  <button
                    type="button"
                    onClick={() => setMetodoPrincipal("EFECTIVO")}
                    className={`p-2 sm:p-2.5 lg:p-3 rounded-xl lg:rounded-2xl transition-all flex flex-col lg:flex-row items-center justify-center lg:justify-between group text-center lg:text-left ${
                      metodoPrincipal === "EFECTIVO"
                        ? "bg-emerald-500 text-slate-950 shadow-md lg:shadow-lg shadow-emerald-500/25 font-black"
                        : "bg-slate-800/80 text-slate-200 hover:bg-slate-800 font-bold"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-center gap-1 lg:gap-3">
                      <div
                        className={`h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 rounded-lg lg:rounded-xl flex items-center justify-center ${
                          metodoPrincipal === "EFECTIVO" ? "bg-slate-950 text-emerald-400" : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        <DollarSign className="h-4 w-4 lg:h-5 lg:w-5" />
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs">Efectivo</p>
                        <p className={`text-[10px] hidden lg:block ${metodoPrincipal === "EFECTIVO" ? "text-slate-800" : "text-slate-400"}`}>
                          Billetes y cambio
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 hidden lg:block ${metodoPrincipal === "EFECTIVO" ? "text-slate-950" : "text-slate-500"}`} />
                  </button>

                  {/* 2. Transferencia */}
                  <button
                    type="button"
                    onClick={() => setMetodoPrincipal("TRANSFERENCIA")}
                    className={`p-2 sm:p-2.5 lg:p-3 rounded-xl lg:rounded-2xl transition-all flex flex-col lg:flex-row items-center justify-center lg:justify-between group text-center lg:text-left ${
                      metodoPrincipal === "TRANSFERENCIA"
                        ? "bg-blue-500 text-white shadow-md lg:shadow-lg shadow-blue-500/25 font-black"
                        : "bg-slate-800/80 text-slate-200 hover:bg-slate-800 font-bold"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-center gap-1 lg:gap-3">
                      <div
                        className={`h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 rounded-lg lg:rounded-xl flex items-center justify-center ${
                          metodoPrincipal === "TRANSFERENCIA" ? "bg-white text-blue-600" : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        <Smartphone className="h-4 w-4 lg:h-5 lg:w-5" />
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs">Transf.</p>
                        <p className={`text-[10px] hidden lg:block ${metodoPrincipal === "TRANSFERENCIA" ? "text-blue-100" : "text-slate-400"}`}>
                          Nequi, Bancolombia
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 hidden lg:block ${metodoPrincipal === "TRANSFERENCIA" ? "text-white" : "text-slate-500"}`} />
                  </button>

                  {/* 3. Datáfono */}
                  <button
                    type="button"
                    onClick={() => setMetodoPrincipal("TARJETA")}
                    className={`p-2 sm:p-2.5 lg:p-3 rounded-xl lg:rounded-2xl transition-all flex flex-col lg:flex-row items-center justify-center lg:justify-between group text-center lg:text-left ${
                      metodoPrincipal === "TARJETA"
                        ? "bg-purple-500 text-white shadow-md lg:shadow-lg shadow-purple-500/25 font-black"
                        : "bg-slate-800/80 text-slate-200 hover:bg-slate-800 font-bold"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-center gap-1 lg:gap-3">
                      <div
                        className={`h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 rounded-lg lg:rounded-xl flex items-center justify-center ${
                          metodoPrincipal === "TARJETA" ? "bg-white text-purple-600" : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        <CreditCard className="h-4 w-4 lg:h-5 lg:w-5" />
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs">Datáfono</p>
                        <p className={`text-[10px] hidden lg:block ${metodoPrincipal === "TARJETA" ? "text-purple-100" : "text-slate-400"}`}>
                          Tarjetas Débito/Crédito
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 hidden lg:block ${metodoPrincipal === "TARJETA" ? "text-white" : "text-slate-500"}`} />
                  </button>

                  {/* 4. Crédito */}
                  <button
                    type="button"
                    onClick={() => setMetodoPrincipal("CREDITO")}
                    className={`p-2 sm:p-2.5 lg:p-3 rounded-xl lg:rounded-2xl transition-all flex flex-col lg:flex-row items-center justify-center lg:justify-between group text-center lg:text-left ${
                      metodoPrincipal === "CREDITO"
                        ? "bg-amber-500 text-slate-950 shadow-md lg:shadow-lg shadow-amber-500/25 font-black"
                        : "bg-slate-800/80 text-slate-200 hover:bg-slate-800 font-bold"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-center gap-1 lg:gap-3">
                      <div
                        className={`h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 rounded-lg lg:rounded-xl flex items-center justify-center ${
                          metodoPrincipal === "CREDITO" ? "bg-slate-950 text-amber-400" : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        <Wallet className="h-4 w-4 lg:h-5 lg:w-5" />
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs">Crédito</p>
                        <p className={`text-[10px] hidden lg:block ${metodoPrincipal === "CREDITO" ? "text-slate-800" : "text-slate-400"}`}>
                          Addi, Sistecrédito, Fiado
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 hidden lg:block ${metodoPrincipal === "CREDITO" ? "text-slate-950" : "text-slate-500"}`} />
                  </button>

                  {/* 5. Dividido */}
                  <button
                    type="button"
                    onClick={() => setMetodoPrincipal("MIXTO")}
                    className={`p-2 sm:p-2.5 lg:p-3 rounded-xl lg:rounded-2xl transition-all flex flex-col lg:flex-row items-center justify-center lg:justify-between group text-center lg:text-left ${
                      metodoPrincipal === "MIXTO"
                        ? "bg-indigo-500 text-white shadow-md lg:shadow-lg shadow-indigo-500/25 font-black"
                        : "bg-slate-800/80 text-slate-200 hover:bg-slate-800 font-bold"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-center gap-1 lg:gap-3">
                      <div
                        className={`h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 rounded-lg lg:rounded-xl flex items-center justify-center ${
                          metodoPrincipal === "MIXTO" ? "bg-white text-indigo-600" : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        <Sparkles className="h-4 w-4 lg:h-5 lg:w-5" />
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs">Dividido</p>
                        <p className={`text-[10px] hidden lg:block ${metodoPrincipal === "MIXTO" ? "text-indigo-100" : "text-slate-400"}`}>
                          Múltiples métodos
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 hidden lg:block ${metodoPrincipal === "MIXTO" ? "text-white" : "text-slate-500"}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Badge de Seguridad POS en Desktop */}
            <div className="pt-3 border-t border-slate-800 text-[10px] sm:text-[11px] text-slate-400 hidden lg:flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Transacción encriptada y sincronizada</span>
            </div>
          </div>

          {/* ───────────────────────── COLUMNA DERECHA: LIENZO INTERACTIVO DEL MÉTODO (8 cols) ───────────────────────── */}
          <div className="lg:col-span-8 p-4 sm:p-6 lg:p-8 bg-slate-50/60 flex flex-col justify-between overflow-y-auto space-y-4 sm:space-y-6">
            {/* 1. VISTA EFECTIVO */}
            {metodoPrincipal === "EFECTIVO" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center">
                <div className="md:col-span-7 space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Dinero Recibido del Cliente
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 sm:top-3 text-xl sm:text-2xl font-black text-slate-400">$</span>
                      <input
                        type="number"
                        min={0}
                        value={efectivoRecibido || ""}
                        onChange={(e) => setEfectivoRecibido(Number(e.target.value))}
                        className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-2xl sm:text-3xl font-black rounded-xl sm:rounded-2xl border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                      Billetes Rápidos en 1 Clic
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEfectivoRecibido(totalVenta)}
                        className="py-2 px-1 rounded-xl text-xs font-black bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs text-center"
                      >
                        ⚡ Exacto
                      </button>
                      {DENOMINACIONES.map((d) => (
                        <button
                          key={d.valor}
                          type="button"
                          onClick={() => sumarBillete(d.valor)}
                          className="py-2 px-1 rounded-xl text-xs font-black bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 border border-slate-300 hover:border-emerald-300 transition-colors shadow-2xs text-center"
                        >
                          +{d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Banner de Cambio */}
                  <div
                    className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border flex items-center justify-between transition-all ${
                      esEfectivoCompleto
                        ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                        : "bg-red-50 border-red-200 text-red-950"
                    }`}
                  >
                    <div>
                      <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider opacity-80 block">
                        {esEfectivoCompleto ? "Cambio / Vueltas a Entregar" : "Dinero Faltante"}
                      </span>
                      <span
                        className={`text-xl sm:text-2xl lg:text-3xl font-black ${
                          esEfectivoCompleto ? "text-emerald-700" : "text-red-600"
                        }`}
                      >
                        {formatoCOP(esEfectivoCompleto ? cambioEfectivo : faltanteEfectivo)}
                      </span>
                    </div>
                    {esEfectivoCompleto ? (
                      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Check className="h-5 w-5 sm:h-6 sm:w-6 stroke-[3]" />
                      </div>
                    ) : (
                      <Badge variant="danger" className="text-xs font-bold">
                        Incompleto
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Numpad Táctil */}
                <div className="md:col-span-5 bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 text-center">
                    Teclado Táctil
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "00", "BACKSPACE"].map((tecla) => (
                      <button
                        key={tecla}
                        type="button"
                        onClick={() => presionarNumero(tecla)}
                        className={`h-9 sm:h-11 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center ${
                          tecla === "BACKSPACE"
                            ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                            : "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200"
                        }`}
                      >
                        {tecla === "BACKSPACE" ? <Delete className="h-4 w-4 sm:h-5 sm:w-5" /> : tecla}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => presionarNumero("CLEAR")}
                      className="py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
                    >
                      Borrar
                    </button>
                    <button
                      type="button"
                      onClick={() => presionarNumero("EXACTO")}
                      className="py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                    >
                      Exacto
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. VISTA TRANSFERENCIA BANCARIA */}
            {metodoPrincipal === "TRANSFERENCIA" && (
              <div className="max-w-xl mx-auto w-full bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                    Selecciona la Entidad / Billetera
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {["Nequi", "Bancolombia", "Daviplata", "Otro Banco"].map((banco) => (
                      <button
                        key={banco}
                        type="button"
                        onClick={() => setBancoSeleccionado(banco)}
                        className={`py-2.5 sm:py-3 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
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
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    Número de Aprobación o Comprobante
                  </label>
                  <input
                    type="text"
                    value={referenciaTransferencia}
                    onChange={(e) => setReferenciaTransferencia(e.target.value)}
                    placeholder="Ej. M1928374 o N° de Aprobación"
                    className="w-full h-11 px-3.5 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                    El comprobante se vinculará a la venta para cuadre y conciliación bancaria.
                  </p>
                </div>
              </div>
            )}

            {/* 3. VISTA DATÁFONO / TARJETA */}
            {metodoPrincipal === "TARJETA" && (
              <div className="p-6 sm:p-8 max-w-xl mx-auto w-full bg-white rounded-2xl border border-purple-200 text-center space-y-3 sm:space-y-4 shadow-2xs">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-100">
                  <CreditCard className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">Cobro con Datáfono (Débito / Crédito)</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Pasa la tarjeta en tu datáfono físico por el valor exacto de{" "}
                    <strong className="text-slate-900">{formatoCOP(totalVenta)}</strong> y confirma la venta.
                  </p>
                </div>
              </div>
            )}

            {/* 4. VISTA CRÉDITO UNIFICADO (PLATAFORMAS BNPL + FIADO DIRECTO) */}
            {metodoPrincipal === "CREDITO" && (
              <div className="max-w-2xl mx-auto w-full space-y-3 sm:space-y-4">
                {/* Sub-Switch de Pestañas */}
                <div className="flex items-center justify-center p-1 bg-slate-200/80 rounded-2xl max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={() => setSubTipoCredito("PLATAFORMA")}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                      subTipoCredito === "PLATAFORMA"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <CircleDollarSign className="h-4 w-4 text-teal-600" />
                    <span>Plataformas (Addi/Sistecrédito)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubTipoCredito("DIRECTO")}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                      subTipoCredito === "DIRECTO"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Wallet className="h-4 w-4 text-amber-600" />
                    <span>Crédito Directo (Fiado)</span>
                  </button>
                </div>

                {/* Sub-Vista A: PLATAFORMAS EXTERNAS */}
                {subTipoCredito === "PLATAFORMA" && (
                  <div className="bg-white p-4 sm:p-6 rounded-2xl border border-teal-200 shadow-2xs space-y-4 sm:space-y-5">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                        Selecciona la Plataforma
                      </label>

                      {/* Tarjetas de Plataformas Predefinidas + Botón "+ Otra" */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {PLATAFORMAS_PREDEFINIDAS.map((plat) => {
                          const Icono = plat.icon;
                          const estaSeleccionada = plataformaSeleccionada === plat.id;
                          return (
                            <button
                              key={plat.id}
                              type="button"
                              onClick={() => setPlataformaSeleccionada(plat.id)}
                              className={`p-2.5 sm:p-3 rounded-xl border text-xs font-black transition-all flex flex-col items-center gap-1 text-center ${
                                estaSeleccionada
                                  ? "bg-slate-900 border-slate-900 text-white shadow-sm ring-2 ring-teal-500/20"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              <Icono className={`h-4 w-4 ${estaSeleccionada ? "text-teal-400" : "text-slate-500"}`} />
                              <span>{plat.nombre}</span>
                            </button>
                          );
                        })}

                        {/* Botón "+ Otra Plataforma" */}
                        <button
                          type="button"
                          onClick={() => setPlataformaSeleccionada("OTRA")}
                          className={`p-2.5 sm:p-3 rounded-xl border text-xs font-black transition-all flex flex-col items-center gap-1 text-center ${
                            plataformaSeleccionada === "OTRA"
                              ? "bg-slate-900 border-slate-900 text-white shadow-sm ring-2 ring-teal-500/20"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <Plus className={`h-4 w-4 ${plataformaSeleccionada === "OTRA" ? "text-teal-400" : "text-slate-500"}`} />
                          <span>+ Otra</span>
                        </button>
                      </div>
                    </div>

                    {/* Si seleccionó "Otra Plataforma", pedir nombre dinámico */}
                    {plataformaSeleccionada === "OTRA" && (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Nombre de la Plataforma de Crédito *
                        </label>
                        <input
                          type="text"
                          value={nombreOtraPlataforma}
                          onChange={(e) => setNombreOtraPlataforma(e.target.value)}
                          placeholder="Ej. Credivalores, Sufi, Bancolombia Cuotas..."
                          className="w-full h-10 px-3.5 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                          autoFocus
                        />
                      </div>
                    )}

                    {/* Número de Aprobación */}
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                        Número / Código de Aprobación de la Plataforma *
                      </label>
                      <input
                        type="text"
                        value={referenciaAprobacionPlataforma}
                        onChange={(e) => setReferenciaAprobacionPlataforma(e.target.value)}
                        placeholder="Ej. AD-982310, SC-482910 o Código de Transacción"
                        className="w-full h-11 px-3.5 text-xs font-bold rounded-xl border border-teal-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                      />
                      <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                        📌 Esta venta se acumulará en <strong>Cuentas por Cobrar a Plataformas</strong> para su posterior desembolso al banco.
                      </p>
                    </div>
                  </div>
                )}

                {/* Sub-Vista B: CRÉDITO DIRECTO (FIADO EN CARTERA) */}
                {subTipoCredito === "DIRECTO" && (
                  <div className="bg-white p-4 sm:p-6 rounded-2xl border border-amber-200 shadow-2xs space-y-3 sm:space-y-4">
                    {!clienteNombre ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                          <p className="font-bold flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                            Selecciona o registra un cliente para crédito directo (fiado)
                          </p>
                          <p className="mt-1 text-[11px] text-amber-800">
                            Busca el cliente por cédula o nombre, o regístralo en 1 clic:
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                              <input
                                type="text"
                                value={busquedaCredito}
                                onChange={(e) => setBusquedaCredito(e.target.value)}
                                placeholder="Escribe Cédula, NIT o Nombre del cliente..."
                                className="w-full h-11 pl-9 pr-3 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-amber-500/30"
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
                              className="h-11 text-xs font-bold border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 shrink-0 px-3.5 flex items-center gap-1.5"
                            >
                              <UserPlus className="h-4 w-4 text-amber-700" />
                              <span className="hidden sm:inline">+ Registrar</span>
                            </Button>
                          </div>

                          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-40 sm:max-h-48 overflow-y-auto bg-slate-50">
                            {clientesFiltradosCredito.length > 0 ? (
                              clientesFiltradosCredito.map((c) => (
                                <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  if (onSeleccionarCliente) onSeleccionarCliente(c);
                                }}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-amber-100/70 transition-colors border-b border-slate-200/70 last:border-0 flex items-center justify-between"
                              >
                                <div>
                                  <p className="font-bold text-slate-900">{c.nombre}</p>
                                  <p className="text-[10px] text-slate-500">
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
                          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
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
                            className="text-xs font-bold text-amber-900 hover:text-red-700 px-3 py-1.5 bg-white rounded-lg border border-amber-200 transition-colors shadow-2xs"
                          >
                            Cambiar
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        Esta compra por <strong>{formatoCOP(totalVenta)}</strong> se cargará como saldo pendiente en la cartera del cliente a 30 días.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 5. VISTA PAGO DIVIDIDO / MIXTO */}
          {metodoPrincipal === "MIXTO" && (
            <div className="space-y-3 sm:space-y-4 max-w-2xl mx-auto w-full bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700">Dividir cuenta en múltiples métodos:</span>
                <span className={faltanteMixto === 0 ? "text-emerald-600 font-black" : "text-red-600 font-black"}>
                  {faltanteMixto === 0 ? "✅ Total Cuadrado" : `Faltan: ${formatoCOP(faltanteMixto)}`}
                </span>
              </div>

              <div className="space-y-2 max-h-48 sm:max-h-56 overflow-y-auto">
                {pagosMixtos.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <select
                      value={p.metodo}
                      onChange={(e) => actualizarLineaMixta(idx, "metodo", e.target.value)}
                      className="w-32 sm:w-40 h-9 sm:h-10 px-2 sm:px-3 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-800"
                    >
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TRANSFERENCIA">Transferencia</option>
                      <option value="TARJETA">Datáfono</option>
                      <option value="ADDI">Addi</option>
                      <option value="SISTECREDITO">Sistecrédito</option>
                      <option value="CREDITO">Crédito Directo</option>
                    </select>

                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-2 sm:top-2.5 text-xs font-bold text-slate-400">$</span>
                      <input
                        type="number"
                        min={1}
                        value={p.monto || ""}
                        onChange={(e) => actualizarLineaMixta(idx, "monto", Number(e.target.value))}
                        className="w-full h-9 sm:h-10 pl-6 pr-2 text-xs font-black text-right rounded-lg border border-slate-300 bg-white text-slate-900"
                      />
                    </div>

                    {pagosMixtos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarLineaMixta(idx)}
                        className="h-9 w-9 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg shrink-0"
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
                  className="w-full text-xs font-bold bg-white text-brand-600 border-brand-200 hover:bg-brand-50 h-9 sm:h-10"
                >
                  <Plus className="h-4 w-4 mr-1" /> Añadir otro método por {formatoCOP(faltanteMixto)}
                </Button>
              )}
            </div>
          )}

          {/* Footer de Acciones Integrado */}
          <div className="pt-3 sm:pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4 shrink-0">
            <Button variant="outline" size="sm" onClick={onClose} disabled={cargando} className="font-bold text-xs h-10 sm:h-11 px-5 rounded-xl order-2 sm:order-1">
              Cancelar (Esc)
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmar}
              disabled={
                cargando ||
                (metodoPrincipal === "EFECTIVO" && !esEfectivoCompleto) ||
                (metodoPrincipal === "MIXTO" && !esMixtoCompleto) ||
                (metodoPrincipal === "CREDITO" && subTipoCredito === "DIRECTO" && !clienteNombre)
              }
              className="h-11 sm:h-12 px-6 sm:px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/20 flex items-center gap-2 rounded-xl flex-1 justify-center order-1 sm:order-2"
            >
              <Receipt className="h-5 w-5" />
              {cargando ? "Procesando Venta..." : `Completar Venta (${formatoCOP(totalVenta)})`}
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
}
