"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  DollarSign,
  CreditCard,
  Building,
  Award,
  Wallet,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Plus,
  Trash2,
} from "lucide-react";
import { formatoCOP } from "@/lib/format";

export interface PagoItem {
  metodo: "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "PUNTOS" | "CREDITO" | "OTRO";
  monto: number;
  referencia?: string;
}

interface ModalCobroPOSProps {
  open: boolean;
  onClose: () => void;
  totalVenta: number;
  onConfirmarVenta: (pagos: PagoItem[], recibidoEfectivo: number, cambioEfectivo: number) => Promise<void>;
  cargando: boolean;
  clienteNombre?: string;
  cupoCredito?: number;
}

const DENOMINACIONES = [
  { valor: 10000, label: "$10.000" },
  { valor: 20000, label: "$20.000" },
  { valor: 50000, label: "$50.000" },
  { valor: 100000, label: "$100.000" },
  { valor: 200000, label: "$200.000" },
];

export default function ModalCobroPOS({
  open,
  onClose,
  totalVenta,
  onConfirmarVenta,
  cargando,
  clienteNombre,
  cupoCredito = 0,
}: ModalCobroPOSProps) {
  const [metodoPrincipal, setMetodoPrincipal] = useState<
    "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "CREDITO" | "MIXTO"
  >("EFECTIVO");

  // Efectivo directo
  const [efectivoRecibido, setEfectivoRecibido] = useState<number>(totalVenta);
  const [referenciaTransferencia, setReferenciaTransferencia] = useState("");

  // Pagos mixtos
  const [pagosMixtos, setPagosMixtos] = useState<PagoItem[]>([
    { metodo: "EFECTIVO", monto: totalVenta },
  ]);

  useEffect(() => {
    if (open) {
      setMetodoPrincipal("EFECTIVO");
      setEfectivoRecibido(totalVenta);
      setReferenciaTransferencia("");
      setPagosMixtos([{ metodo: "EFECTIVO", monto: totalVenta }]);
    }
  }, [open, totalVenta]);

  const cambioEfectivo = Math.max(0, efectivoRecibido - totalVenta);
  const totalMixto = pagosMixtos.reduce((a, p) => a + p.monto, 0);
  const faltanteMixto = Math.max(0, totalVenta - totalMixto);

  const setBilletes = (monto: number) => {
    setEfectivoRecibido((prev) => (prev === totalVenta ? monto : prev + monto));
  };

  const setMontoExacto = () => {
    setEfectivoRecibido(totalVenta);
  };

  const handleConfirmar = async () => {
    let pagosFinales: PagoItem[] = [];

    if (metodoPrincipal === "EFECTIVO") {
      pagosFinales = [{ metodo: "EFECTIVO", monto: totalVenta }];
    } else if (metodoPrincipal === "TRANSFERENCIA") {
      pagosFinales = [
        {
          metodo: "TRANSFERENCIA",
          monto: totalVenta,
          referencia: referenciaTransferencia || "TRANSFERENCIA",
        },
      ];
    } else if (metodoPrincipal === "TARJETA") {
      pagosFinales = [{ metodo: "TARJETA", monto: totalVenta }];
    } else if (metodoPrincipal === "CREDITO") {
      pagosFinales = [{ metodo: "CREDITO", monto: totalVenta }];
    } else {
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

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white dark:bg-slate-900">
        {/* Cabecera con Total Gigante */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white text-center space-y-1">
          <span className="text-xs uppercase tracking-widest text-indigo-300 font-semibold">
            Total a Cobrar
          </span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            {formatoCOP(totalVenta)}
          </h2>
          {clienteNombre && (
            <p className="text-xs text-indigo-200 pt-1">
              Cliente: <strong className="text-white">{clienteNombre}</strong>
            </p>
          )}
        </div>

        <div className="p-6 space-y-5">
          {/* Métodos de Pago Tabs */}
          <div className="grid grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => setMetodoPrincipal("EFECTIVO")}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                metodoPrincipal === "EFECTIVO"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-600 shadow-md ring-2 ring-emerald-500/20 font-bold"
                  : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <DollarSign className="h-5 w-5 text-emerald-600" />
              <span className="text-xs">Efectivo</span>
            </button>

            <button
              type="button"
              onClick={() => setMetodoPrincipal("TRANSFERENCIA")}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                metodoPrincipal === "TRANSFERENCIA"
                  ? "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-600 shadow-md ring-2 ring-blue-500/20 font-bold"
                  : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <Building className="h-5 w-5 text-blue-600" />
              <span className="text-xs">Transferencia</span>
            </button>

            <button
              type="button"
              onClick={() => setMetodoPrincipal("TARJETA")}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                metodoPrincipal === "TARJETA"
                  ? "border-purple-500 bg-purple-50 text-purple-900 dark:bg-purple-950/50 dark:text-purple-200 dark:border-purple-600 shadow-md ring-2 ring-purple-500/20 font-bold"
                  : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <CreditCard className="h-5 w-5 text-purple-600" />
              <span className="text-xs">Datáfono</span>
            </button>

            <button
              type="button"
              onClick={() => setMetodoPrincipal("CREDITO")}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                metodoPrincipal === "CREDITO"
                  ? "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-600 shadow-md ring-2 ring-amber-500/20 font-bold"
                  : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <Wallet className="h-5 w-5 text-amber-600" />
              <span className="text-xs">A Crédito</span>
            </button>

            <button
              type="button"
              onClick={() => setMetodoPrincipal("MIXTO")}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                metodoPrincipal === "MIXTO"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200 dark:border-indigo-600 shadow-md ring-2 ring-indigo-500/20 font-bold"
                  : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <span className="text-xs">Pago Mixto</span>
            </button>
          </div>

          {/* VISTA EFECTIVO: Atajos de Billetes + Calculadora de Cambio */}
          {metodoPrincipal === "EFECTIVO" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                  Efectivo Recibido del Cliente (COP)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-lg font-bold text-gray-400">$</span>
                  <input
                    type="number"
                    min={0}
                    value={efectivoRecibido || ""}
                    onChange={(e) => setEfectivoRecibido(Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-2.5 text-2xl font-black rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Botones de Atajos de Billetes */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={setMontoExacto}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                >
                  ⚡ Monto Exacto
                </button>
                {DENOMINACIONES.map((d) => (
                  <button
                    key={d.valor}
                    type="button"
                    onClick={() => setBilletes(d.valor)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  >
                    + {d.label}
                  </button>
                ))}
              </div>

              {/* Caja de Vueltas / Cambio */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-emerald-700 dark:text-emerald-400 block">
                    Cambio / Vueltas a entregar
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-800 dark:text-emerald-300">
                    {formatoCOP(cambioEfectivo)}
                  </span>
                </div>
                {efectivoRecibido < totalVenta && (
                  <Badge variant="danger" className="text-xs">
                    Faltan {formatoCOP(totalVenta - efectivoRecibido)}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* VISTA TRANSFERENCIA: Nequi / Daviplata / Bancolombia */}
          {metodoPrincipal === "TRANSFERENCIA" && (
            <div className="space-y-3 p-4 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
              <label className="block text-xs font-semibold uppercase tracking-wider text-blue-900 dark:text-blue-300 mb-1">
                Número de Aprobación / Referencia de Transferencia
              </label>
              <input
                type="text"
                value={referenciaTransferencia}
                onChange={(e) => setReferenciaTransferencia(e.target.value)}
                placeholder="Ej. M12345678 (Nequi / Daviplata / Bancolombia)"
                className="w-full px-3 py-2 text-sm rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-blue-700 dark:text-blue-400">
                El comprobante quedará enlazado a la venta para la conciliación bancaria.
              </p>
            </div>
          )}

          {/* VISTA CREDITO: Información de Cupo */}
          {metodoPrincipal === "CREDITO" && (
            <div className="space-y-2 p-4 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-800 dark:text-amber-300 font-semibold">
                  Cupo de Crédito Disponible:
                </span>
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  {formatoCOP(cupoCredito)}
                </span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Esta venta se cargará a la cartera del cliente con plazo de vencimiento.
              </p>
            </div>
          )}

          {/* VISTA PAGOS MIXTOS */}
          {metodoPrincipal === "MIXTO" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400">
                <span>Desglose de Métodos</span>
                <span>Faltante: {formatoCOP(faltanteMixto)}</span>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {pagosMixtos.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={p.metodo}
                      onChange={(e) => actualizarLineaMixta(idx, "metodo", e.target.value)}
                      className="w-40 px-2 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                    >
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TRANSFERENCIA">Transferencia</option>
                      <option value="TARJETA">Tarjeta</option>
                      <option value="CREDITO">Crédito</option>
                    </select>

                    <input
                      type="number"
                      value={p.monto || ""}
                      onChange={(e) => actualizarLineaMixta(idx, "monto", Number(e.target.value))}
                      className="flex-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-300 dark:border-gray-700 text-right"
                    />

                    {pagosMixtos.length > 1 && (
                      <button
                        onClick={() => eliminarLineaMixta(idx)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {faltanteMixto > 0 && (
                <Button size="sm" variant="outline" onClick={agregarLineaMixta} className="text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Agregar otro método de pago
                </Button>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-gray-800 flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={cargando}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmar}
            disabled={cargando || (metodoPrincipal === "EFECTIVO" && efectivoRecibido < totalVenta)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-lg shadow-emerald-600/20"
          >
            {cargando ? "Confirmando Venta..." : "Cobrar e Imprimir Ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
