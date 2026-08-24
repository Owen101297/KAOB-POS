"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  DollarSign,
  Plus,
  RefreshCw,
  Wallet,
  Landmark,
  CircleDollarSign,
  Zap,
  Layers,
  ArrowRight,
  Check,
  RotateCcw,
  Receipt,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/Dialog";
import { formatoCOP } from "@/lib/format";
import type { ResumenPlataformas } from "@/lib/actions/plataformas";
import type { CuentaBancariaItem } from "@/lib/actions/bancos";
import { registrarDesembolsoPlataforma, anularDesembolsoPlataforma } from "@/lib/actions/plataformas";

interface PlataformasClientProps {
  resumen: ResumenPlataformas;
  cuentas: CuentaBancariaItem[];
}

export default function PlataformasClient({ resumen, cuentas }: PlataformasClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [tabActiva, setTabActiva] = useState<"PENDIENTES" | "HISTORIAL">("PENDIENTES");
  const [filtroPlataforma, setFiltroPlataforma] = useState<"TODAS" | "ADDI" | "SISTECREDITO">("TODAS");
  const [busqueda, setBusqueda] = useState("");

  // Selección múltiple de ventas para liquidación
  const [seleccionados, setSeleccionados] = useState<number[]>([]);

  // Modal de Liquidación / Desembolso
  const [abrirModalLiquidar, setAbrirModalLiquidar] = useState(false);
  const [plataformaALiquidar, setPlataformaALiquidar] = useState<string>("ADDI");
  const [cuentaDestinoId, setCuentaDestinoId] = useState<string>(
    cuentas.length > 0 ? String(cuentas[0].id) : ""
  );
  const [comision, setComision] = useState<string>("0");
  const [retenciones, setRetenciones] = useState<string>("0");
  const [referenciaBancaria, setReferenciaBancaria] = useState("");
  const [notaDesembolso, setNotaDesembolso] = useState("");

  // Modal de Detalle de Desembolso
  const [desembolsoDetalle, setDesembolsoDetalle] = useState<any | null>(null);

  // Notificaciones
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  // Filtrado de ventas pendientes
  const ventasFiltradas = useMemo(() => {
    return resumen.pagosPendientes.filter((p) => {
      if (filtroPlataforma !== "TODAS" && p.metodo !== filtroPlataforma) return false;
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const clienteNom = p.venta.cliente?.nombre?.toLowerCase() || "";
        const clienteDoc = p.venta.cliente?.documento?.toLowerCase() || "";
        const ref = p.referencia?.toLowerCase() || "";
        const consecutivo = String(p.venta.consecutivo);
        return clienteNom.includes(q) || clienteDoc.includes(q) || ref.includes(q) || consecutivo.includes(q);
      }
      return true;
    });
  }, [resumen.pagosPendientes, filtroPlataforma, busqueda]);

  // Monto total de seleccionados
  const totalSeleccionado = useMemo(() => {
    return resumen.pagosPendientes
      .filter((p) => seleccionados.includes(p.id))
      .reduce((a, p) => a + p.monto, 0);
  }, [resumen.pagosPendientes, seleccionados]);

  const toggleSeleccion = (id: number) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const seleccionarTodas = () => {
    if (seleccionados.length === ventasFiltradas.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(ventasFiltradas.map((p) => p.id));
    }
  };

  // Abrir modal de liquidación
  const iniciarLiquidacion = (plataforma?: string) => {
    const plat = plataforma || (filtroPlataforma !== "TODAS" ? filtroPlataforma : "ADDI");
    setPlataformaALiquidar(plat);

    // Si no hay seleccionados, seleccionar todas las de esa plataforma
    if (seleccionados.length === 0) {
      const idsPlat = resumen.pagosPendientes.filter((p) => p.metodo === plat).map((p) => p.id);
      setSeleccionados(idsPlat);
    }

    // Estimar comisión (ej. 6% para Addi / Sistecrédito)
    const montoBruto = resumen.pagosPendientes
      .filter((p) => seleccionados.includes(p.id) || (seleccionados.length === 0 && p.metodo === plat))
      .reduce((a, p) => a + p.monto, 0);
    const comisionEstimada = Math.round(montoBruto * 0.055);
    setComision(String(comisionEstimada));
    setRetenciones("0");
    setReferenciaBancaria("");
    setNotaDesembolso("");
    setError(null);
    setAbrirModalLiquidar(true);
  };

  // Calcular Neto
  const numComision = Number(comision) || 0;
  const numRetenciones = Number(retenciones) || 0;
  const montoNetoCalculado = Math.max(0, totalSeleccionado - numComision - numRetenciones);

  // Procesar desembolso
  const handleGuardarDesembolso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (seleccionados.length === 0) {
      setError("Selecciona al menos una venta para liquidar.");
      return;
    }
    if (!cuentaDestinoId) {
      setError("Debes seleccionar la cuenta bancaria donde ingresó el dinero.");
      return;
    }

    setError(null);
    const res = await registrarDesembolsoPlataforma({
      plataforma: plataformaALiquidar,
      pagosIds: seleccionados,
      cuentaBancariaId: Number(cuentaDestinoId),
      comision: numComision,
      retenciones: numRetenciones,
      montoNeto: montoNetoCalculado,
      referenciaBancaria,
      nota: notaDesembolso,
    });

    if (res.ok) {
      setAbrirModalLiquidar(false);
      setSeleccionados([]);
      setExito(`✅ Desembolso #${res.data.consecutivo} registrado con éxito en tu cuenta bancaria.`);
      setTimeout(() => setExito(null), 4000);
      startTransition(() => router.refresh());
    } else {
      setError(res.error);
    }
  };

  // Anular desembolso
  const handleAnular = async (id: number) => {
    const motivo = prompt("Ingresa el motivo de la anulación del desembolso:");
    if (!motivo) return;

    const res = await anularDesembolsoPlataforma(id, motivo);
    if (res.ok) {
      setExito("Desembolso anulado. Las ventas han vuelto al estado en espera.");
      setTimeout(() => setExito(null), 4000);
      startTransition(() => router.refresh());
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Subnavegación Bancos */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <Link
          href="/bancos"
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          Cuentas Bancarias
        </Link>
        <Link
          href="/bancos/movimientos"
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          Movimientos
        </Link>
        <Link
          href="/bancos/conciliaciones"
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          Conciliaciones
        </Link>
        <Link
          href="/bancos/plataformas"
          className="px-3 py-1.5 rounded-lg text-xs font-black bg-blue-600 text-white shadow-2xs"
        >
          Plataformas BNPL (Addi / Sistecrédito)
        </Link>
      </div>

      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
              <CircleDollarSign className="h-5 w-5" />
            </div>
            <span>Plataformas de Crédito & Desembolsos</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Control de dinero en tránsito de Addi, Sistecrédito y liquidación de lotes a cuentas bancarias.
          </p>
        </div>

        {resumen.totalEnTransito > 0 && (
          <Button
            onClick={() => iniciarLiquidacion()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-10 px-4 shadow-md shadow-emerald-600/20 flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Liquidar Lote a Banco
          </Button>
        )}
      </div>

      {/* Notificaciones */}
      {exito && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600" />
          {exito}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-red-900 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          {error}
        </div>
      )}

      {/* 3 KPIs de Dinero en Tránsito */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1: Saldo ADDI */}
        <div className="p-5 rounded-2xl bg-white border border-teal-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
              <CircleDollarSign className="h-4 w-4 text-teal-600" />
              Por Cobrar a Addi
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
              {resumen.conteoAddi} ventas
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-teal-950">
            {formatoCOP(resumen.saldoAddi)}
          </h3>
          <p className="text-[11px] text-slate-500">
            Dinero pendiente de transferencia a tu banco
          </p>
        </div>

        {/* KPI 2: Saldo SISTECRÉDITO */}
        <div className="p-5 rounded-2xl bg-white border border-sky-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-sky-600" />
              Por Cobrar a Sistecrédito
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
              {resumen.conteoSistecredito} ventas
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-sky-950">
            {formatoCOP(resumen.saldoSistecredito)}
          </h3>
          <p className="text-[11px] text-slate-500">
            Dinero pendiente de transferencia a tu banco
          </p>
        </div>

        {/* KPI 3: TOTAL EN TRÁNSITO */}
        <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-400" />
              Total en Tránsito (Flotante)
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
              {resumen.pagosPendientes.length} ventas
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white">
            {formatoCOP(resumen.totalEnTransito)}
          </h3>
          <p className="text-[11px] text-slate-300">
            Vendido en percheros pero pendiente de consignación
          </p>
        </div>
      </div>

      {/* Selector de Pestañas: Ventas en Tránsito vs Histórico de Desembolsos */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTabActiva("PENDIENTES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              tabActiva === "PENDIENTES"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Ventas en Tránsito ({resumen.pagosPendientes.length})
          </button>
          <button
            type="button"
            onClick={() => setTabActiva("HISTORIAL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              tabActiva === "HISTORIAL"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Historial de Desembolsos ({resumen.desembolsos.length})
          </button>
        </div>

        {tabActiva === "PENDIENTES" && seleccionados.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">
              {seleccionados.length} seleccionadas:{" "}
              <strong className="text-emerald-700 font-black">{formatoCOP(totalSeleccionado)}</strong>
            </span>
            <Button
              size="sm"
              onClick={() => iniciarLiquidacion()}
              className="h-8 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Liquidar ({formatoCOP(totalSeleccionado)})
            </Button>
          </div>
        )}
      </div>

      {/* ───────────────────────── TAB 1: VENTAS EN TRÁNSITO ───────────────────────── */}
      {tabActiva === "PENDIENTES" && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFiltroPlataforma("TODAS")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filtroPlataforma === "TODAS"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Todas ({resumen.pagosPendientes.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroPlataforma("ADDI")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filtroPlataforma === "ADDI"
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-teal-50"
                }`}
              >
                Addi ({resumen.conteoAddi})
              </button>
              <button
                type="button"
                onClick={() => setFiltroPlataforma("SISTECREDITO")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filtroPlataforma === "SISTECREDITO"
                    ? "bg-sky-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-sky-50"
                }`}
              >
                Sistecrédito ({resumen.conteoSistecredito})
              </button>
            </div>

            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por cliente, documento, N° de venta o aprobación..."
                className="w-full h-8.5 pl-8 pr-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Tabla de Ventas en Tránsito */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {ventasFiltradas.length === 0 ? (
              <div className="py-16 text-center space-y-2 text-slate-400">
                <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-400 stroke-[1.5]" />
                <p className="font-bold text-sm text-slate-700">No hay ventas pendientes por liquidar</p>
                <p className="text-xs text-slate-500">
                  Todas las compras hechas con Addi o Sistecrédito han sido desembolsadas a tus cuentas bancarias.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                    <tr>
                      <th className="py-3 px-4 w-10">
                        <input
                          type="checkbox"
                          checked={seleccionados.length === ventasFiltradas.length && ventasFiltradas.length > 0}
                          onChange={seleccionarTodas}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                      </th>
                      <th className="py-3 px-4">Plataforma</th>
                      <th className="py-3 px-4">Venta</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">N° Aprobación</th>
                      <th className="py-3 px-4">Fecha Venta</th>
                      <th className="py-3 px-4 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {ventasFiltradas.map((p) => {
                      const estaSeleccionado = seleccionados.includes(p.id);
                      return (
                        <tr
                          key={p.id}
                          onClick={() => toggleSeleccion(p.id)}
                          className={`cursor-pointer transition-colors ${
                            estaSeleccionado ? "bg-blue-50/60" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={estaSeleccionado}
                              onChange={() => toggleSeleccion(p.id)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600"
                            />
                          </td>
                          <td className="py-3 px-4">
                            {p.metodo === "ADDI" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-teal-50 text-teal-800 border border-teal-200">
                                <CircleDollarSign className="h-3 w-3 text-teal-600" />
                                ADDI
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-sky-50 text-sky-800 border border-sky-200">
                                <Zap className="h-3 w-3 text-sky-600" />
                                SISTECRÉDITO
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            V-{String(p.venta.consecutivo).padStart(4, "0")}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900">{p.venta.cliente?.nombre || "CLIENTE GENERAL"}</p>
                            {p.venta.cliente?.documento && (
                              <p className="text-[10px] text-slate-500 font-mono">CC: {p.venta.cliente.documento}</p>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-700">
                            {p.referencia || "Sin código"}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {new Date(p.createdAt).toLocaleDateString("es-CO", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-sm text-slate-900">
                            {formatoCOP(p.monto)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────── TAB 2: HISTORIAL DE DESEMBOLSOS ───────────────────────── */}
      {tabActiva === "HISTORIAL" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {resumen.desembolsos.length === 0 ? (
            <div className="py-16 text-center space-y-2 text-slate-400">
              <Receipt className="h-12 w-12 mx-auto text-slate-300 stroke-[1.5]" />
              <p className="font-bold text-sm text-slate-700">No hay desembolsos registrados aún</p>
              <p className="text-xs text-slate-500">
                Cuando Addi o Sistecrédito consignen a tu banco, liquida los lotes para verlos aquí.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                  <tr>
                    <th className="py-3 px-4">Consecutivo</th>
                    <th className="py-3 px-4">Plataforma</th>
                    <th className="py-3 px-4">Fecha Liquidación</th>
                    <th className="py-3 px-4">Cuenta Destino</th>
                    <th className="py-3 px-4 text-right">Monto Bruto</th>
                    <th className="py-3 px-4 text-right">Comisión</th>
                    <th className="py-3 px-4 text-right">Neto Consignado</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {resumen.desembolsos.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        #{d.consecutivo}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black ${
                            d.plataforma === "ADDI"
                              ? "bg-teal-50 text-teal-800 border border-teal-200"
                              : "bg-sky-50 text-sky-800 border border-sky-200"
                          }`}
                        >
                          {d.plataforma}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(d.fecha).toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {d.cuentaBancaria?.nombre || "Cuenta Bancaria"}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-700">
                        {formatoCOP(d.montoBruto)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-red-600">
                        -{formatoCOP(d.comision)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-sm text-emerald-700">
                        {formatoCOP(d.montoNeto)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={d.estado === "LIQUIDADO" ? "success" : "danger"}
                          className="text-[10px] font-bold"
                        >
                          {d.estado}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {d.estado === "LIQUIDADO" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAnular(d.id)}
                            className="h-7 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2"
                          >
                            Anular
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────── MODAL DE LIQUIDACIÓN / DESEMBOLSO ───────────────────────── */}
      <Dialog open={abrirModalLiquidar} onOpenChange={setAbrirModalLiquidar}>
        <DialogContent className="max-w-lg bg-white text-slate-900 border-slate-200 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2 text-slate-900">
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span>Liquidar Lote a Cuenta Bancaria</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Registra el dinero transferido por <strong>{plataformaALiquidar}</strong> a tu cuenta de banco.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGuardarDesembolso} className="space-y-4 py-2">
            {/* Resumen del Lote */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Ventas Seleccionadas:</span>
                <span className="font-black text-slate-900">{seleccionados.length} compras</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Monto Bruto Total:</span>
                <span className="font-black text-base text-slate-900">{formatoCOP(totalSeleccionado)}</span>
              </div>
            </div>

            {/* Cuenta Bancaria de Destino */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Cuenta Bancaria de Destino *
              </label>
              <select
                value={cuentaDestinoId}
                onChange={(e) => setCuentaDestinoId(e.target.value)}
                className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              >
                {cuentas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.tipo}) • Saldo: {formatoCOP(c.saldoActual)}
                  </option>
                ))}
              </select>
            </div>

            {/* Comisión y Retenciones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Comisión Plataforma (COP)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    min={0}
                    value={comision}
                    onChange={(e) => setComision(e.target.value)}
                    className="w-full h-10 pl-7 pr-3 text-xs font-black rounded-xl border border-slate-300 bg-white text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Retenciones (ReteICA / Fuente)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    min={0}
                    value={retenciones}
                    onChange={(e) => setRetenciones(e.target.value)}
                    className="w-full h-10 pl-7 pr-3 text-xs font-black rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Total Neto a Ingresar */}
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Dinero Neto que Entra al Banco
                </span>
                <span className="text-2xl font-black text-emerald-900">
                  {formatoCOP(montoNetoCalculado)}
                </span>
              </div>
              <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Check className="h-5 w-5 stroke-[3]" />
              </div>
            </div>

            {/* Referencia Bancaria */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                N° de Comprobante / Transferencia Bancaria
              </label>
              <input
                type="text"
                value={referenciaBancaria}
                onChange={(e) => setReferenciaBancaria(e.target.value)}
                placeholder="Ej. TRANSF-ADDI-8829 o N° de Aprobación"
                className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {error && <p className="text-xs font-bold text-red-600">{error}</p>}

            <DialogFooter className="pt-2 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAbrirModalLiquidar(false)}
                disabled={isPending}
                className="font-bold text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending || seleccionados.length === 0 || montoNetoCalculado <= 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-10 px-6 shadow-md shadow-emerald-600/20"
              >
                {isPending ? "Liquidando Lote..." : `Confirmar Ingreso (${formatoCOP(montoNetoCalculado)})`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
