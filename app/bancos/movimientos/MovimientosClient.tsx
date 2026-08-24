"use client";

import { useState, useTransition } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import {
  History,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Percent,
  Search,
  CheckCircle2,
  AlertCircle,
  Landmark,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  registrarMovimientoBancario,
  type MovimientoBancarioItem,
  type CuentaBancariaItem,
} from "@/lib/actions/bancos";

interface MovimientosClientProps {
  movimientos: MovimientoBancarioItem[];
  cuentas: CuentaBancariaItem[];
}

export default function MovimientosClient({ movimientos, cuentas }: MovimientosClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [modalNuevo, setModalNuevo] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null);

  // Filtros
  const [cuentaFiltro, setCuentaFiltro] = useState<number | "TODAS">("TODAS");
  const [tipoFiltro, setTipoFiltro] = useState("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // Form Nuevo Movimiento
  const [cuentaId, setCuentaId] = useState<number | "">(cuentas[0]?.id || "");
  const [tipoMov, setTipoMov] = useState<"INGRESO" | "EGRESO" | "COMISION_BANCARIA" | "AJUSTE">("INGRESO");
  const [monto, setMonto] = useState(0);
  const [concepto, setConcepto] = useState("");
  const [referencia, setReferencia] = useState("");
  const [categoria, setCategoria] = useState("OTRO");

  const movimientosFiltrados = movimientos.filter((m) => {
    if (cuentaFiltro !== "TODAS" && m.cuentaBancariaId !== cuentaFiltro) return false;
    if (tipoFiltro !== "TODOS" && m.tipo !== tipoFiltro) return false;
    if (fechaInicio && new Date(m.fecha) < new Date(fechaInicio)) return false;
    if (fechaFin && new Date(m.fecha) > new Date(fechaFin + "T23:59:59.999Z")) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      const matchConcepto = m.concepto.toLowerCase().includes(q);
      const matchRef = m.referencia?.toLowerCase().includes(q);
      const matchBanco = m.cuentaBancaria.nombre.toLowerCase().includes(q);
      if (!matchConcepto && !matchRef && !matchBanco) return false;
    }
    return true;
  });

  function abrirModal() {
    setCuentaId(cuentas[0]?.id || "");
    setTipoMov("INGRESO");
    setMonto(0);
    setConcepto("");
    setReferencia("");
    setCategoria("OTRO");
    setMsg(null);
    setModalNuevo(true);
  }

  async function handleGuardar() {
    setMsg(null);
    if (!cuentaId) {
      setMsg({ tipo: "err", texto: "Selecciona una cuenta bancaria." });
      return;
    }
    if (monto <= 0) {
      setMsg({ tipo: "err", texto: "El monto debe ser mayor a 0." });
      return;
    }
    if (!concepto.trim()) {
      setMsg({ tipo: "err", texto: "Ingresa un concepto descriptivo." });
      return;
    }

    startTransition(async () => {
      const res = await registrarMovimientoBancario({
        cuentaBancariaId: Number(cuentaId),
        tipo: tipoMov,
        monto: Number(monto),
        concepto,
        referencia,
        categoria,
      });

      if (res.ok) {
        setModalNuevo(false);
        router.refresh();
      } else {
        setMsg({ tipo: "err", texto: res.error });
      }
    });
  }

  const getTipoBadge = (t: string) => {
    switch (t) {
      case "INGRESO":
      case "TRANSFERENCIA_ENTRADA":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            <ArrowDownLeft className="h-3.5 w-3.5" />
            Ingreso
          </span>
        );
      case "EGRESO":
      case "TRANSFERENCIA_SALIDA":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300">
            <ArrowUpRight className="h-3.5 w-3.5" />
            Egreso
          </span>
        );
      case "COMISION_BANCARIA":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
            <Percent className="h-3.5 w-3.5" />
            Comisión
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Ajuste
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Movimientos & Extracto Bancario"
        description="Historial detallado de todas las transacciones, transferencias, pagos e ingresos en cuentas bancarias."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/bancos">
              <Button variant="outline" className="flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                Cuentas
              </Button>
            </Link>
            <Button variant="primary" onClick={abrirModal} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Movimiento
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

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por concepto o ref..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <select
                value={cuentaFiltro}
                onChange={(e) => setCuentaFiltro(e.target.value === "TODAS" ? "TODAS" : Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="TODAS">Todas las Cuentas</option>
                {cuentas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="TODOS">Todos los Tipos</option>
                <option value="INGRESO">Ingreso</option>
                <option value="EGRESO">Egreso</option>
                <option value="TRANSFERENCIA_ENTRADA">Transferencia Recibida</option>
                <option value="TRANSFERENCIA_SALIDA">Transferencia Enviada</option>
                <option value="COMISION_BANCARIA">Comisión Bancaria</option>
                <option value="AJUSTE">Ajuste de Saldo</option>
              </select>
            </div>

            <div>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Movimientos */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3">Fecha / Hora</th>
                <th className="px-4 py-3">Cuenta Bancaria</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Concepto & Ref</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-right">Saldo Resultante</th>
                <th className="px-4 py-3 text-center">Conciliado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {movimientosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    No se registraron movimientos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                movimientosFiltrados.map((m) => {
                  const esIngreso = m.tipo === "INGRESO" || m.tipo === "TRANSFERENCIA_ENTRADA";
                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {new Date(m.fecha).toLocaleDateString("es-CO")}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {new Date(m.fecha).toLocaleTimeString("es-CO", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                          <span
                            className="h-2.5 w-2.5 rounded-full inline-block"
                            style={{ backgroundColor: m.cuentaBancaria.color || "#2563eb" }}
                          />
                          {m.cuentaBancaria.nombre}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{getTipoBadge(m.tipo)}</td>
                      <td className="px-4 py-3 max-w-sm">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {m.concepto}
                        </p>
                        {m.referencia && (
                          <span className="text-[11px] font-mono text-gray-500">
                            Ref: {m.referencia}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-bold">
                        <span className={esIngreso ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                          {esIngreso ? "+" : "-"}${m.monto.toLocaleString("es-CO")}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-medium text-gray-900 dark:text-white">
                        ${m.saldoResultante.toLocaleString("es-CO")}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <Badge variant={m.conciliado ? "success" : "neutral"}>
                          {m.conciliado ? "Sí" : "Pendiente"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Nuevo Movimiento */}
      <Dialog open={modalNuevo} onOpenChange={setModalNuevo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              Registrar Movimiento Bancario
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                Cuenta Bancaria *
              </label>
              <select
                value={cuentaId}
                onChange={(e) => setCuentaId(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {cuentas
                  .filter((c) => c.activa)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} (Saldo: ${c.saldoActual.toLocaleString("es-CO")})
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  Tipo de Operación
                </label>
                <select
                  value={tipoMov}
                  onChange={(e) => setTipoMov(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="INGRESO">Ingreso (Crédito)</option>
                  <option value="EGRESO">Egreso (Débito)</option>
                  <option value="COMISION_BANCARIA">Comisión / Cuota Manejo</option>
                  <option value="AJUSTE">Ajuste de Saldo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  Monto (COP) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-gray-400 font-bold">$</span>
                  <input
                    type="number"
                    min={1}
                    value={monto || ""}
                    onChange={(e) => setMonto(Number(e.target.value))}
                    placeholder="0"
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                Concepto / Descripción *
              </label>
              <input
                type="text"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Ej. Abono cliente, Pago servicio datáfono, Cuota manejo..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  Referencia Bancaria
                </label>
                <input
                  type="text"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="Ej. AUT-8910"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  Categoría
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="OTRO">Otro / General</option>
                  <option value="VENTA">Venta</option>
                  <option value="COMPRA">Compra</option>
                  <option value="GASTO">Gasto Operativo</option>
                  <option value="COMISION">Comisión Bancaria</option>
                  <option value="AJUSTE">Ajuste de Saldo</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalNuevo(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleGuardar} disabled={isPending}>
              {isPending ? "Registrando..." : "Registrar Movimiento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
