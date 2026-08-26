"use server";

import { auth, signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/validations";
import { Rol } from "@prisma/client";

export async function loginWithCredentials(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { ok: false, error: "Email y contraseña son obligatorios" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
    return { ok: true };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    return { ok: false, error: "Credenciales inválidas" };
  }
}

export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/" });
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) return null;

  const user = await db.usuario.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      nombre: true,
      rol: true,
      imagen: true,
      activo: true,
    },
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("No autenticado");
  }
  return user;
}

export async function requireRole(roles: Rol[]) {
  const user = await requireAuth();
  if (!roles.includes(user.rol)) {
    throw new Error("No autorizado");
  }
  return user;
}
