"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Mail, Phone, Plus, Search, Truck } from "lucide-react";
import type { Proveedor } from "@prisma/client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  guardarProveedor,
  listarProveedores,
  toggleProveedor,
} from "@/lib/actions/contactos";

interface FilaProveedor {
  id: number;
  nombre: string;
  nit: string;
  contacto: string;
  telefono: string;
  email: string;
  activo: boolean;
  [key: string]: unknown;
}

export default function ProveedoresClient({ proveedores }: { proveedores: Proveedor[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filtro, setFiltro] = useState("activos");
  const [busqueda, setBusqueda] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editando, setEditando] = useState<Proveedor | null>(null);

  const refrescar = () => startTransition(() => router.refresh());

  const filas = useMemo<FilaProveedor[]>(
    () =>
      proveedores
        .filter((p) => (filtro === "todos" ? true : p.activo))
        .filter((p) =>
          busqueda
            ? `${p.nombre} ${p.nit ?? ""} ${p.contacto ?? ""} ${p.telefono ?? ""} ${p.email ?? ""}`
                .toLowerCase()
                .includes(busqueda.toLowerCase())
            : true
        )
        .map((p) => ({
          id: p.id,
          nombre: p.nombre,
          nit: p.nit ?? "—",
          contacto: p.contacto ?? "—",
          telefono: p.telefono ?? "—",
          email: p.email ?? "—",
          activo: p.activo,
        })),
    [proveedores, filtro, busqueda]
  );

  const columnas = [
    {
      key: "nombre",
      label: "Proveedor",
      render: (row: FilaProveedor) => <span className="font-medium text-slate-800">{row.nombre}</span>,
    },
    {
      key: "nit",
      label: "NIT",
      render: (row: FilaProveedor) =>
        row.nit !== "—" ? <span className="font-mono text-xs">{row.nit}</span> : <span className="text-slate-400">—</span>,
    },
    { key: "contacto", label: "Contacto" },
    { key: "telefono", label: "Teléfono" },
    { key: "email", label: "Email" },
    {
      key: "activo",
      label: "Estado",
      align: "center" as const,
      render: (row: FilaProveedor) =>
        row.activo ? <Badge variant="success">Activo</Badge> : <Badge variant="neutral">Inactivo</Badge>,
    },
    {
      key: "acciones",
      label: "",
      width: "70px",
      render: (row: FilaProveedor) => (
        <div className="flex items-center justify-end gap-0.5">
          <Button size="icon" variant="ghost" aria-label={`Editar ${row.nombre}`} onClick={() => { setEditando(proveedores.find((p) => p.id === row.id)!); setDialog(true); }}>
            <Search className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label={row.activo ? `Desactivar ${row.nombre}` : `Activar ${row.nombre}`}
            onClick={() => toggleProveedor(row.id).then(refrescar)}
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
        title="Proveedores"
        description="Gestiona proveedores para compras y documentos soporte."
        actions={<Button onClick={abrirNuevo}><Plus className="h-4 w-4" /> Nuevo proveedor</Button>}
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
                placeholder="Buscar por nombre, NIT, contacto…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="h-9 w-64 pl-9"
              />
            </div>
          </>
        }
        emptyTitle="Sin proveedores"
        emptyDescription="Registra proveedores para usar en compras."
      />

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? `Editar ${editando.nombre}` : "Nuevo proveedor"}</DialogTitle>
            <DialogDescription>Datos para compras y documentos soporte.</DialogDescription>
          </DialogHeader>
          <FormProveedor
            proveedor={editando}
            disabled={pending}
            onListo={() => { setDialog(false); setEditando(null); refrescar(); }}
            onCancelar={() => { setDialog(false); setEditando(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormProveedor({
  proveedor,
  disabled,
  onListo,
  onCancelar,
}: {
  proveedor: Proveedor | null;
  disabled: boolean;
  onListo: () => void;
  onCancelar: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState(proveedor?.nombre ?? "");
  const [nit, setNit] = useState(proveedor?.nit ?? "");
  const [contacto, setContacto] = useState(proveedor?.contacto ?? "");
  const [telefono, setTelefono] = useState(proveedor?.telefono ?? "");
  const [email, setEmail] = useState(proveedor?.email ?? "");
  const [direccion, setDireccion] = useState(proveedor?.direccion ?? "");
  const [notas, setNotas] = useState(proveedor?.notas ?? "");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await guardarProveedor({
      id: proveedor?.id,
      nombre,
      nit: nit || null,
      contacto: contacto || null,
      telefono: telefono || null,
      email: email || null,
      direccion: direccion || null,
      notas: notas || null,
    });
    if (!res.ok) return setError(res.error);
    onListo();
  }

  return (
    <form onSubmit={enviar} className="grid gap-3">
      <label className="grid gap-1">
        <span className="text-xs font-semibold text-slate-600">Nombre *</span>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} maxLength={80} placeholder="Distribuidora Textil S.A." />
      </label>
      <div className="grid gap-1 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">NIT</span>
          <Input value={nit} onChange={(e) => setNit(e.target.value)} maxLength={20} placeholder="900.123.456-7" />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Contacto</span>
          <Input value={contacto} onChange={(e) => setContacto(e.target.value)} maxLength={120} placeholder="Carlos Gómez" />
        </label>
      </div>
      <div className="grid gap-1 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Teléfono</span>
          <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} maxLength={20} placeholder="310 987 6543" />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Email</span>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} placeholder="compras@proveedor.com" />
        </label>
      </div>
      <label className="grid gap-1">
        <span className="text-xs font-semibold text-slate-600">Dirección</span>
        <Input value={direccion} onChange={(e) => setDireccion(e.target.value)} maxLength={200} />
      </label>
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
        <Button type="submit" disabled={disabled}>{proveedor ? "Guardar" : "Crear"}</Button>
      </DialogFooter>
    </form>
  );
}