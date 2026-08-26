"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, KeyRound, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import {
  crearUsuario,
  actualizarUsuario,
  resetPassword,
  toggleUsuario,
} from "@/lib/actions/usuarios";
import { useRouter as useRefresh } from "next/navigation";

type Usuario = {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  activo: boolean;
  createdAt: Date;
};

const ROL_OPTIONS = [
  { value: "ADMIN", label: "Administrador" },
  { value: "GERENTE", label: "Gerente" },
  { value: "CAJERO", label: "Cajero" },
  { value: "VENDEDOR", label: "Vendedor" },
  { value: "BODEGUERO", label: "Bodeguero" },
];

const ROL_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800",
  GERENTE: "bg-purple-100 text-purple-800",
  CAJERO: "bg-blue-100 text-blue-800",
  VENDEDOR: "bg-green-100 text-green-800",
  BODEGUERO: "bg-amber-100 text-amber-800",
};

export default function UsuariosClient({
  usuarios: initial,
}: {
  usuarios: Usuario[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [pwUserId, setPwUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "CAJERO",
  });

  function openCreate() {
    setEditing(null);
    setForm({ nombre: "", email: "", password: "", rol: "CAJERO" });
    setError("");
    setOpen(true);
  }

  function openEdit(u: Usuario) {
    setEditing(u);
    setForm({ nombre: u.nombre, email: u.email, password: "", rol: u.rol });
    setError("");
    setOpen(true);
  }

  function openResetPw(userId: string) {
    setPwUserId(userId);
    setForm((f) => ({ ...f, password: "" }));
    setError("");
    setPwOpen(true);
  }

  async function handleSave() {
    setLoading(true);
    setError("");
    try {
      if (editing) {
        const res = await actualizarUsuario(editing.id, {
          nombre: form.nombre,
          email: form.email,
          rol: form.rol as any,
          activo: editing.activo,
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
      } else {
        if (!form.password || form.password.length < 6) {
          setError("La contraseña debe tener al menos 6 caracteres");
          return;
        }
        const res = await crearUsuario({
          nombre: form.nombre,
          email: form.email,
          password: form.password,
          rol: form.rol as any,
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPw() {
    setLoading(true);
    setError("");
    try {
      if (!form.password || form.password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        return;
      }
      const res = await resetPassword(pwUserId, form.password);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPwOpen(false);
    } catch {
      setError("Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(id: string) {
    await toggleUsuario(id);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Gestiona los usuarios del sistema"
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" />
            Nuevo Usuario
          </Button>
        }
      />

      {/* Lista */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {initial.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                >
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {u.nombre}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROL_COLORS[u.rol] || "bg-slate-100 text-slate-800"}`}
                    >
                      {ROL_OPTIONS.find((r) => r.value === u.rol)?.label ||
                        u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.activo ? "success" : "danger"}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(u)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openResetPw(u.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        title="Cambiar contraseña"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggle(u.id)}
                        className={`rounded-lg p-1.5 ${u.activo ? "text-slate-400 hover:bg-red-50 hover:text-red-600" : "text-slate-400 hover:bg-green-50 hover:text-green-600"}`}
                        title={u.activo ? "Desactivar" : "Activar"}
                      >
                        {u.activo ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {initial.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    No hay usuarios registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal crear/editar */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Usuario" : "Nuevo Usuario"}
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Nombre
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nombre: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>
            {!editing && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Rol
              </label>
              <select
                value={form.rol}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rol: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                {ROL_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Guardando..." : editing ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal reset password */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Nueva Contraseña
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleResetPw} disabled={loading}>
              {loading ? "Guardando..." : "Actualizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
