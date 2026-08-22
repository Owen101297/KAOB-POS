"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  Building2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  User,
} from "lucide-react";
import type { Cliente } from "@prisma/client";
import DataTable from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeading } from "@/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { formatoCOP } from "@/lib/format";
import {
  buscarClientesRapido,
  guardarCliente,
  listarClientes,
  toggleCliente,
} from "@/lib/actions/contactos";

interface FilaCliente {
  id: number;
  nombre: string;
  tipoDoc: string;
  documento: string;
  telefono: string;
  ciudad: string;
  cupoCredito: number;
  diasCredito: number;
  activo: boolean;
  [key: string]: unknown;
}

export default function ClientesClient({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filtro, setFiltro] = useState("activos");
  const [busqueda, setBusqueda] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);

  const refrescar = () => startTransition(() => router.refresh());

  const filas = useMemo<FilaCliente[]>(
    () =>
      clientes
        .filter((c) => (filtro === "todos" ? true : c.activo))
        .filter((c) =>
          busqueda
            ? `${c.nombre} ${c.documento ?? ""} ${c.telefono ?? ""} ${c.ciudad ?? ""}`
                .toLowerCase()
                .includes(busqueda.toLowerCase())
            : true
        )
        .map((c) => ({
          id: c.id,
          nombre: c.nombre,
          tipoDoc: c.tipoDoc,
          documento: c.documento ?? "—",
          telefono: c.telefono ?? "—",
          ciudad: c.ciudad ?? "—",
          cupoCredito: c.cupoCredito,
          diasCredito: c.diasCredito,
          activo: c.activo,
        })),
    [clientes, filtro, busqueda]
  );

  const columnas = [
    {
      key: "nombre",
      label: "Nombre",
      render: (row: FilaCliente) => <span className="font-medium text-slate-800">{row.nombre}</span>,
    },
    {
      key: "documento",
      label: "Documento",
      render: (row: FilaCliente) =>
        row.documento !== "—" ? (
          <span className="font-mono text-xs">{row.tipoDoc} {row.documento}</span>
        ) : (
          <span className="text-slate-400">Sin documento</span>
        ),
    },
    { key: "telefono", label: "Teléfono" },
    { key: "ciudad", label: "Ciudad" },
    {
      key: "cupoCredito",
      label: "Cupo crédito",
      align: "right" as const,
      render: (row: FilaCliente) => (row.cupoCredito > 0 ? formatoCOP(row.cupoCredito) : "—"),
    },
    { key: "diasCredito", label: "Días cred.", align: "center" as const },
    {
      key: "activo",
      label: "Estado",
      align: "center" as const,
      render: (row: FilaCliente) =>
        row.activo ? <Badge variant="success">Activo</Badge> : <Badge variant="neutral">Inactivo</Badge>,
    },
    {
      key: "acciones",
      label: "",
      width: "70px",
      render: (row: FilaCliente) => (
        <div className="flex items-center justify-end gap-0.5">
          <Button size="icon" variant="ghost" aria-label={`Editar ${row.nombre}`} onClick={() => { setEditando(clientes.find((c) => c.id === row.id)!); setDialog(true); }}>
            <Search className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label={row.activo ? `Desactivar ${row.nombre}` : `Activar ${row.nombre}`}
            onClick={() => toggleCliente(row.id).then(refrescar)}
          >
            {row.activo ? <Archive className="h-4 w-4" /> : <ArchiveRestore className="h-4 w-4" />}
          </Button>
        </div>
      ),
    },
  ];

  const abrirNuevo = () => {
    setEditando(null);
    setDialog(true);
  };

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Gestiona clientes, cupos de crédito y datos de facturación."
        actions={<Button onClick={abrirNuevo}><Plus className="h-4 w-4" /> Nuevo cliente</Button>}
      />

      <DataTable
        columns={columnas}
        data={filas}
        filters={
          <>
            <Select value={filtro} onValueChange={setFiltro}>
              <SelectTrigger className="h-9 w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="activos">Activos</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar por nombre, documento, teléfono…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="h-9 w-64 pl-9"
              />
            </div>
          </>
        }
        emptyTitle="Sin clientes"
        emptyDescription="Crea tu primer cliente para usar en ventas y créditos."
      />

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? `Editar ${editando.nombre}` : "Nuevo cliente"}</DialogTitle>
            <DialogDescription>Los campos con * son obligatorios. El documento se usa para facturación.</DialogDescription>
          </DialogHeader>
          <FormCliente
            cliente={editando}
            disabled={pending}
            onListo={() => { setDialog(false); setEditando(null); refrescar(); }}
            onCancelar={() => { setDialog(false); setEditando(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormCliente({
  cliente,
  disabled,
  onListo,
  onCancelar,
}: {
  cliente: Cliente | null;
  disabled: boolean;
  onListo: () => void;
  onCancelar: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState(cliente?.nombre ?? "");
  const [tipoDoc, setTipoDoc] = useState<string>(cliente?.tipoDoc ?? "CC");
  const [documento, setDocumento] = useState(cliente?.documento ?? "");
  const [telefono, setTelefono] = useState(cliente?.telefono ?? "");
  const [direccion, setDireccion] = useState(cliente?.direccion ?? "");
  const [ciudad, setCiudad] = useState(cliente?.ciudad ?? "");
  const [email, setEmail] = useState(cliente?.email ?? "");
  const [cupoCredito, setCupoCredito] = useState(cliente ? String(cliente.cupoCredito) : "0");
  const [diasCredito, setDiasCredito] = useState(cliente ? String(cliente.diasCredito) : "0");
  const [notas, setNotas] = useState(cliente?.notas ?? "");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await guardarCliente({
      id: cliente?.id,
      nombre,
      tipoDoc,
      documento: documento || null,
      telefono: telefono || null,
      direccion: direccion || null,
      ciudad: ciudad || null,
      email: email || null,
      cupoCredito: Number(cupoCredito) || 0,
      diasCredito: Number(diasCredito) || 0,
      notas: notas || null,
    });
    if (!res.ok) return setError(res.error);
    onListo();
  }

  return (
    <form onSubmit={enviar} className="grid gap-3">
      <label className="grid gap-1">
        <span className="text-xs font-semibold text-slate-600">Nombre *</span>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} maxLength={80} placeholder="Juan Pérez" />
      </label>
      <div className="grid gap-1 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Tipo documento</span>
          <Select value={tipoDoc} onValueChange={setTipoDoc}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CC">Cédula (CC)</SelectItem>
              <SelectItem value="NIT">NIT</SelectItem>
              <SelectItem value="OTRO">Otro</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Número documento</span>
          <Input value={documento} onChange={(e) => setDocumento(e.target.value)} maxLength={20} placeholder={tipoDoc === "NIT" ? "900123456-7" : "1234567890"} />
        </label>
      </div>
      <label className="grid gap-1">
        <span className="text-xs font-semibold text-slate-600">Teléfono</span>
        <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} maxLength={20} placeholder="300 123 4567" />
      </label>
      <div className="grid gap-1 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Dirección</span>
          <Input value={direccion} onChange={(e) => setDireccion(e.target.value)} maxLength={200} />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Ciudad</span>
          <Input value={ciudad} onChange={(e) => setCiudad(e.target.value)} maxLength={80} placeholder="Bogotá" />
        </label>
      </div>
      <label className="grid gap-1">
        <span className="text-xs font-semibold text-slate-600">Email</span>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} placeholder="cliente@email.com" />
      </label>
      <div className="grid gap-1 sm:grid-cols-3">
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Cupo crédito (COP)</span>
          <Input type="number" min={0} value={cupoCredito} onChange={(e) => setCupoCredito(e.target.value)} />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Días de crédito</span>
          <Input type="number" min={0} max={365} value={diasCredito} onChange={(e) => setDiasCredito(e.target.value)} />
        </label>
      </div>
      <label className="grid gap-1">
        <span className="text-xs font-semibold text-slate-600">Notas</span>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          maxLength={500}
          rows={2}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
      </label>
      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancelar}>Cancelar</Button>
        <Button type="submit" disabled={disabled}>{cliente ? "Guardar" : "Crear"}</Button>
      </DialogFooter>
    </form>
  );
}