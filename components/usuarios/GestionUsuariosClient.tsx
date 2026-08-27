'use client';

import { useState } from 'react';
import { Rol } from '@prisma/client';
import {
  crearUsuario,
  actualizarUsuario,
  resetPassword,
  toggleUsuario,
} from '@/lib/actions/usuarios';
import DataTable from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  UserPlus,
  KeyRound,
  Edit2,
  CheckCircle2,
  XCircle,
  Users,
  Lock,
  Mail,
  User,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

interface UsuarioItem extends Record<string, unknown> {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  createdAt: Date;
}

const ROL_CONFIG: Record<
  Rol,
  { label: string; variant: 'warning' | 'info' | 'success' | 'neutral' | 'outline'; desc: string }
> = {
  ADMIN: { label: 'Administrador', variant: 'warning', desc: 'Acceso total y configuración' },
  GERENTE: { label: 'Gerente', variant: 'info', desc: 'Operaciones, informes y compras' },
  CAJERO: { label: 'Cajero', variant: 'success', desc: 'Caja, POS y cobros' },
  VENDEDOR: { label: 'Vendedor', variant: 'neutral', desc: 'Ventas de mostrador y pedidos' },
  BODEGUERO: { label: 'Bodeguero', variant: 'outline', desc: 'Inventario, stock y traslados' },
};

