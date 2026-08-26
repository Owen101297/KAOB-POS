import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { Rol } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { email, nombre, password, rol } = await req.json();

    if (!email || !nombre || !password) {
      return NextResponse.json(
        { error: "Email, nombre y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    const existing = await db.usuario.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese email" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.usuario.create({
      data: {
        email,
        nombre,
        passwordHash,
        rol: (rol as Rol) ?? Rol.CAJERO,
        activo: true,
      },
      select: { id: true, email: true, nombre: true, rol: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error registering user:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
