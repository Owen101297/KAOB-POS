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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  crearConciliacion,
  type ConciliacionItem,
  type CuentaBancariaItem,
  type MovimientoBancarioItem,
} from "@/lib/actions/bancos";

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
    <div className="space-y-6 p-6">
      <PageHeader
        title="Conciliaciones Bancarias"
        description="Coteja los extractos oficiales del banco con los movimientos registrados en el sistema KAOB."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/bancos">
              <Button variant="outline" className="flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                Cuentas
              </Button>
            </Link>
            <Link href="/bancos/movimientos">
              <Button variant="outline" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Movimientos
              </Button>
            </Link>
            <Button variant="primary" onClick={abrirModal} className="flex items-center gap-2">
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
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
          }`}
        >
          {msg.tipo === "ok" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <span className="text-sm font-medium">{msg.texto}</span>
        </div>
      )}

      {/* Historial de Conciliaciones */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3">Fecha de Corte</th>
                <th className="px-4 py-3">Cuenta Bancaria</th>
                <th className="px-4 py-3 text-right">Saldo Libros</th>
                <th className="px-4 py-3 text-right">Saldo Extracto</th>
                <th className="px-4 py-3 text-right">Diferencia</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {conciliaciones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    No se han registrado conciliaciones bancarias aún. Haz clic en &quot;Nueva Conciliación&quot; para iniciar.
                  </td>
                </tr>
              ) : (
                conciliaciones.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-gray-900 dark:text-white">
                      {new Date(c.fechaCorte).toLocaleDateString("es-CO", { timeZone: "UTC" })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full inline-block"
                          style={{ backgroundColor: c.cuentaBancaria.color || "#2563eb" }}
                        />
                        {c.cuentaBancaria.nombre}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-medium text-gray-900 dark:text-white">
                      ${c.saldoLibros.toLocaleString("es-CO")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-medium text-gray-900 dark:text-white">
                      ${c.saldoExtracto.toLocaleString("es-CO")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-bold">
                      <span
                        className={
                          c.diferencia === 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        ${c.diferencia.toLocaleString("es-CO")}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <Badge variant={c.estado === "CUADRADA" ? "success" : "danger"}>
                        {c.estado === "CUADRADA" ? "Cuadrada (Exacta)" : "Con Diferencia"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 max-w-xs truncate">
                      {c.notas || "Sin observaciones"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Nueva Conciliación */}
      <Dialog open={modalNueva} onOpenChange={setModalNueva}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCheck className="h-5 w-5 text-blue-600" />
              Nueva Conciliación Bancaria
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  Cuenta Bancaria a Conciliar *
                </label>
                <select
                  value={cuentaId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setCuentaId(id);
                    const cuenta = cuentas.find((c) => c.id === id);
                    if (cuenta) setSaldoExtracto(cuenta.saldoActual);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  {cuentas
                    .filter((c) => c.activa)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} (Saldo Libros: ${c.saldoActual.toLocaleString("es-CO")})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  Fecha de Corte del Extracto *
                </label>
                <input
                  type="date"
                  value={fechaCorte}
                  onChange={(e) => setFechaCorte(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Comparativa de Saldos */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900 text-white shadow-inner">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                  Saldo en Libros (Sistema)
                </span>
                <span className="text-xl font-bold font-mono text-blue-300">
                  ${saldoLibros.toLocaleString("es-CO")}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                  Saldo según Extracto Banco *
                </span>
                <div className="relative mt-0.5">
                  <span className="absolute left-2 top-1.5 text-xs text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    value={saldoExtracto}
                    onChange={(e) => setSaldoExtracto(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full pl-6 pr-2 py-1 text-sm bg-slate-800 border border-slate-700 rounded text-white font-mono font-bold focus:ring-1 focus:ring-blue-400"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                  Diferencia / Descuadre
                </span>
                <span
                  className={`text-xl font-bold font-mono ${
                    estaCuadrada ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  ${diferencia.toLocaleString("es-CO")}
                </span>
              </div>
            </div>

            {/* Lista de Movimientos Pendientes para Marcar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  Movimientos Pendientes de Conciliar ({movsDeCuenta.length})
                </span>
                {movsDeCuenta.length > 0 && (
                  <Button size="sm" variant="ghost" onClick={toggleAll} className="h-6 text-xs text-blue-600">
                    {movimientosSeleccionados.length === movsDeCuenta.length ? "Desmarcar todos" : "Marcar todos"}
                  </Button>
                )}
              </div>

              <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
                {movsDeCuenta.length === 0 ? (
                  <p className="p-4 text-center text-xs text-gray-500">
                    Todos los movimientos de esta cuenta ya se encuentran conciliados.
                  </p>
                ) : (
                  movsDeCuenta.map((m) => (
                    <label
                      key={m.id}
                      className="flex items-center justify-between p-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={movimientosSeleccionados.includes(m.id)}
                          onChange={() => toggleMov(m.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white block">
                            {m.concepto}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(m.fecha).toLocaleDateString("es-CO")} • Ref: {m.referencia || "N/A"}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">
                        ${m.monto.toLocaleString("es-CO")}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                Notas y Justificación de Diferencias (Opcional)
              </label>
              <input
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej. Cheques girados y no cobrados, consignaciones en tránsito..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalNueva(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleGuardar} disabled={isPending}>
              {isPending ? "Guardando..." : "Cerrar y Guardar Conciliación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
