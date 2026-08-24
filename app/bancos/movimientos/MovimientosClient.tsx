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
  CircleDollarSign,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  registrarMovimientoBancario,
  type MovimientoBancarioItem,
  type CuentaBancariaItem,
} from "@/lib/actions/bancos";
import { formatoCOP } from "@/lib/format";

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

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "INGRESO":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ArrowDownLeft className="h-3 w-3" /> Ingreso
          </span>
        );
      case "EGRESO":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
            <ArrowUpRight className="h-3 w-3" /> Egreso
          </span>
        );
      case "TRANSFERENCIA":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <ArrowRightLeft className="h-3 w-3" /> Traslado
          </span>
        );
      case "COMISION_BANCARIA":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Percent className="h-3 w-3" /> Comisión
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {tipo}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 p-6 bg-slate-50/50 min-h-screen text-slate-900">
      <PageHeader
        title="Historial de Movimientos Bancarios"
        description="Audita todos los ingresos, egresos, comisiones y transferencias registradas en tus cuentas."
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
                Volver a Cuentas
              </Button>
            </Link>
            <Button size="sm" onClick={abrirModal} className="flex items-center gap-2 font-bold">
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
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
          }`}
        >
          {msg.tipo === "ok" ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />}
          <span className="text-sm font-semibold">{msg.texto}</span>
        </div>
      )}

      {/* Barra de Filtros */}
      <Card className="bg-white border-slate-200 shadow-2xs">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Buscador */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por concepto o referencia..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {/* Cuenta */}
            <select
              value={cuentaFiltro}
              onChange={(e) =>
                setCuentaFiltro(e.target.value === "TODAS" ? "TODAS" : Number(e.target.value))
              }
              className="h-9 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="TODAS">Todas las Cuentas</option>
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>

            {/* Tipo */}
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="h-9 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="TODOS">Todos los Tipos</option>
              <option value="INGRESO">Ingresos (+)</option>
              <option value="EGRESO">Egresos (-)</option>
              <option value="TRANSFERENCIA">Traslados</option>
              <option value="COMISION_BANCARIA">Comisiones</option>
              <option value="AJUSTE">Ajustes</option>
            </select>
          </div>

          {/* Fechas */}
          <div className="flex items-center gap-2 w-full md:w-auto text-xs font-bold text-slate-600">
            <span>Desde:</span>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="h-9 px-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none"
            />
            <span>Hasta:</span>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="h-9 px-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Movimientos */}
      <Card className="bg-white border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-slate-700 uppercase font-black tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Fecha y Hora</th>
                <th className="px-4 py-3">Cuenta Bancaria</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Concepto / Detalle</th>
                <th className="px-4 py-3">Referencia</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-right">Saldo Posterior</th>
                <th className="px-4 py-3 text-center">Conciliado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {movimientosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400 font-semibold">
                    No hay movimientos registrados con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                movimientosFiltrados.map((m) => {
                  const esIngreso = m.tipo === "INGRESO" || (m.tipo === "AJUSTE" && m.monto > 0);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-600">
                        {new Date(m.fecha).toLocaleString("es-CO", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-slate-900">{m.cuentaBancaria.nombre}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{getTipoBadge(m.tipo)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 max-w-sm truncate">
                        {m.concepto}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-600 font-semibold">
                        {m.referencia || "—"}
                      </td>
                      <td
                        className={`px-4 py-3 whitespace-nowrap text-right font-black ${
                          esIngreso ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {esIngreso ? "+" : "-"}
                        {formatoCOP(m.monto)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-slate-800">
                        {formatoCOP(m.saldoResultante)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <Badge variant={m.conciliado ? "success" : "neutral"}>
                          {m.conciliado ? "Conciliado" : "Pendiente"}
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

      {/* Modal Nuevo Movimiento Manual */}
      <Dialog open={modalNuevo} onOpenChange={setModalNuevo}>
        <DialogContent className="max-w-md bg-white border border-slate-200 text-slate-900 shadow-2xl p-6">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-black text-slate-900">
              <History className="h-5 w-5 text-brand-600" />
              Registrar Movimiento Bancario
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tipo de Movimiento
                </label>
                <select
                  value={tipoMov}
                  onChange={(e) => setTipoMov(e.target.value as any)}
                  className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none cursor-pointer"
                >
                  <option value="INGRESO">Ingreso (+)</option>
                  <option value="EGRESO">Egreso (-)</option>
                  <option value="COMISION_BANCARIA">Comisión Bancaria (-)</option>
                  <option value="AJUSTE">Ajuste de Saldo</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Monto (COP) *
                </label>
                <input
                  type="number"
                  min={1}
                  value={monto || ""}
                  onChange={(e) => setMonto(Number(e.target.value))}
                  placeholder="0"
                  className="w-full h-9 px-3 text-xs font-black rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Concepto / Motivo *
              </label>
              <input
                type="text"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Ej. Rendimientos financieros, Cobro cuota de manejo..."
                className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Referencia de la Transacción
              </label>
              <input
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Ej. NOTA-DEB-001 o REF-994"
                className="w-full h-9 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 pt-3 flex justify-between">
            <Button variant="outline" size="sm" onClick={() => setModalNuevo(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleGuardar}
              disabled={isPending}
              className="font-bold"
            >
              {isPending ? "Registrando..." : "Guardar Movimiento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
