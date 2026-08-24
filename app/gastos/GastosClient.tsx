"use client";

import { useState, useTransition } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import {
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  Wallet,
  Trash2,
  TrendingDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { registrarGasto, anularGasto, type GastoItem } from "@/lib/actions/gastos";
import type { CuentaBancariaItem } from "@/lib/actions/bancos";
import { formatoCOP } from "@/lib/format";

interface GastosClientProps {
  gastos: GastoItem[];
  cuentas: CuentaBancariaItem[];
  bodegas: { id: number; nombre: string }[];
}

const CATEGORIAS = [
  "TODAS",
  "ARRIENDO",
  "SERVICIOS",
  "NOMINA",
  "SUMINISTROS",
  "MANTENIMIENTO",
  "TRANSPORTE",
  "PUBLICIDAD",
  "IMPUESTOS",
  "VARIOS",
];

export default function GastosClient({ gastos, cuentas, bodegas }: GastosClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [modalNuevo, setModalNuevo] = useState(false);
  const [gastoParaAnular, setGastoParaAnular] = useState<GastoItem | null>(null);
  const [msg, setMsg] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null);

  // Filtros
  const [categoriaFiltro, setCategoriaFiltro] = useState("TODAS");
  const [metodoFiltro, setMetodoFiltro] = useState("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // Form Nuevo Gasto
  const [concepto, setConcepto] = useState("");
  const [categoria, setCategoria] = useState<
    | "ARRIENDO"
    | "SERVICIOS"
    | "NOMINA"
    | "SUMINISTROS"
    | "MANTENIMIENTO"
    | "TRANSPORTE"
    | "PUBLICIDAD"
    | "IMPUESTOS"
    | "VARIOS"
  >("VARIOS");
  const [monto, setMonto] = useState(0);
  const [metodoPago, setMetodoPago] = useState<"EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "OTRO">("EFECTIVO");
  const [cuentaBancariaId, setCuentaBancariaId] = useState<number | "">(cuentas[0]?.id || "");
  const [bodegaId, setBodegaId] = useState<number | "">(bodegas[0]?.id || "");
  const [comprobante, setComprobante] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [nota, setNota] = useState("");

  // Métricas
  const gastosActivos = gastos.filter((g) => g.estado !== "ANULADO");
  const totalGastos = gastosActivos.reduce((acc, g) => acc + g.monto, 0);
  const totalEfectivo = gastosActivos
    .filter((g) => g.metodoPago === "EFECTIVO")
    .reduce((acc, g) => acc + g.monto, 0);
  const totalBancos = gastosActivos
    .filter((g) => g.metodoPago === "TRANSFERENCIA" || g.metodoPago === "TARJETA")
    .reduce((acc, g) => acc + g.monto, 0);

  const gastosFiltrados = gastos.filter((g) => {
    if (categoriaFiltro !== "TODAS" && g.categoria !== categoriaFiltro) return false;
    if (metodoFiltro !== "TODOS" && g.metodoPago !== metodoFiltro) return false;
    if (fechaInicio && new Date(g.fecha) < new Date(fechaInicio)) return false;
    if (fechaFin && new Date(g.fecha) > new Date(fechaFin + "T23:59:59.999Z")) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      const matchConcepto = g.concepto.toLowerCase().includes(q);
      const matchComp = g.comprobante?.toLowerCase().includes(q);
      if (!matchConcepto && !matchComp) return false;
    }
    return true;
  });

  function abrirModalNuevo() {
    setConcepto("");
    setCategoria("VARIOS");
    setMonto(0);
    setMetodoPago("EFECTIVO");
    setCuentaBancariaId(cuentas[0]?.id || "");
    setBodegaId(bodegas[0]?.id || "");
    setComprobante("");
    setFecha(new Date().toISOString().split("T")[0]);
    setNota("");
    setMsg(null);
    setModalNuevo(true);
  }

  async function handleGuardar() {
    setMsg(null);
    if (!concepto.trim()) {
      setMsg({ tipo: "err", texto: "Ingresa el concepto del gasto." });
      return;
    }
    if (monto <= 0) {
      setMsg({ tipo: "err", texto: "Ingresa un monto válido mayor a 0." });
      return;
    }

    startTransition(async () => {
      const res = await registrarGasto({
        concepto,
        categoria,
        monto: Number(monto),
        metodoPago,
        cuentaBancariaId:
          (metodoPago === "TRANSFERENCIA" || metodoPago === "TARJETA") && cuentaBancariaId
            ? Number(cuentaBancariaId)
            : undefined,
        bodegaId: metodoPago === "EFECTIVO" && bodegaId ? Number(bodegaId) : undefined,
        comprobante,
        fecha,
        nota,
      });

      if (res.ok) {
        setModalNuevo(false);
        router.refresh();
      } else {
        setMsg({ tipo: "err", texto: res.error });
      }
    });
  }

  async function handleAnular() {
    if (!gastoParaAnular) return;
    setMsg(null);
    startTransition(async () => {
      const res = await anularGasto(gastoParaAnular.id);
      if (res.ok) {
        setGastoParaAnular(null);
        router.refresh();
      } else {
        setMsg({ tipo: "err", texto: res.error });
      }
    });
  }

  const getCategoriaBadge = (cat: string) => {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        {cat}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-6 bg-slate-50/50 min-h-screen text-slate-900">
      <PageHeader
        title="Control de Gastos Operativos"
        description="Registra y clasifica egresos de la tienda (arriendos, servicios, nómina, suministros) vinculados a caja o bancos."
        actions={
          <Button onClick={abrirModalNuevo} className="flex items-center gap-2 font-bold shadow-sm">
            <Plus className="h-4 w-4" />
            Nuevo Gasto
          </Button>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-red-600">
                Total Gastos Activos
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {formatoCOP(totalGastos)}
              </h3>
            </div>
            <div className="p-3 bg-red-50 rounded-xl text-red-600 border border-red-100">
              <TrendingDown className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                Pagados en Efectivo
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {formatoCOP(totalEfectivo)}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
              <Wallet className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Pagados vía Bancos
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {formatoCOP(totalBancos)}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
              <Building2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros */}
      <Card className="bg-white border-slate-200 shadow-2xs">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Buscador */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por concepto o recibo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {/* Categoría */}
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="h-9 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none cursor-pointer"
            >
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "TODAS" ? "Todas las Categorías" : cat}
                </option>
              ))}
            </select>

            {/* Método */}
            <select
              value={metodoFiltro}
              onChange={(e) => setMetodoFiltro(e.target.value)}
              className="h-9 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="TODOS">Todos los Métodos</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="TARJETA">Tarjeta</option>
              <option value="OTRO">Otro</option>
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

      {/* Tabla de Gastos */}
      <Card className="bg-white border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-slate-700 uppercase font-black tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Concepto / Detalle</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Método / Origen</th>
                <th className="px-4 py-3">Comprobante</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {gastosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400 font-semibold">
                    No se encontraron gastos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                gastosFiltrados.map((g) => {
                  const anulado = g.estado === "ANULADO";
                  return (
                    <tr
                      key={g.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        anulado ? "opacity-50 line-through bg-slate-50/50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-600">
                        {new Date(g.fecha).toLocaleDateString("es-CO")}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 max-w-xs">
                        {g.concepto}
                        {g.nota && (
                          <span className="block text-[11px] font-normal text-slate-500 not-italic">
                            {g.nota}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{getCategoriaBadge(g.categoria)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-slate-800">
                          {g.metodoPago}
                        </span>
                        {g.cuentaBancaria && (
                          <span className="block text-[11px] font-medium text-slate-500">
                            {g.cuentaBancaria.nombre}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-600 font-semibold">
                        {g.comprobante || "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-black text-red-600 text-sm">
                        {formatoCOP(g.monto)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <Badge variant={anulado ? "danger" : "success"}>
                          {anulado ? "Anulado" : "Registrado"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {!anulado && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setGastoParaAnular(g)}
                            className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Anular gasto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Nuevo Gasto */}
      <Dialog open={modalNuevo} onOpenChange={setModalNuevo}>
        <DialogContent className="max-w-lg bg-white border border-slate-200 text-slate-900 shadow-2xl p-6">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-black text-slate-900">
              <DollarSign className="h-5 w-5 text-red-600" />
              Registrar Gasto Operativo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Concepto del Gasto *
              </label>
              <input
                type="text"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Ej. Pago de arriendo local, Factura energía, Bolsas y empaques..."
                className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Categoría
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as any)}
                  className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                >
                  <option value="ARRIENDO">Arriendo / Alquiler</option>
                  <option value="SERVICIOS">Servicios Públicos</option>
                  <option value="NOMINA">Nómina / Sueldos</option>
                  <option value="SUMINISTROS">Suministros & Empaques</option>
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                  <option value="TRANSPORTE">Transporte / Envíos</option>
                  <option value="PUBLICIDAD">Publicidad & Marketing</option>
                  <option value="IMPUESTOS">Impuestos & Tasas</option>
                  <option value="VARIOS">Otros Gastos Varios</option>
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
                  className="w-full h-9 px-3 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-black text-red-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Método de Pago
                </label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as any)}
                  className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                >
                  <option value="EFECTIVO">Efectivo (Caja POS)</option>
                  <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                  <option value="TARJETA">Tarjeta Débito/Crédito</option>
                </select>
              </div>

              {metodoPago === "EFECTIVO" ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Bodega / Caja de Origen
                  </label>
                  <select
                    value={bodegaId}
                    onChange={(e) => setBodegaId(Number(e.target.value))}
                    className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                  >
                    {bodegas.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Cuenta Bancaria
                  </label>
                  <select
                    value={cuentaBancariaId}
                    onChange={(e) => setCuentaBancariaId(Number(e.target.value))}
                    className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
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
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  N° Factura / Comprobante
                </label>
                <input
                  type="text"
                  value={comprobante}
                  onChange={(e) => setComprobante(e.target.value)}
                  placeholder="Ej. REC-098 o Fac #450"
                  className="w-full h-9 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Fecha del Gasto
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full h-9 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nota u Observaciones
              </label>
              <input
                type="text"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Observación opcional..."
                className="w-full h-9 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
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
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {isPending ? "Registrando..." : "Guardar Gasto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Anulación */}
      <Dialog open={!!gastoParaAnular} onOpenChange={() => setGastoParaAnular(null)}>
        <DialogContent className="max-w-md bg-white border border-slate-200 text-slate-900 shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black text-red-600">
              <AlertCircle className="h-5 w-5" />
              ¿Anular este Gasto?
            </DialogTitle>
          </DialogHeader>

          {gastoParaAnular && (
            <div className="py-2 text-xs text-slate-700 space-y-2">
              <p>
                Estás a punto de anular el gasto <strong>&quot;{gastoParaAnular.concepto}&quot;</strong> por valor
                de{" "}
                <strong className="text-red-600 font-bold">
                  {formatoCOP(gastoParaAnular.monto)}
                </strong>
                .
              </p>
              {gastoParaAnular.cuentaBancaria && (
                <p className="text-xs bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-800">
                  Se reintegrará automáticamente el monto a la cuenta{" "}
                  <strong>{gastoParaAnular.cuentaBancaria.nombre}</strong>.
                </p>
              )}
            </div>
          )}

          <DialogFooter className="border-t border-slate-100 pt-3 flex justify-between">
            <Button variant="outline" size="sm" onClick={() => setGastoParaAnular(null)} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleAnular}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {isPending ? "Anulando..." : "Confirmar Anulación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