export default function GestionUsuariosClient({
  usuariosIniciales,
}: {
  usuariosIniciales: UsuarioItem[];
}) {
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>(usuariosIniciales);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Modales
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalPasswordOpen, setModalPasswordOpen] = useState(false);

  // Form State Crear
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [nuevoRol, setNuevoRol] = useState<Rol>(Rol.CAJERO);

  // Form State Editar
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioItem | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRol, setEditRol] = useState<Rol>(Rol.CAJERO);
  const [editActivo, setEditActivo] = useState(true);

  // Form State Reset Password
  const [usuarioPassword, setUsuarioPassword] = useState<UsuarioItem | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const mostrarMensaje = (tipo: 'success' | 'error', texto: string) => {
    setMsg({ tipo, texto });
    setTimeout(() => setMsg(null), 4000);
  };

  // Crear Usuario
  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await crearUsuario({
      nombre: nuevoNombre,
      email: nuevoEmail,
      password: nuevoPassword,
      rol: nuevoRol,
    });
    setLoading(false);

    if (res.ok && res.data) {
      setUsuarios((prev) => [
        ...prev,
        {
          id: res.data.id,
          nombre: nuevoNombre,
          email: nuevoEmail,
          rol: nuevoRol,
          activo: true,
          createdAt: new Date(),
        },
      ]);
      setModalCrearOpen(false);
      setNuevoNombre('');
      setNuevoEmail('');
      setNuevoPassword('');
      setNuevoRol(Rol.CAJERO);
      mostrarMensaje('success', 'Usuario creado exitosamente');
    } else if (!res.ok) {
      mostrarMensaje('error', res.error || 'Error al crear usuario');
    }
  };

  // Editar Usuario
  const openEditar = (u: UsuarioItem) => {
    setUsuarioEditando(u);
    setEditNombre(u.nombre);
    setEditEmail(u.email);
    setEditRol(u.rol);
    setEditActivo(u.activo);
    setModalEditarOpen(true);
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEditando) return;
    setLoading(true);
    const res = await actualizarUsuario(usuarioEditando.id, {
      nombre: editNombre,
      email: editEmail,
      rol: editRol,
      activo: editActivo,
    });
    setLoading(false);

    if (res.ok) {
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuarioEditando.id
            ? { ...u, nombre: editNombre, email: editEmail, rol: editRol, activo: editActivo }
            : u
        )
      );
      setModalEditarOpen(false);
      mostrarMensaje('success', 'Usuario actualizado');
    } else {
      mostrarMensaje('error', res.error || 'Error al actualizar');
    }
  };

  // Reset Password
  const openPassword = (u: UsuarioItem) => {
    setUsuarioPassword(u);
    setNewPassword('');
    setModalPasswordOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioPassword) return;
    setLoading(true);
    const res = await resetPassword(usuarioPassword.id, newPassword);
    setLoading(false);

    if (res.ok) {
      setModalPasswordOpen(false);
      mostrarMensaje('success', `Contraseña de ${usuarioPassword.nombre} restablecida`);
    } else {
      mostrarMensaje('error', res.error || 'Error al restablecer contraseña');
    }
  };

  // Toggle Activo
  const handleToggle = async (u: UsuarioItem) => {
    const res = await toggleUsuario(u.id);
    if (res.ok) {
      setUsuarios((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, activo: !item.activo } : item))
      );
      mostrarMensaje('success', `Estado de ${u.nombre} actualizado`);
    } else {
      mostrarMensaje('error', res.error || 'Error al cambiar estado');
    }
  };

  const columns = [
    {
      key: 'nombre',
      label: 'Usuario / Colaborador',
      render: (u: UsuarioItem) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-sm">
            {u.nombre.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{u.nombre}</div>
            <div className="text-xs text-slate-500 font-mono">{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'rol',
      label: 'Rol / Permisos',
      render: (u: UsuarioItem) => {
        const config = ROL_CONFIG[u.rol] || { label: u.rol, variant: 'neutral', desc: '' };
        return (
          <div className="flex flex-col gap-0.5">
            <Badge variant={config.variant} className="w-fit font-bold">
              {config.label}
            </Badge>
            <span className="text-[11px] text-slate-400">{config.desc}</span>
          </div>
        );
      },
    },
    {
      key: 'activo',
      label: 'Estado',
      render: (u: UsuarioItem) => (
        <Badge variant={u.activo ? 'success' : 'danger'} className="font-bold">
          {u.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Registrado',
      render: (u: UsuarioItem) => (
        <span className="text-xs text-slate-500">
          {new Date(u.createdAt).toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (u: UsuarioItem) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openEditar(u)}
            title="Editar usuario"
            className="h-8 w-8 p-0"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openPassword(u)}
            title="Cambiar contraseña"
            className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700"
          >
            <KeyRound className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggle(u)}
            title={u.activo ? 'Desactivar acceso' : 'Activar acceso'}
            className={`h-8 w-8 p-0 ${u.activo ? 'text-red-600 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-700'}`}
          >
            {u.activo ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {msg && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-2xl p-4 shadow-2xl animate-slide-up flex items-center gap-3 border ${
            msg.tipo === 'success'
              ? 'bg-slate-900 text-white border-slate-700'
              : 'bg-red-950 text-red-200 border-red-800'
          }`}
        >
          {msg.tipo === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-red-400" />
          )}
          <span className="text-sm font-medium">{msg.texto}</span>
        </div>
      )}

      {/* Header y Acción Principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Users className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              Gestión de Usuarios y Roles
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Control de accesos y permisos por rol (Administrador, Gerente, Cajero, Vendedor, Bodeguero).
          </p>
        </div>

        <Button
          onClick={() => setModalCrearOpen(true)}
          className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
        >
          <UserPlus className="h-4 w-4" />
          <span>Crear Nuevo Usuario</span>
        </Button>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(Object.keys(ROL_CONFIG) as Rol[]).map((r) => {
          const count = usuarios.filter((u) => u.rol === r && u.activo).length;
          return (
            <div
              key={r}
              className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {ROL_CONFIG[r].label}
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">{count}</span>
                <span className="text-xs text-slate-400">activos</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabla Principal */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <DataTable
          columns={columns}
          data={usuarios}
          emptyTitle="No hay usuarios registrados"
          emptyDescription="Haz clic en 'Crear Nuevo Usuario' para registrar el primer colaborador."
        />
      </div>

      {/* ────────────────── MODAL CREAR USUARIO ────────────────── */}
      <Dialog open={modalCrearOpen} onOpenChange={setModalCrearOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <UserPlus className="h-5 w-5 text-slate-700" />
              <span>Crear Nuevo Usuario</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCrear} className="space-y-4 pt-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Ej: Carlos Gómez"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Correo Electrónico (Login)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="carlos@kaob.com"
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Contraseña Inicial
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={nuevoPassword}
                  onChange={(e) => setNuevoPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Rol del Sistema (Permisos)
              </label>
              <Select value={nuevoRol} onValueChange={(val) => setNuevoRol(val as Rol)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar rol..." />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROL_CONFIG) as Rol[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROL_CONFIG[r].label} &bull; {ROL_CONFIG[r].desc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalCrearOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="gap-2 bg-slate-900 text-white">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                <span>Guardar Usuario</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ────────────────── MODAL EDITAR USUARIO ────────────────── */}
      <Dialog open={modalEditarOpen} onOpenChange={setModalEditarOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Edit2 className="h-5 w-5 text-slate-700" />
              <span>Editar Usuario</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditar} className="space-y-4 pt-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Rol Asignado
              </label>
              <Select value={editRol} onValueChange={(val) => setEditRol(val as Rol)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar rol..." />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROL_CONFIG) as Rol[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROL_CONFIG[r].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <input
                type="checkbox"
                id="editActivoCheck"
                checked={editActivo}
                onChange={(e) => setEditActivo(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
              />
              <label htmlFor="editActivoCheck" className="text-sm font-medium text-slate-700">
                Usuario activo en el sistema
              </label>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalEditarOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="gap-2 bg-slate-900 text-white">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Guardar Cambios</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ────────────────── MODAL RESET PASSWORD ────────────────── */}
      <Dialog open={modalPasswordOpen} onOpenChange={setModalPasswordOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <KeyRound className="h-5 w-5 text-amber-600" />
              <span>Restablecer Contraseña</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
            <p className="text-xs text-slate-500">
              Ingresa una nueva contraseña para el usuario{' '}
              <strong className="text-slate-800">{usuarioPassword?.nombre}</strong> (
              {usuarioPassword?.email}).
            </p>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalPasswordOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="gap-2 bg-amber-600 text-white hover:bg-amber-700">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Actualizar Contraseña</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
