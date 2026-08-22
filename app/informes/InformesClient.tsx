"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Award,
  BarChart3,
  Boxes,
  Calendar,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Percent,
  Printer,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  UserCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { formatoCOP } from "@/lib/format";
import type {
  ReporteInventarioData,
  ReporteRentabilidadData,
  ReporteVentasData,
} from "@/lib/actions/reportes";

interface BodegaItem {
  id: number;
  nombre: string;
}

interface InformesClientProps {
  reporteVentas: ReporteVentasData;
  reporteRentabilidad: ReporteRentabilidadData;
  reporteInventario: ReporteInventarioData;
  bodegas: BodegaItem[];
  diasIniciales: number;
  bodegaIdInicial?: number;
}

export default function InformesClient({
  reporteVentas,
  reporteRentabilidad,
  reporteInventario,
  bodegas,
  diasIniciales,
  bodegaIdInicial,
}: InformesClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<"ventas" | "rentabilidad" | "inventario">("ventas");
  const [dias, setDias] = useState<number>(diasIniciales);
  const [bodegaId, setBodegaId] = useState<string>(
    bodegaIdInicial ? String(bodegaIdInicial) : "TODAS"
  );
  const [filtroBusquedaProd, setFiltroBusquedaProd] = useState("");

  function aplicarFiltros(nuevosDias: number, nuevaBodega: string) {
    setDias(nuevosDias);
    setBodegaId(nuevaBodega);
    startTransition(() => {
      const params = new URLSearchParams();
      params.set("dias", String(nuevosDias));
      if (nuevaBodega !== "TODAS") params.set("bodegaId", nuevaBodega);
      router.push(`/informes?${params.toString()}`);
    });
  }

  // Filtrado de productos rentables
  const productosRentablesFiltrados = useMemo(() => {
    return reporteRentabilidad.productosRentables.filter(
      (p) =>
        !filtroBusquedaProd ||
        p.nombre.toLowerCase().includes(filtroBusquedaProd.toLowerCase()) ||
        p.referencia.toLowerCase().includes(filtroBusquedaProd.toLowerCase())
    );
  }, [reporteRentabilidad.productosRentables, filtroBusquedaProd]);

  // Exportar datos a CSV / Excel
  function handleExportarCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (activeTab === "ventas") {
      csvContent += "Metodo Pago,Monto COP,Porcentaje\n";
      reporteVentas.ventasPorMetodo.forEach((m) => {
        csvContent += `"${m.metodo}",${m.total},${m.porcentaje}%\n`;
      });
      csvContent += "\nCategoria,Unidades Vendidas,Total Venta COP,Porcentaje\n";
      reporteVentas.ventasPorCategoria.forEach((c) => {
        csvContent += `"${c.categoria}",${c.unidades},${c.total},${c.porcentaje}%\n`;
      });
    } else if (activeTab === "rentabilidad") {
      csvContent += "Referencia,Producto,Unidades Vendidas,Ingresos Venta COP,Costo COGS COP,Utilidad Bruta COP,Margen Bruto %\n";
      reporteRentabilidad.productosRentables.forEach((p) => {
        csvContent += `"${p.referencia}","${p.nombre}",${p.unidades},${p.ingresos},${p.costoTotal},${p.utilidadBruta},${p.margenPct}%\n`;
      });
    } else {
      csvContent += "Referencia,Producto,Unidades Vendidas,Total Ventas COP\n";
      reporteInventario.topSellers.forEach((t) => {
        csvContent += `"${t.referencia}","${t.nombre}",${t.unidadesVendidas},${t.totalVentas}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Reporte_${activeTab}_KAOB_POS_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Informes y Analítica Gerencial"
        description="Tableros consolidados de ventas, utilidad bruta, comisiones y valoración de inventario."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportarCSV} className="gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Exportar CSV / Excel
            </Button>
            <Button variant="outline" onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4" /> Imprimir Reporte
            </Button>
          </div>
        }
      />

      {/* BARRA DE FILTROS SUPERIOR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <Calendar className="h-4 w-4 text-brand-600" /> Período:
          </div>
          <div className="w-44">
            <Select
              value={String(dias)}
              onValueChange={(v) => aplicarFiltros(Number(v), bodegaId)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 días</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
                <SelectItem value="90">Últimos 90 días</SelectItem>
                <SelectItem value="365">Último año</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 ml-2">
            <Filter className="h-4 w-4 text-brand-600" /> Bodega:
          </div>
          <div className="w-48">
            <Select
              value={bodegaId}
              onValueChange={(v) => aplicarFiltros(dias, v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todas las Bodegas</SelectItem>
                {bodegas.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => aplicarFiltros(dias, bodegaId)}
          disabled={pending}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${pending ? "animate-spin" : ""}`} /> Actualizar
        </Button>
      </div>

      {/* PESTAÑAS NAVEGACIÓN */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("ventas")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "ventas"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <TrendingUp className="h-4 w-4" /> Ventas y Rendimiento
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("rentabilidad")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "rentabilidad"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Percent className="h-4 w-4" /> Utilidad y Rentabilidad
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("inventario")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "inventario"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Boxes className="h-4 w-4" /> Rotación de Inventario
        </button>
      </div>

      {/* CONTENIDO TAB 1: VENTAS Y RENDIMIENTO */}
      {activeTab === "ventas" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Ventas Totales Netas"
              value={formatoCOP(reporteVentas.totalVentas)}
              icon={<DollarSign className="h-5 w-5 text-brand-600" />}
              color="brand"
              hint={`${reporteVentas.unidadesVendidas} prendas vendidas`}
            />
            <StatCard
              label="Ticket Promedio"
              value={formatoCOP(reporteVentas.ticketPromedio)}
              icon={<ShoppingBag className="h-5 w-5 text-sky-600" />}
              color="sky"
              hint="Promedio por venta realizada"
            />
            <StatCard
              label="Transacciones Completadas"
              value={reporteVentas.totalTransacciones.toString()}
              icon={<CheckCircle2 className="h-5 w-5 text-violet-600" />}
              color="violet"
              hint="Facturas/tickets generados"
            />
            <StatCard
              label="Descuentos Otorgados"
              value={formatoCOP(reporteVentas.totalDescuentos)}
              icon={<Percent className="h-5 w-5 text-amber-600" />}
              color="amber"
              hint="Total rebajas en caja"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* VENTAS POR MÉTODO DE PAGO */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-brand-600" /> Métodos de Pago
                </CardTitle>
                <CardDescription>Distribución de ingresos por canal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {reporteVentas.ventasPorMetodo.map((m) => (
                  <div key={m.metodo} className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{m.metodo}</span>
                      <span>{formatoCOP(m.total)} ({m.porcentaje}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="bg-brand-600 h-full rounded-full"
                        style={{ width: `${m.porcentaje}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* VENTAS POR CATEGORÍA */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-5 w-5 text-brand-600" /> Ventas por Categoría
                </CardTitle>
                <CardDescription>Categorías de mayor facturación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {reporteVentas.ventasPorCategoria.map((c) => (
                  <div key={c.categoria} className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{c.categoria}</span>
                      <span>{formatoCOP(c.total)} ({c.unidades} uds)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="bg-sky-500 h-full rounded-full"
                        style={{ width: `${c.porcentaje}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* RENDIMIENTO POR VENDEDOR */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-brand-600" /> Rendimiento Vendedores
                </CardTitle>
                <CardDescription>Ventas y comisiones estimadas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {reporteVentas.ventasPorVendedor.map((v) => (
                  <div key={v.vendedor} className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">{v.vendedor}</div>
                      <div className="text-[11px] text-slate-500">{v.ventasCount} transacciones</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-slate-900">{formatoCOP(v.total)}</div>
                      <div className="text-[11px] text-emerald-600 font-semibold">Comisión: {formatoCOP(v.comision)}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* CONTENIDO TAB 2: UTILIDAD Y RENTABILIDAD */}
      {activeTab === "rentabilidad" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Ingresos Totales"
              value={formatoCOP(reporteRentabilidad.ingresosTotales)}
              icon={<DollarSign className="h-5 w-5 text-brand-600" />}
              color="brand"
              hint="Facturación bruta"
            />
            <StatCard
              label="Costo Mercancía Vendida (COGS)"
              value={formatoCOP(reporteRentabilidad.costoMercancia)}
              icon={<Wallet className="h-5 w-5 text-amber-600" />}
              color="amber"
              hint="Costo de compra del producto"
            />
            <StatCard
              label="Utilidad Bruta"
              value={formatoCOP(reporteRentabilidad.utilidadBruta)}
              icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
              color="sky"
              hint="Ganancia bruta generada"
            />
            <StatCard
              label="Margen Bruto Promedio"
              value={`${reporteRentabilidad.margenBrutoPct}%`}
              icon={<Percent className="h-5 w-5 text-violet-600" />}
              color="violet"
              hint="Margen de rentabilidad global"
            />
          </div>

          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Rentabilidad por Producto / Prenda</CardTitle>
                <CardDescription>
                  Listado detallado de utilidad bruta e ingresos por referencia de producto
                </CardDescription>
              </div>
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Buscar por referencia o nombre…"
                  value={filtroBusquedaProd}
                  onChange={(e) => setFiltroBusquedaProd(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-xs outline-none focus:border-brand-500"
                />
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Referencia / Producto</th>
                      <th className="p-2.5 text-center">Unidades</th>
                      <th className="p-2.5 text-right">Ingresos Venta</th>
                      <th className="p-2.5 text-right">Costo COGS</th>
                      <th className="p-2.5 text-right">Utilidad Bruta</th>
                      <th className="p-2.5 text-center">Margen %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {productosRentablesFiltrados.map((p) => (
                      <tr key={p.productoId}>
                        <td className="p-2.5">
                          <div className="font-bold text-slate-900">{p.nombre}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{p.referencia}</div>
                        </td>
                        <td className="p-2.5 text-center font-semibold">{p.unidades}</td>
                        <td className="p-2.5 text-right">{formatoCOP(p.ingresos)}</td>
                        <td className="p-2.5 text-right text-slate-500">{formatoCOP(p.costoTotal)}</td>
                        <td className="p-2.5 text-right font-extrabold text-emerald-700">
                          {formatoCOP(p.utilidadBruta)}
                        </td>
                        <td className="p-2.5 text-center">
                          {p.margenPct >= 40 ? (
                            <Badge variant="success">{p.margenPct}%</Badge>
                          ) : p.margenPct >= 20 ? (
                            <Badge variant="warning">{p.margenPct}%</Badge>
                          ) : (
                            <Badge variant="danger">{p.margenPct}%</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                    {productosRentablesFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                          No se encontraron productos en el período seleccionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CONTENIDO TAB 3: ROTACIÓN DE INVENTARIO */}
      {activeTab === "inventario" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Valoración a Costo"
              value={formatoCOP(reporteInventario.valorCostoTotal)}
              icon={<Boxes className="h-5 w-5 text-brand-600" />}
              color="brand"
              hint="Inversión total en mercancía"
            />
            <StatCard
              label="Valoración a Venta"
              value={formatoCOP(reporteInventario.valorVentaTotal)}
              icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
              color="sky"
              hint="Potencial bruto de venta"
            />
            <StatCard
              label="Utilidad Potencial"
              value={formatoCOP(reporteInventario.utilidadEstimadaTotal)}
              icon={<TrendingUp className="h-5 w-5 text-violet-600" />}
              color="violet"
              hint="Ganancia estimada de stock"
            />
            <StatCard
              label="Unidades Totales"
              value={reporteInventario.unidadesTotales.toString()}
              icon={<Layers className="h-5 w-5 text-amber-600" />}
              color="amber"
              hint="Prendas físicas en bodega"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* TOP SELLERS */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" /> Productos Más Vendidos (Top Sellers)
                </CardTitle>
                <CardDescription>Ranking de rotación en los últimos 60 días</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Pos</th>
                        <th className="p-2">Producto</th>
                        <th className="p-2 text-center">Vendidos</th>
                        <th className="p-2 text-right">Total Ventas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {reporteInventario.topSellers.map((t, idx) => (
                        <tr key={t.productoId}>
                          <td className="p-2 font-bold text-center text-slate-500">#{idx + 1}</td>
                          <td className="p-2">
                            <div className="font-bold text-slate-900">{t.nombre}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{t.referencia}</div>
                          </td>
                          <td className="p-2 text-center font-extrabold text-brand-600">{t.unidadesVendidas}</td>
                          <td className="p-2 text-right font-bold">{formatoCOP(t.totalVentas)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* ALERTAS DE REABASTECIMIENTO */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" /> Alertas de Reabastecimiento
                </CardTitle>
                <CardDescription>Variantes con existencias por debajo del stock mínimo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">SKU / Prenda</th>
                        <th className="p-2">Bodega</th>
                        <th className="p-2 text-center">Stock Actual</th>
                        <th className="p-2 text-center">Mínimo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {reporteInventario.alertasStockBajo.map((a) => (
                        <tr key={a.varianteId}>
                          <td className="p-2">
                            <div className="font-bold text-slate-900">{a.producto}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {a.sku} · {a.color} / T.{a.talla}
                            </div>
                          </td>
                          <td className="p-2 font-semibold text-slate-700">{a.bodega}</td>
                          <td className="p-2 text-center font-extrabold text-red-600">{a.cantidadActual}</td>
                          <td className="p-2 text-center font-semibold text-slate-500">{a.minimo}</td>
                        </tr>
                      ))}
                      {reporteInventario.alertasStockBajo.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                            ✅ No hay alertas de stock bajo. Todos los productos cuentan con existencias adecuadas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
