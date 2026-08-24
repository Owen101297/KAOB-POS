"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import {
  ShieldAlert,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  Activity,
  Layers,
  FileCode,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { AuditoriaItem } from "@/lib/actions/auditoria";

interface AuditoriaClientProps {
  initialData: {
    total: number;
    registros: AuditoriaItem[];
  };
  stats: {
    totalHoy: number;
    totalHistorico: number;
    topModulos: { modulo: string; count: number }[];
    topAcciones: { accion: string; count: number }[];
  };
}

const MODULOS = [
  "TODOS",
  "VENTAS",
  "COMPRAS",
  "INVENTARIO",
  "CAJA",
  "BANCOS",
  "GASTOS",
  "CONFIGURACION",
  "FIDELIZACION",
  "CONTACTOS",
];

const ACCIONES = [
  "TODAS",
  "CREACION",
  "MODIFICACION",
  "ANULACION",
  "AJUSTE",
  "CIERRE",
  "TRANSFERENCIA",
  "MOVIMIENTO",
  "CONCILIACION",
  "ELIMINAR",
];

export default function AuditoriaClient({ initialData, stats }: AuditoriaClientProps) {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<AuditoriaItem | null>(null);

  // Filtros
  const [moduloFiltro, setModuloFiltro] = useState("TODOS");
  const [accionFiltro, setAccionFiltro] = useState("TODAS");
  const [busqueda, setBusqueda] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const registrosFiltrados = initialData.registros.filter((item) => {
    if (moduloFiltro !== "TODOS" && item.modulo !== moduloFiltro) return false;
    if (accionFiltro !== "TODAS" && item.accion !== accionFiltro) return false;
    if (fechaInicio && new Date(item.createdAt) < new Date(fechaInicio)) return false;
    if (fechaFin && new Date(item.createdAt) > new Date(fechaFin + "T23:59:59.999Z")) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      const matchEntidad = item.entidad.toLowerCase().includes(q);
      const matchDesc = item.descripcion.toLowerCase().includes(q);
      const matchUser = item.usuario.toLowerCase().includes(q);
      if (!matchEntidad && !matchDesc && !matchUser) return false;
    }
    return true;
  });

  const getAccionBadge = (accion: string) => {
    switch (accion.toUpperCase()) {
      case "CREACION":
      case "CREAR":
        return <Badge variant="success">CREACIÓN</Badge>;
      case "MODIFICACION":
      case "EDITAR":
        return <Badge variant="info">MODIFICACIÓN</Badge>;
      case "ANULACION":
      case "ANULAR":
      case "ELIMINAR":
        return <Badge variant="danger">ANULACIÓN</Badge>;
      case "CIERRE":
        return <Badge variant="warning">CIERRE</Badge>;
      case "TRANSFERENCIA":
      case "CONCILIACION":
        return <Badge variant="neutral">TESORERÍA</Badge>;
      default:
        return <Badge variant="neutral">{accion}</Badge>;
    }
  };

  const getModuloBadge = (modulo: string) => {
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        {modulo}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Bitácora de Auditoría del Sistema"
        description="Monitorea y rastrea eventos críticos, anulaciones, modificaciones de precios y cierres de operaciones."
        actions={
          <Button
            variant="outline"
            onClick={() => router.refresh()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Eventos Hoy
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalHoy}
              </h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
              <Activity className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Total Registrados
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalHistorico}
              </h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400">
              <Layers className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Módulo más Activo
              </p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1 truncate">
                {stats.topModulos[0]?.modulo || "N/A"}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Acción más Frecuente
              </p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1 truncate">
                {stats.topAcciones[0]?.accion || "N/A"}
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
              <Clock className="h-6 w-6" />
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
                placeholder="Buscar entidad, descripción o usuario..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <select
                value={moduloFiltro}
                onChange={(e) => setModuloFiltro(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {MODULOS.map((m) => (
                  <option key={m} value={m}>
                    {m === "TODOS" ? "Todos los Módulos" : m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={accionFiltro}
                onChange={(e) => setAccionFiltro(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {ACCIONES.map((a) => (
                  <option key={a} value={a}>
                    {a === "TODAS" ? "Todas las Acciones" : a}
                  </option>
                ))}
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

      {/* Tabla de Eventos */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3">Fecha / Hora</th>
                <th className="px-4 py-3">Módulo</th>
                <th className="px-4 py-3">Acción</th>
                <th className="px-4 py-3">Entidad Afectada</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3 text-right">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {registrosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    No se encontraron registros de auditoría que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                registrosFiltrados.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {new Date(item.createdAt).toLocaleDateString("es-CO")}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {new Date(item.createdAt).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{getModuloBadge(item.modulo)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{getAccionBadge(item.accion)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      {item.entidad}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-md truncate">
                      {item.descripcion}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        {item.usuario}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedItem(item)}
                        className="h-8 px-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Detalle de Auditoría */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ShieldAlert className="h-5 w-5 text-blue-600" />
              Detalle del Evento de Auditoría #{selectedItem?.id}
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 py-2 text-sm">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                <div>
                  <span className="text-xs text-gray-500 block">Módulo & Acción</span>
                  <div className="flex items-center gap-2 mt-1">
                    {getModuloBadge(selectedItem.modulo)}
                    {getAccionBadge(selectedItem.accion)}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-gray-500 block">Fecha y Hora</span>
                  <span className="font-semibold text-gray-900 dark:text-white mt-1 block">
                    {new Date(selectedItem.createdAt).toLocaleString("es-CO")}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-gray-500 block">Entidad Afectada</span>
                  <span className="font-semibold text-gray-900 dark:text-white mt-1 block">
                    {selectedItem.entidad}{" "}
                    {selectedItem.entidadId ? `(ID: ${selectedItem.entidadId})` : ""}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-gray-500 block">Usuario Responsable</span>
                  <span className="font-semibold text-gray-900 dark:text-white mt-1 block">
                    {selectedItem.usuario} {selectedItem.ip ? `• IP: ${selectedItem.ip}` : ""}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  Descripción del Evento
                </h4>
                <p className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  {selectedItem.descripcion}
                </p>
              </div>

              {selectedItem.detalles && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-blue-500" />
                    Metadatos y Registro JSON
                  </h4>
                  <pre className="p-3 bg-gray-950 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto max-h-60 border border-gray-800">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedItem.detalles), null, 2);
                      } catch {
                        return selectedItem.detalles;
                      }
                    })()}
                  </pre>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedItem(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
