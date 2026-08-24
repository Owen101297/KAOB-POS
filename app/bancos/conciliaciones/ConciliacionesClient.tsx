"use client";

import { useState, useTransition } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import {
  CheckCheck,
  Plus,
  Landmark,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Scale,
  FileText,
  History,
  CircleDollarSign,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  crearConciliacion,
  type ConciliacionItem,
  type CuentaBancariaItem,
  type MovimientoBancarioItem,
} from "@/lib/actions/bancos";
import { formatoCOP } from "@/lib/format";

interface ConciliacionesClientProps {
  conciliaciones: ConciliacionItem[];
  cuentas: CuentaBancariaItem[];
  movimientosPendientes: MovimientoBancarioItem[];
}

export default function ConciliacionesClient({
  conciliaciones,
  cuentas,
  movimientosPendientes,
}: ConciliacionesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [modalNueva, setModalNueva] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null);

  // Form Conciliación
  const [cuentaId, setCuentaId] = useState<number | "">(cuentas[0]?.id || "");
  const [fechaCorte, setFechaCorte] = useState(new Date().toISOString().split("T")[0]);
  const [saldoExtracto, setSaldoExtracto] = useState<number | "">("");
  const [movimientosSeleccionados, setMovimientosSeleccionados] = useState<number[]>([]);
  const [notas, setNotas] = useState("");

  const cuentaSeleccionada = cuentas.find((c) => c.id === cuentaId);
  const saldoLibros = cuentaSeleccionada?.saldoActual ?? 0;
  const saldoExtNum = typeof saldoExtracto === "number" ? saldoExtracto : 0;
  const diferencia = saldoLibros - saldoExtNum;
  const estaCuadrada = saldoExtracto !== "" && diferencia === 0;

  const movsDeCuenta = movimientosPendientes.filter((m) => m.cuentaBancariaId === cuentaId);

  function abrirModal() {
    setCuentaId(cuentas[0]?.id || "");
    setFechaCorte(new Date().toISOString().split("T")[0]);
    setSaldoExtracto(cuentas[0]?.saldoActual || 0);
    setMovimientosSeleccionados(movsDeCuenta.map((m) => m.id));
    setNotas("");
    setMsg(null);
    setModalNueva(true);
  }

  function toggleMov(id: number) {
    setMovimientosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    if (movimientosSeleccionados.length === movsDeCuenta.length) {
      setMovimientosSeleccionados([]);
    } else {
      setMovimientosSeleccionados(movsDeCuenta.map((m) => m.id));
    }
  }

  async function handleGuardar() {
    setMsg(null);
    if (!cuentaId) {
      setMsg({ tipo: "err", texto: "Selecciona una cuenta bancaria." });
      return;
    }
    if (saldoExtracto === "") {
      setMsg({ tipo: "err", texto: "Ingresa el saldo según el extracto bancario." });
      return;
    }

    startTransition(async () => {
      const res = await crearConciliacion({
        cuentaBancariaId: Number(cuentaId),
        fechaCorte,
        saldoExtracto: Number(saldoExtracto),
        movimientoIds: movimientosSeleccionados,
        notas,
      });

      if (res.ok) {
        setModalNueva(false);
        router.refresh();
      } else {
        setMsg({ tipo: "err", texto: res.error });
      }
    });
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50/50 min-h-screen text-slate-900">
      <PageHeader
        title="Conciliación Bancaria"
        description="Cruza los extractos bancarios oficiales contra los registros del sistema POS para evitar descuadres."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/bancos/plataformas">
              <Button variant="outline" size="sm" className="flex items-center gap-2 font-bold bg-white text-teal-700 border-teal-200 hover:bg-teal-50">
                <CircleDollarSign className="h-4 w-4 text-teal-600" />
                Plataformas BNPL
              </Button>
            </Link>
            <Link href="/bancos">
              <Button variant="outline" size="sm" className="flex items-center gap-2 font-bold bg-white">
                <Landmark className="h-4 w-4" />
                Cuentas Bancarias
              </Button>
            </Link>
            <Button size="sm" onClick={abrirModal} className="flex items-center gap-2 font-bold">
              <Plus className="h-4 w-4" />
              Nueva Conciliación
            </Button>
          </div>
        }
      />

      {msg && (
        <div
          className={`flex items-center gap-2 p-4 rounded-xl border ${
            msg.tipo === "ok"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
          }`}
        >
          {msg.tipo === "ok" ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />}
          <span className="text-sm font-semibold">{msg.texto}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Conciliaciones Realizadas
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {conciliaciones.length}
              </h3>
            </div>
            <div className="p-3 bg-brand-50 rounded-xl text-brand-600 border border-brand-100">
              <CheckCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                Movimientos Pendientes por Conciliar
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {movimientosPendientes.length}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
              <History className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Cuentas en Balance
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {cuentas.filter((c) => c.activa).length} Cuentas
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
              <Scale className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historial de Conciliaciones */}
      <Card className="bg-white border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">Histórico de Conciliaciones de Cierre</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-slate-700 uppercase font-black tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Fecha de Corte</th>
                <th className="px-4 py-3">Cuenta Bancaria</th>
                <th className="px-4 py-3 text-right">Saldo en Libros</th>
                <th className="px-4 py-3 text-right">Saldo en Extracto</th>
                <th className="px-4 py-3 text-right">Diferencia</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {conciliaciones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 font-semibold">
                    No se han registrado conciliaciones bancarias hasta la fecha.
                  </td>
                </tr>
              ) : (
                conciliaciones.map((c) => {
                  const dif = c.diferencia;
                  const cuadrada = c.estado === "CUADRADA" || dif === 0;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-600">
                        {new Date(c.fechaCorte).toLocaleDateString("es-CO")}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-slate-900">{c.cuentaBancaria.nombre}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-slate-800">
                        {formatoCOP(c.saldoLibros)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-slate-800">
                        {formatoCOP(c.saldoExtracto)}
                      </td>
                      <td
                        className={`px-4 py-3 whitespace-nowrap text-right font-black ${
                          cuadrada ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {formatoCOP(dif)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <Badge variant={cuadrada ? "success" : "danger"}>
                          {cuadrada ? "Cuadrada" : "Con Diferencia"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate font-medium">
                        {c.notas || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Nueva Conciliación */}
      <Dialog open={modalNueva} onOpenChange={setModalNueva}>
        <DialogContent className="max-w-2xl bg-white border border-slate-200 text-slate-900 shadow-2xl p-6 max-h-[90vh] flex flex-col">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-black text-slate-900">
              <Scale className="h-5 w-5 text-brand-600" />
              Nueva Conciliación Bancaria
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cuenta Bancaria *
                </label>
                <select
                  value={cuentaId}
                  onChange={(e) => setCuentaId(Number(e.target.value))}
                  className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none cursor-pointer"
                >
                  {cuentas
                    .filter((c) => c.activa)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({formatoCOP(c.saldoActual)})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Fecha de Corte del Extracto
                </label>
                <input
                  type="date"
                  value={fechaCorte}
                  onChange={(e) => setFechaCorte(e.target.value)}
                  className="w-full h-9 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Saldo Final según Extracto Bancario (COP) *
              </label>
              <input
                type="number"
                value={saldoExtracto}
                onChange={(e) => setSaldoExtracto(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Ingresa el saldo exacto que indica el banco..."
                className="w-full h-9 px-3 text-xs font-black rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {/* Comparativa Balance */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                estaCuadrada
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-amber-50 border-amber-200 text-amber-900"
              }`}
            >
              <div>
                <span className="font-bold block">Saldo en Sistema: {formatoCOP(saldoLibros)}</span>
                <span className="text-[11px] opacity-80">
                  Saldo en Extracto: {formatoCOP(saldoExtNum)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold block">Diferencia</span>
                <span className={`text-base font-black ${estaCuadrada ? "text-emerald-700" : "text-amber-700"}`}>
                  {formatoCOP(diferencia)}
                </span>
              </div>
            </div>

            {/* Movimientos Pendientes de esta Cuenta */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-700">
                  Marcar Movimientos Verificados en el Extracto ({movimientosSeleccionados.length}/{movsDeCuenta.length})
                </label>
                {movsDeCuenta.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="text-[11px] font-bold text-brand-600 hover:underline"
                  >
                    {movimientosSeleccionados.length === movsDeCuenta.length ? "Desmarcar Todos" : "Marcar Todos"}
                  </button>
                )}
              </div>

              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-slate-50/50">
                {movsDeCuenta.length === 0 ? (
                  <p className="p-4 text-center text-slate-400 font-semibold">
                    No hay movimientos pendientes por conciliar en esta cuenta.
                  </p>
                ) : (
                  movsDeCuenta.map((m) => {
                    const sel = movimientosSeleccionados.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleMov(m.id)}
                        className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                          sel ? "bg-brand-50/70" : "hover:bg-slate-100/70"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={sel}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-brand-600 cursor-pointer"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{m.concepto}</p>
                            <p className="text-[10px] text-slate-500">
                              {new Date(m.fecha).toLocaleDateString("es-CO")} {m.referencia ? `• Ref: ${m.referencia}` : ""}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900">{formatoCOP(m.monto)}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Notas / Conclusiones del Cierre
              </label>
              <input
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones de la conciliación..."
                className="w-full h-9 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 pt-3 flex justify-between">
            <Button variant="outline" size="sm" onClick={() => setModalNueva(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleGuardar}
              disabled={isPending}
              className="font-bold"
            >
              {isPending ? "Guardando..." : "Finalizar Conciliación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
