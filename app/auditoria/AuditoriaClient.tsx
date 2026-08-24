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
  Eye,
  Activity,
  Layers,
  FileCode,
  Clock,
  RefreshCw,
  User,
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
        return <Badge variant="danger">ANULACIÓN / BORRADO</Badge>;
      case "AJUSTE":
      case "CIERRE":
        return <Badge variant="warning">{accion.toUpperCase()}</Badge>;
      default:
        return <Badge variant="neutral">{accion.toUpperCase()}</Badge>;
    }
  };

  const getModuloBadge = (modulo: string) => {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        {modulo}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-6 bg-slate-50/50 min-h-screen text-slate-900">
      <PageHeader
        title="Bitácora de Auditoría del Sistema"
        description="Monitorea y rastrea eventos críticos, anulaciones, modificaciones de stock, gastos y operaciones."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.refresh()}
            className="flex items-center gap-2 font-bold bg-white"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Eventos Hoy
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {stats.totalHoy}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
              <Activity className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Total Registrados
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {stats.totalHistorico}
              </h3>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
              <Layers className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Módulo más Activo
              </p>
              <h3 className="text-lg font-black text-slate-900 mt-1 truncate">
                {stats.topModulos[0]?.modulo || "N/A"}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
              <ShieldAlert className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                Acción más Frecuente
              </p>
              <h3 className="text-lg font-black text-slate-900 mt-1 truncate">
                {stats.topAcciones[0]?.accion || "N/A"}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-white border-slate-200 shadow-2xs">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar entidad o usuario..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <select
                value={moduloFiltro}
                onChange={(e) => setModuloFiltro(e.target.value)}
                className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none cursor-pointer"
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
                className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none cursor-pointer"
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
                className="w-full h-9 px-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none font-medium"
              />
            </div>

            <div>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full h-9 px-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none font-medium"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Eventos */}
      <Card className="bg-white border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-slate-700 uppercase font-black tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Fecha y Hora</th>
                <th className="px-4 py-3">Módulo</th>
                <th className="px-4 py-3">Acción</th>
                <th className="px-4 py-3">Entidad Afectada</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3 text-right">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {registrosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 font-semibold">
                    No se encontraron registros de auditoría que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                registrosFiltrados.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                      <div className="font-bold text-slate-900">
                        {new Date(item.createdAt).toLocaleDateString("es-CO")}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {new Date(item.createdAt).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{getModuloBadge(item.modulo)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{getAccionBadge(item.accion)}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                      {item.entidad}
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-md font-medium">
                      {item.descripcion}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-bold text-slate-800">{item.usuario}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedItem(item)}
                        className="h-8 px-2 text-brand-600 hover:text-brand-800 hover:bg-brand-50 font-bold"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Detalle del Evento */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl bg-white border border-slate-200 text-slate-900 shadow-2xl p-6">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-black text-slate-900">
              <ShieldAlert className="h-5 w-5 text-brand-600" />
              Detalle del Registro de Auditoría
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 py-2 text-xs text-slate-800">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10.5px] uppercase font-bold tracking-wider text-slate-500 block">Módulo & Acción</span>
                  <div className="flex items-center gap-2 mt-1">
                    {getModuloBadge(selectedItem.modulo)}
                    {getAccionBadge(selectedItem.accion)}
                  </div>
                </div>

                <div>
                  <span className="text-[10.5px] uppercase font-bold tracking-wider text-slate-500 block">Fecha y Hora</span>
                  <span className="font-bold text-slate-900 mt-1 block">
                    {new Date(selectedItem.createdAt).toLocaleString("es-CO")}
                  </span>
                </div>

                <div>
                  <span className="text-[10.5px] uppercase font-bold tracking-wider text-slate-500 block">Entidad Afectada</span>
                  <span className="font-bold text-slate-900 mt-1 block">
                    {selectedItem.entidad}{" "}
                    {selectedItem.entidadId ? `(ID: ${selectedItem.entidadId})` : ""}
                  </span>
                </div>

                <div>
                  <span className="text-[10.5px] uppercase font-bold tracking-wider text-slate-500 block">Usuario Responsable</span>
                  <span className="font-bold text-slate-900 mt-1 block">
                    {selectedItem.usuario} {selectedItem.ip ? `• IP: ${selectedItem.ip}` : ""}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Descripción del Evento
                </h4>
                <p className="p-3 bg-white rounded-lg border border-slate-200 text-slate-800 font-medium leading-relaxed">
                  {selectedItem.descripcion}
                </p>
              </div>

              {selectedItem.detalles && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-brand-600" />
                    Metadatos y Registro JSON
                  </h4>
                  <pre className="p-3 bg-slate-900 text-emerald-300 rounded-lg text-[11px] font-mono overflow-x-auto max-h-60 border border-slate-800">
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

          <DialogFooter className="border-t border-slate-100 pt-3">
            <Button variant="outline" size="sm" onClick={() => setSelectedItem(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
