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
  FileText,
  Building2,
  Wallet,
  Tag,
  Trash2,
  TrendingDown,
  Layers,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { registrarGasto, anularGasto, type GastoItem } from "@/lib/actions/gastos";
import type { CuentaBancariaItem } from "@/lib/actions/bancos";

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
      const matchNota = g.nota?.toLowerCase().includes(q);
      if (!matchConcepto && !matchComp && !matchNota) return false;
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
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
        {cat}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Control de Gastos Operativos"
        description="Registra y clasifica egresos de la tienda (arriendos, servicios, nómina, suministros) vinculados a caja o bancos."
        actions={
          <Button variant="primary" onClick={abrirModalNuevo} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Gasto
          </Button>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                Total Gastos Activos
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ${totalGastos.toLocaleString("es-CO")}
              </h3>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl text-red-600 dark:text-red-400">
              <TrendingDown className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Pagados en Efectivo
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ${totalEfectivo.toLocaleString("es-CO")}
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
              <Wallet className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Pagados vía Bancos
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ${totalBancos.toLocaleString("es-CO")}
              </h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
              <Building2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Registros Totales
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {gastos.length} Egresos
              </h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400">
              <Layers className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por concepto o comprobante..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c === "TODAS" ? "Todas las Categorías" : c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={metodoFiltro}
                onChange={(e) => setMetodoFiltro(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="TODOS">Todos los Métodos</option>
                <option value="EFECTIVO">Efectivo (Caja)</option>
                <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                <option value="TARJETA">Tarjeta</option>
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

      {/* Tabla de Gastos */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Forma de Pago</th>
                <th className="px-4 py-3">Comprobante</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {gastosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    No se encontraron gastos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                gastosFiltrados.map((g) => {
                  const anulado = g.estado === "ANULADO";
                  return (
                    <tr
                      key={g.id}
                      className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors ${
                        anulado ? "opacity-60 line-through" : ""
                      }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                        {new Date(g.fecha).toLocaleDateString("es-CO")}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white max-w-xs">
                        {g.concepto}
                        {g.nota && (
                          <span className="block text-[11px] font-normal text-gray-500 not-italic">
                            {g.nota}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{getCategoriaBadge(g.categoria)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {g.metodoPago}
                        </span>
                        {g.cuentaBancaria && (
                          <span className="block text-[11px] text-gray-500">
                            {g.cuentaBancaria.nombre}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-gray-600 dark:text-gray-400">
                        {g.comprobante || "N/A"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-red-600 dark:text-red-400">
                        ${g.monto.toLocaleString("es-CO")}
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
                            className="h-8 px-2 text-red-500 hover:text-red-700 dark:hover:text-red-400"
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <DollarSign className="h-5 w-5" />
              Registrar Gasto Operativo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                Concepto del Gasto *
              </label>
              <input
                type="text"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Ej. Pago de arriendo local, Factura Enel energía, Bolsas y empaques..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  Categoría
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ARRIENDO">Arriendo / Alquiler</option>
                  <option value="SERVICIOS">Servicios Públicos (Luz/Agua/Internet)</option>
                  <option value="NOMINA">Nómina / Sueldos</option>
                  <option value="SUMINISTROS">Suministros & Empaques</option>
                  <option value="MANTENIMIENTO">Mantenimiento & Reparación</option>
                  <option value="TRANSPORTE">Transporte / Envíos</option>
                  <option value="PUBLICIDAD">Publicidad & Marketing</option>
                  <option value="IMPUESTOS">Impuestos & Tasas</option>
                  <option value="VARIOS">Otros Gastos Varios</option>
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
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold text-red-600"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  Método de Pago
                </label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EFECTIVO">Efectivo (Retiro de Caja POS)</option>
                  <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                  <option value="TARJETA">Tarjeta Débito/Crédito</option>
                </select>
              </div>

              {metodoPago === "EFECTIVO" ? (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                    Bodega / Caja de Origen
                  </label>
                  <select
                    value={bodegaId}
                    onChange={(e) => setBodegaId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                    Cuenta Bancaria a Debitar
                  </label>
                  <select
                    value={cuentaBancariaId}
                    onChange={(e) => setCuentaBancariaId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    {cuentas
                      .filter((c) => c.activa)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} (${c.saldoActual.toLocaleString("es-CO")})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  N° Factura / Comprobante
                </label>
                <input
                  type="text"
                  value={comprobante}
                  onChange={(e) => setComprobante(e.target.value)}
                  placeholder="Ej. REC-098 o Fac #450"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  Fecha del Gasto
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                Nota u Observaciones Adicionales
              </label>
              <input
                type="text"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Observación opcional..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalNuevo(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleGuardar}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? "Registrando..." : "Guardar Gasto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Anulación */}
      <Dialog open={!!gastoParaAnular} onOpenChange={() => setGastoParaAnular(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              ¿Anular este Gasto?
            </DialogTitle>
          </DialogHeader>

          {gastoParaAnular && (
            <div className="py-2 text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <p>
                Estás a punto de anular el gasto <strong>&quot;{gastoParaAnular.concepto}&quot;</strong> por valor
                de{" "}
                <strong className="text-red-600 dark:text-red-400">
                  ${gastoParaAnular.monto.toLocaleString("es-CO")}
                </strong>
                .
              </p>
              {gastoParaAnular.cuentaBancaria && (
                <p className="text-xs bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                  Se reintegrará automáticamente el monto a la cuenta{" "}
                  <strong>{gastoParaAnular.cuentaBancaria.nombre}</strong>.
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setGastoParaAnular(null)} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleAnular}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? "Anulando..." : "Confirmar Anulación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
