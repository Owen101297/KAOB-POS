"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  bodegaSchema,
  categoriaSchema,
  colorSchema,
  errorDesconocido,
  grupoTallaSchema,
  marcaSchema,
  nombreSchema,
  type ActionResult,
} from "@/lib/validations";
import type { Prisma } from "@prisma/client";

// ─────────────────────────── BODEGAS ─────────────────────────

export async function listarBodegas(soloActivas = false) {
  return db.bodega.findMany({
    where: soloActivas ? { activa: true } : undefined,
    orderBy: [{ esPrincipal: "desc" }, { nombre: "asc" }],
  });
}

/** Garantiza que exista una bodega principal (infraestructura mínima del sistema) */
export async function asegurarBodegaPrincipal() {
  const existente = await db.bodega.findFirst({ where: { esPrincipal: true } });
  if (existente) return existente;
  const cualquierActiva = await db.bodega.findFirst({ where: { activa: true } });
  if (cualquierActiva) return cualquierActiva;
  return db.bodega.create({ data: { nombre: "Principal", esPrincipal: true } });
}

export async function guardarBodega(input: unknown): Promise<ActionResult> {
  try {
    const data = bodegaSchema.parse(input);
    if (data.id) {
      await db.$transaction(async (tx) => {
        if (data.esPrincipal) {
          await tx.bodega.updateMany({
            where: { esPrincipal: true, NOT: { id: data.id } },
            data: { esPrincipal: false },
          });
        }
        await tx.bodega.update({
          where: { id: data.id },
          data: {
            nombre: data.nombre,
            direccion: data.direccion || null,
            esPrincipal: data.esPrincipal,
          },
        });
      });
    } else {
      await db.$transaction(async (tx) => {
        if (data.esPrincipal) {
          await tx.bodega.updateMany({ where: { esPrincipal: true }, data: { esPrincipal: false } });
        }
        await tx.bodega.create({
          data: {
            nombre: data.nombre,
            direccion: data.direccion || null,
            esPrincipal: data.esPrincipal,
          },
        });
      });
    }
    revalidatePath("/configuracion/catalogos");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function toggleBodega(id: number): Promise<ActionResult> {
  try {
    const bodega = await db.bodega.findUniqueOrThrow({ where: { id } });
    if (bodega.esPrincipal && bodega.activa) {
      return { ok: false, error: "No puedes desactivar la bodega principal." };
    }
    await db.bodega.update({ where: { id }, data: { activa: !bodega.activa } });
    revalidatePath("/configuracion/catalogos");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

// ─────────────────────────── MARCAS ──────────────────────────

export async function listarMarcas() {
  return db.marca.findMany({ orderBy: { nombre: "asc" } });
}

export async function guardarMarca(nombreInput: string): Promise<ActionResult> {
  try {
    const { nombre } = marcaSchema.parse({ nombre: nombreInput });
    await db.marca.create({ data: { nombre } });
    revalidatePath("/configuracion/catalogos");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function actualizarMarca(id: number, nombreInput: string): Promise<ActionResult> {
  try {
    const { nombre } = marcaSchema.parse({ nombre: nombreInput });
    await db.marca.update({ where: { id }, data: { nombre } });
    revalidatePath("/configuracion/catalogos");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function toggleMarca(id: number): Promise<ActionResult> {
  try {
    const marca = await db.marca.findUniqueOrThrow({ where: { id } });
    await db.marca.update({ where: { id }, data: { activa: !marca.activa } });
    revalidatePath("/configuracion/catalogos");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function eliminarMarca(id: number): Promise<ActionResult> {
  try {
    const prodsCount = await db.producto.count({ where: { marcaId: id } });
    if (prodsCount > 0) {
      return { ok: false, error: `No se puede eliminar la marca porque tiene ${prodsCount} producto(s) asignado(s). Puedes desactivarla.` };
    }
    await db.marca.delete({ where: { id } });
    revalidatePath("/configuracion/catalogos");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

// ───────────────────────── CATEGORÍAS ────────────────────────

export async function listarCategorias() {
  return db.categoria.findMany({
    orderBy: { nombre: "asc" },
    include: { padre: { select: { nombre: true } } },
  });
}

export async function guardarCategoria(input: unknown): Promise<ActionResult> {
  try {
    const data = categoriaSchema.parse(input);
    if (data.padreId != null) {
      const padre = await db.categoria.findUnique({ where: { id: data.padreId } });
      if (!padre) return { ok: false, error: "La categoría padre no existe." };
    }
    await db.categoria.create({
      data: { nombre: data.nombre, padreId: data.padreId ?? null },
    });
    revalidatePath("/configuracion/catalogos");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function actualizarCategoria(
  id: number,
  input: unknown
): Promise<ActionResult> {
  try {
    const data = categoriaSchema.parse(input);
    if (data.padreId === id) {
      return { ok: false, error: "Una categoría no puede ser su propia padre." };
    }
    await db.categoria.update({
      where: { id },
      data: { nombre: data.nombre, padreId: data.padreId ?? null },
    });
    revalidatePath("/configuracion/catalogos");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function eliminarCategoria(id: number): Promise<ActionResult> {
  try {
    const subcats = await db.categoria.count({ where: { padreId: id } });
    if (subcats > 0) {
      return { ok: false, error: `No se puede eliminar la categoría porque tiene ${subcats} subcategoría(s) hija(s). Elimínalas o muévelas primero.` };
    }
    const prodsCount = await db.producto.count({ where: { categoriaId: id } });
    if (prodsCount > 0) {
      return { ok: false, error: `No se puede eliminar porque tiene ${prodsCount} producto(s) asignado(s). Cambia su categoría primero.` };
    }
    await db.categoria.delete({ where: { id } });
    revalidatePath("/configuracion/catalogos");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

// ─────────────────────────── COLORES ─────────────────────────

export async function listarColores() {
  return db.color.findMany({ orderBy: { nombre: "asc" } });
}

export async function guardarColor(input: unknown): Promise<ActionResult> {
  try {
    const data = colorSchema.parse(input);
    await db.color.create({
      data: { nombre: data.nombre, hex: data.hex || null },
    });
    revalidatePath("/configuracion/catalogos");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function actualizarColor(id: number, input: unknown): Promise<ActionResult> {
  try {
    const data = colorSchema.parse(input);
    await db.color.update({
      where: { id },
      data: { nombre: data.nombre, hex: data.hex || null },
    });
    revalidatePath("/configuracion/catalogos");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function eliminarColor(id: number): Promise<ActionResult> {
  try {
    const variantesCount = await db.variante.count({ where: { colorId: id } });
    if (variantesCount > 0) {
      return { ok: false, error: `No se puede eliminar el color porque existen ${variantesCount} variante(s) de productos creadas con este color.` };
    }
    await db.color.delete({ where: { id } });
    revalidatePath("/configuracion/catalogos");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

// ─────────────────────── GRUPOS DE TALLA ─────────────────────

export async function listarGruposTalla() {
  return db.grupoTalla.findMany({
    orderBy: { nombre: "asc" },
    include: { tallas: { orderBy: { orden: "asc" } } },
  });
}

export async function guardarGrupoTalla(input: unknown): Promise<ActionResult> {
  try {
    const data = grupoTallaSchema.parse(input);
    await db.grupoTalla.create({
      data: {
        nombre: data.nombre,
        tallas: { create: data.tallas.map((t, i) => ({ valor: t.valor, orden: t.orden || i })) },
      },
    });
    revalidatePath("/configuracion/catalogos");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function actualizarGrupoTalla(id: number, nombreInput: string): Promise<ActionResult> {
  try {
    const nombre = nombreSchema.parse(nombreInput);
    await db.grupoTalla.update({ where: { id }, data: { nombre } });
    revalidatePath("/configuracion/catalogos");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function eliminarGrupoTalla(id: number): Promise<ActionResult> {
  try {
    // Verificar si hay variantes que usen las tallas de este grupo
    const tallasGrupo = await db.talla.findMany({ where: { grupoId: id }, select: { id: true } });
    const tallaIds = tallasGrupo.map((t) => t.id);
    if (tallaIds.length > 0) {
      const variantesConTalla = await db.variante.count({ where: { tallaId: { in: tallaIds } } });
      if (variantesConTalla > 0) {
        return { ok: false, error: `No se puede eliminar el grupo porque existen ${variantesConTalla} variante(s) de productos usando sus tallas.` };
      }
    }

    await db.$transaction(async (tx) => {
      await tx.talla.deleteMany({ where: { grupoId: id } });
      await tx.grupoTalla.delete({ where: { id } });
    });
    revalidatePath("/configuracion/catalogos");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function agregarTallaAGrupo(grupoId: number, valor: string): Promise<ActionResult> {
  try {
    const { valor: v } = tallaUnicaSafe(valor);
    const grupo = await db.grupoTalla.findUniqueOrThrow({
      where: { id: grupoId },
      include: { tallas: true },
    });
    const maxOrden = Math.max(-1, ...grupo.tallas.map((t) => t.orden));
    await db.talla.create({ data: { grupoId, valor: v, orden: maxOrden + 1 } });
    revalidatePath("/configuracion/catalogos");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

export async function eliminarTalla(tallaId: number): Promise<ActionResult> {
  try {
    const variantesCount = await db.variante.count({ where: { tallaId } });
    if (variantesCount > 0) {
      return { ok: false, error: `No se puede eliminar la talla porque hay ${variantesCount} variante(s) de productos creadas con esta talla.` };
    }
    await db.talla.delete({ where: { id: tallaId } });
    revalidatePath("/configuracion/catalogos");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

function tallaUnicaSafe(valor: string) {
  return { valor: nombreSchema.parse(valor).slice(0, 12) };
}

// ─────────────────── CONSULTA AGREGADA FORMULARIOS ────────────

export type CatalogosCompletos = Prisma.PromiseReturnType<typeof obtenerCatalogos>;

export async function obtenerCatalogos() {
  const [bodegas, marcas, categorias, colores, grupos] = await Promise.all([
    db.bodega.findMany({ where: { activa: true }, orderBy: [{ esPrincipal: "desc" }, { nombre: "asc" }] }),
    db.marca.findMany({ where: { activa: true }, orderBy: { nombre: "asc" } }),
    db.categoria.findMany({ orderBy: { nombre: "asc" }, include: { padre: { select: { nombre: true } } } }),
    db.color.findMany({ orderBy: { nombre: "asc" } }),
    db.grupoTalla.findMany({ orderBy: { nombre: "asc" }, include: { tallas: { orderBy: { orden: "asc" } } } }),
  ]);
  return { bodegas, marcas, categorias, colores, grupos };
}
