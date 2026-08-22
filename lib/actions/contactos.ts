"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  clienteSchema,
  domiciliarioSchema,
  errorDesconocido,
  proveedorSchema,
  vendedorSchema,
  type ActionResult,
} from "@/lib/validations";
import type { Prisma } from "@prisma/client";

const PATH_CLIENTES = "/clientes";
const PATH_PROVEEDORES = "/proveedores";
const PATH_VENDEDORES = "/vendedores";
const PATH_DOMICILIARIOS = "/domiciliarios";

function revalidarContactos() {
  revalidatePath(PATH_CLIENTES);
  revalidatePath(PATH_PROVEEDORES);
  revalidatePath(PATH_VENDEDORES);
  revalidatePath(PATH_DOMICILIARIOS);
}

// ─────────────────────────── CLIENTES ──────────────────────────

export async function listarClientes(soloActivos = false, q?: string) {
  return db.cliente.findMany({
    where: {
      ...(soloActivos ? { activo: true } : {}),
      ...(q
        ? {
            OR: [
              { nombre: { contains: q, mode: "insensitive" } },
              { telefono: { contains: q } },
              { documento: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { nombre: "asc" },
  });
}

export async function obtenerCliente(id: number) {
  return db.cliente.findUnique({ where: { id } });
}

export async function guardarCliente(input: unknown): Promise<ActionResult<{ id: number }>> {
  try {
    const data = clienteSchema.parse(input);
    if (data.documento && data.tipoDoc !== "OTRO") {
      const existe = await db.cliente.findFirst({
        where: { tipoDoc: data.tipoDoc, documento: data.documento, NOT: { id: data.id ?? 0 } },
      });
      if (existe) return { ok: false, error: "Ya existe un cliente con ese documento." };
    }
    let cliente;
    if (data.id) {
      cliente = await db.cliente.update({
        where: { id: data.id },
        data: {
          nombre: data.nombre,
          tipoDoc: data.tipoDoc,
          documento: data.documento || null,
          telefono: data.telefono || null,
          direccion: data.direccion || null,
          ciudad: data.ciudad || null,
          email: data.email || null,
          cupoCredito: data.cupoCredito,
          diasCredito: data.diasCredito,
          notas: data.notas || null,
          activo: true,
        },
      });
    } else {
      cliente = await db.cliente.create({
        data: {
          nombre: data.nombre,
          tipoDoc: data.tipoDoc,
          documento: data.documento || null,
          telefono: data.telefono || null,
          direccion: data.direccion || null,
          ciudad: data.ciudad || null,
          email: data.email || null,
          cupoCredito: data.cupoCredito,
          diasCredito: data.diasCredito,
          notas: data.notas || null,
        },
      });
    }
    revalidarContactos();
    return { ok: true, data: { id: cliente.id } };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function toggleCliente(id: number): Promise<ActionResult> {
  try {
    const c = await db.cliente.findUniqueOrThrow({ where: { id } });
    await db.cliente.update({ where: { id }, data: { activo: !c.activo } });
    revalidarContactos();
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

// ────────────────────────── PROVEEDORES ─────────────────────────

export async function listarProveedores(soloActivos = false) {
  return db.proveedor.findMany({
    where: soloActivos ? { activo: true } : undefined,
    orderBy: { nombre: "asc" },
  });
}

export async function guardarProveedor(input: unknown): Promise<ActionResult<{ id: number }>> {
  try {
    const data = proveedorSchema.parse(input);
    let prov;
    if (data.id) {
      prov = await db.proveedor.update({
        where: { id: data.id },
        data: {
          nombre: data.nombre,
          nit: data.nit || null,
          contacto: data.contacto || null,
          telefono: data.telefono || null,
          email: data.email || null,
          direccion: data.direccion || null,
          notas: data.notas || null,
          activo: true,
        },
      });
    } else {
      prov = await db.proveedor.create({
        data: {
          nombre: data.nombre,
          nit: data.nit || null,
          contacto: data.contacto || null,
          telefono: data.telefono || null,
          email: data.email || null,
          direccion: data.direccion || null,
          notas: data.notas || null,
        },
      });
    }
    revalidarContactos();
    return { ok: true, data: { id: prov.id } };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function toggleProveedor(id: number): Promise<ActionResult> {
  try {
    const p = await db.proveedor.findUniqueOrThrow({ where: { id } });
    await db.proveedor.update({ where: { id }, data: { activo: !p.activo } });
    revalidarContactos();
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

// ─────────────────────────── VENDEDORES ─────────────────────────

export async function listarVendedores(soloActivos = false) {
  return db.vendedor.findMany({
    where: soloActivos ? { activo: true } : undefined,
    orderBy: { nombre: "asc" },
  });
}

export async function guardarVendedor(input: unknown): Promise<ActionResult<{ id: number }>> {
  try {
    const data = vendedorSchema.parse(input);
    let v;
    if (data.id) {
      v = await db.vendedor.update({
        where: { id: data.id },
        data: {
          nombre: data.nombre,
          telefono: data.telefono || null,
          comisionPct: data.comisionPct,
          activo: true,
        },
      });
    } else {
      v = await db.vendedor.create({
        data: { nombre: data.nombre, telefono: data.telefono || null, comisionPct: data.comisionPct },
      });
    }
    revalidarContactos();
    return { ok: true, data: { id: v.id } };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function toggleVendedor(id: number): Promise<ActionResult> {
  try {
    const v = await db.vendedor.findUniqueOrThrow({ where: { id } });
    await db.vendedor.update({ where: { id }, data: { activo: !v.activo } });
    revalidarContactos();
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

// ──────────────────────── DOMICILIARIOS ─────────────────────────

export async function listarDomiciliarios(soloActivos = false) {
  return db.domiciliario.findMany({
    where: soloActivos ? { activo: true } : undefined,
    orderBy: { nombre: "asc" },
  });
}

export async function guardarDomiciliario(input: unknown): Promise<ActionResult<{ id: number }>> {
  try {
    const data = domiciliarioSchema.parse(input);
    let d;
    if (data.id) {
      d = await db.domiciliario.update({
        where: { id: data.id },
        data: { nombre: data.nombre, telefono: data.telefono || null, activo: true },
      });
    } else {
      d = await db.domiciliario.create({
        data: { nombre: data.nombre, telefono: data.telefono || null },
      });
    }
    revalidarContactos();
    return { ok: true, data: { id: d.id } };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function toggleDomiciliario(id: number): Promise<ActionResult> {
  try {
    const d = await db.domiciliario.findUniqueOrThrow({ where: { id } });
    await db.domiciliario.update({ where: { id }, data: { activo: !d.activo } });
    revalidarContactos();
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

// ────────────────────────── BÚSQUEDA RÁPIDA ──────────────────────

export async function buscarClientesRapido(q: string) {
  if (!q || q.length < 2) return [];
  return db.cliente.findMany({
    where: {
      activo: true,
      OR: [
        { nombre: { contains: q, mode: "insensitive" } },
        { telefono: { contains: q } },
        { documento: { contains: q } },
      ],
    },
    take: 10,
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, tipoDoc: true, documento: true, telefono: true, cupoCredito: true, diasCredito: true },
  });
}