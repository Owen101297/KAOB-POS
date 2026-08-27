import type { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Rol } from '@prisma/client';
import { listarUsuarios } from '@/lib/actions/usuarios';
import GestionUsuariosClient from '@/components/usuarios/GestionUsuariosClient';

export const metadata: Metadata = {
  title: 'Usuarios y Roles | KAOB POS',
  description: 'Gestión de usuarios y asignación de permisos por rol',
};

export default async function UsuariosPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.rol !== Rol.ADMIN) {
    redirect('/ventas/nueva');
  }

  const usuarios = await listarUsuarios();

  return (
    <div className="space-y-6">
      <GestionUsuariosClient usuariosIniciales={usuarios} />
    </div>
  );
}
