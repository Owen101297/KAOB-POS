"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
  Calendar,
  Eye,
  FileText,
  Printer,
  RefreshCw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { formatoCOP } from "@/lib/format";

export interface SesionCajaItem {
  id: number;
  baseInicial: number;
  estado: string;
  openedAt: Date | string;
  closedAt: Date | string | null;
  bodega: { id: number; nombre: string } | null;
  movimientos: {
    id: number;
    tipo: string;
    monto: number;
    referencia: string | null;
    createdAt: Date | string;
  }[];
}

type SesionRow = SesionCajaItem & Record<string, unknown>;

interface CierresCajaClientProps {
  sesionesIniciales: SesionCajaItem[];
}

export default function CierresCajaClient({ sesionesIniciales }: CierresCajaClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [busqueda, setBusqueda] = useState("");
  const [sesionSeleccionada, setSesionSeleccionada] = useState<SesionCajaItem | null>(null);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);

  const sesionesFiltradas = useMemo(() => {
    return sesionesIniciales.filter((s) => {
      const matchBusqueda =
        !busqueda ||
        String(s.id).includes(busqueda) ||
        (s.bodega?.nombre ?? "").toLowerCase().includes(busqueda.toLowerCase());
      return matchBusqueda;
    }) as SesionRow[];
  }, [sesionesIniciales, busqueda]);

  const columns = [
    {
      key: "id",
      label: "Turno N°",
      render: (s: SesionRow) => (
        <span className="font-mono font-bold text-slate-900">
          #{String(s.id).padStart(4, "0")}
        </span>
      ),
    },
    {
      key: "openedAt",
      label: "Apertura",
      render: (s: SesionRow) => (
        <span className="text-xs text-slate-600">
          {new Date(s.openedAt).toLocaleString("es-CO", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </span>
      ),
    },
    {
      key: "closedAt",
      label: "Cierre",
      render: (s: SesionRow) => (
        <span className="text-xs text-slate-600">
          {s.closedAt
            ? new Date(s.closedAt).toLocaleString("es-CO", {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "En curso"}
        </span>
      ),
    },
    {
      key: "bodega",
      label: "Bodega",
      render: (s: SesionRow) => (
        <span className="font-medium text-slate-800">
          {s.bodega?.nombre ?? "Principal"}
        </span>
      ),
    },
    {
      key: "baseInicial",
      label: "Base Inicial",
      render: (s: SesionRow) => (
        <span className="font-semibold text-slate-700">
          {formatoCOP(s.baseInicial)}
        </span>
      ),
    },
    {
      key: "movimientosCount",
      label: "Movimientos",
      render: (s: SesionRow) => (
        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
          {s.movimientos.length} movs
        </span>
      ),
    },
    {
      key: "diferencia",
      label: "Diferencia Arqueo",
      render: (s: SesionRow) => {
        const diffMov = s.movimientos.find((m) => m.referencia?.includes("Diferencia arqueo"));
        if (!diffMov) return <Badge variant="success">Exacto ($0)</Badge>;
        if (diffMov.monto > 0) return <Badge variant="info">Sobrante +{formatoCOP(diffMov.monto)}</Badge>;
        return <Badge variant="danger">Faltante {formatoCOP(diffMov.monto)}</Badge>;
      },
    },
    {
      key: "acciones",
      label: "Acciones",
      render: (s: SesionRow) => (
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            title="Ver Informe de Cierre"
            onClick={() => {
              setSesionSeleccionada(s);
              setModalDetalleOpen(true);
            }}
          >
            <Eye className="h-4 w-4 text-slate-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Historial de Cierres de Caja"
        description="Bitácora de turnos de caja cerrados con auditoría de movimientos y arqueos."
      />

      {/* FILTRO */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por Turno N°, bodega…"
            className="pl-9"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          title="Refrescar"
          onClick={() => startTransition(() => router.refresh())}
        >
          <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={sesionesFiltradas}
        pageTitle="Cierres Auditados"
      />

      {/* MODAL DETALLE DE CIERRE DE CAJA */}
      <Dialog open={modalDetalleOpen} onOpenChange={setModalDetalleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Informe de Cierre de Caja - Turno #{String(sesionSeleccionada?.id ?? 0).padStart(4, "0")}
            </DialogTitle>
            <DialogDescription>
              {sesionSeleccionada?.bodega?.nombre ?? "Bodega Principal"} ·{" "}
              {sesionSeleccionada ? new Date(sesionSeleccionada.openedAt).toLocaleString("es-CO") : ""}
            </DialogDescription>
          </DialogHeader>

          {sesionSeleccionada && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg">
                <div>
                  <span className="text-slate-500 block">Base Inicial:</span>
                  <span className="font-bold text-slate-800">
                    {formatoCOP(sesionSeleccionada.baseInicial)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Apertura:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(sesionSeleccionada.openedAt).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Cierre:</span>
                  <span className="font-semibold text-slate-800">
                    {sesionSeleccionada.closedAt ? new Date(sesionSeleccionada.closedAt).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" }) : "En curso"}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Movimientos Registrados ({sesionSeleccionada.movimientos.length})
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="p-2">Hora</th>
                        <th className="p-2">Tipo</th>
                        <th className="p-2">Referencia</th>
                        <th className="p-2 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {sesionSeleccionada.movimientos.map((m) => (
                        <tr key={m.id}>
                          <td className="p-2 text-slate-500 font-mono text-[11px]">
                            {new Date(m.createdAt).toLocaleTimeString("es-CO", { timeStyle: "short" })}
                          </td>
                          <td className="p-2 font-semibold text-slate-700">{m.tipo}</td>
                          <td className="p-2 text-slate-600 truncate max-w-xs">{m.referencia ?? "-"}</td>
                          <td className={`p-2 text-right font-bold ${m.monto < 0 ? "text-red-600" : "text-slate-900"}`}>
                            {formatoCOP(m.monto)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" /> Imprimir Comprobante
            </Button>
            <Button variant="ghost" onClick={() => setModalDetalleOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
