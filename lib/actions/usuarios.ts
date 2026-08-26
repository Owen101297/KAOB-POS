"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { Rol } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/validations";
import { auth } from "@/auth";

export async function listarUsuarios() {
  const users = await db.usuario.findMany({
    select: {
      id: true,
      email: true,
      nombre: true,
      rol: true,
      activo: true,
      createdAt: true,
    },
    orderBy: { nombre: "asc" },
  });
  return users;
}

export async function crearUsuario(input: {
  email: string;
  nombre: string;
  password: string;
  rol: Rol;
}): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (session?.user?.rol !== Rol.ADMIN) {
    return { ok: false, error: "Solo administradores pueden crear usuarios" };
  }

  const existing = await db.usuario.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    return { ok: false, error: "Ya existe un usuario con ese email" };
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await db.usuario.create({
    data: {
      email: input.email,
      nombre: input.nombre,
      passwordHash,
      rol: input.rol,
      activo: true,
    },
    select: { id: true },
  });

  revalidatePath("/usuarios");
  return { ok: true, data: { id: user.id } };
}

export async function actualizarUsuario(
  id: string,
  input: { nombre: string; email: string; rol: Rol; activo: boolean }
): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.rol !== Rol.ADMIN) {
    return { ok: false, error: "Solo administradores pueden editar usuarios" };
  }

  await db.usuario.update({
    where: { id },
    data: {
      nombre: input.nombre,
      email: input.email,
      rol: input.rol,
      activo: input.activo,
    },
  });

  revalidatePath("/usuarios");
  return { ok: true };
}

export async function resetPassword(
  id: string,
  newPassword: string
): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.rol !== Rol.ADMIN) {
    return {
      ok: false,
      error: "Solo administradores pueden cambiar contraseñas",
    };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.usuario.update({
    where: { id },
    data: { passwordHash },
  });

  return { ok: true };
}

export async function toggleUsuario(id: string): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.rol !== Rol.ADMIN) {
    return {
      ok: false,
      error: "Solo administradores pueden desactivar usuarios",
    };
  }

  const user = await db.usuario.findUnique({
    where: { id },
    select: { activo: true },
  });
  if (!user) return { ok: false, error: "Usuario no encontrado" };

  await db.usuario.update({
    where: { id },
    data: { activo: !user.activo },
  });

  revalidatePath("/usuarios");
  return { ok: true };
}
