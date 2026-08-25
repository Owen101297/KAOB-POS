"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { errorDesconocido, type ActionResult } from "@/lib/validations";
import { generarSku } from "@/lib/constants";
import { parsearExcel } from "@/lib/excel/importar";
import type { FilaParseada } from "@/lib/excel/importar";
import type { Prisma } from "@prisma/client";
import type { Calidad, Genero } from "@prisma/client";

export interface ResumenImportacion {
  productosCreados: number;
  productosActualizados: number;
  variantesCreadas: number;
  filasAplicadas: number;
}

export interface VistaPreviaImportacion {
  totalFilas: number;
  errores: { fila: number; mensaje: string }[];
}

/**
 * Importación en dos fases: sin `ejecutar` devuelve solo la vista previa
 * (validación fila por fila); con `ejecutar=true` aplica todo de forma
 * atómica. Nunca duplica registros: busca por coincidencia insensible a
 * mayúsculas/minúsculas y espacios en blanco.
 */
export async function importarExcel(input: {
  base64: string;
  /** sumar: agrega el stock del archivo al existente · reemplazar: fija la cantidad */
  modoStock: "sumar" | "reemplazar";
  ejecutar: boolean;
}): Promise<
  ActionResult<ResumenImportacion & { vistaPrevia?: VistaPreviaImportacion }>
> {
  try {
    const datos = Buffer.from(input.base64, "base64");
    const { filas, errores } = await parsearExcel(datos);

    if (!input.ejecutar) {
      return {
        ok: true,
        data: {
          productosCreados: 0,
          productosActualizados: 0,
          variantesCreadas: 0,
          filasAplicadas: filas.length,
          vistaPrevia: { totalFilas: filas.length, errores },
        },
      };
    }
    if (errores.length > 0) {
      return { ok: false, error: `El archivo tiene ${errores.length} error(es). Corrígelos antes de importar.` };
    }

    const resumen = await db.$transaction(
      async (tx) => aplicarFilas(tx, filas, input.modoStock),
      { timeout: 60000 }
    );

    revalidatePath("/inventario");
    revalidatePath("/productos");
    revalidatePath("/movimientos");
    revalidatePath("/ventas/nueva");
    revalidatePath("/configuracion/catalogos");
    return { ok: true, data: { ...resumen, filasAplicadas: filas.length } };
  } catch (e) {
    if (e instanceof Error && e.message.includes("columnas")) {
      return { ok: false as const, error: e.message };
    }
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

type Tx = Prisma.TransactionClient;

async function aplicarFilas(
  tx: Tx,
  filas: FilaParseada[],
  modo: "sumar" | "reemplazar"
): Promise<Omit<ResumenImportacion, "filasAplicadas">> {
  // Caches para no consultar repetidamente
  const bodegasCache = new Map<string, number>();
  const marcasCache = new Map<string, number>();
  const categoriasCache = new Map<string, number>();
  const coloresCache = new Map<string, number>();
  const gruposCache = new Map<string, number>();
  const tallasCache = new Map<string, number>(); // grupoId|valor
  const productosCache = new Map<string, { id: number; referencia: string; creado: boolean }>();
  const skusExistentes = new Set(
    (await tx.variante.findMany({ select: { sku: true } })).map((v) => v.sku.toUpperCase())
  );

  let productosCreados = 0;
  let productosActualizados = 0;
  let variantesCreadas = 0;

  async function idBodega(nombreRaw: string): Promise<number> {
    const nombre = nombreRaw.trim();
    const clave = nombre.toUpperCase();
    const hit = bodegasCache.get(clave);
    if (hit) return hit;

    const existente = await tx.bodega.findFirst({
      where: { nombre: { equals: nombre, mode: "insensitive" } },
    });
    let id: number;
    if (existente) {
      id = existente.id;
    } else {
      const hayPrincipal = await tx.bodega.findFirst({ where: { esPrincipal: true } });
      const creada = await tx.bodega.create({
        data: { nombre, esPrincipal: !hayPrincipal },
      });
      id = creada.id;
    }
    bodegasCache.set(clave, id);
    return id;
  }

  async function idMarca(nombreRaw: string): Promise<number | null> {
    const nombre = (nombreRaw || "").trim();
    if (!nombre) return null;
    const clave = nombre.toUpperCase();
    const hit = marcasCache.get(clave);
    if (hit) return hit;

    const existente = await tx.marca.findFirst({
      where: { nombre: { equals: nombre, mode: "insensitive" } },
    });
    const id = existente?.id ?? (await tx.marca.create({ data: { nombre } })).id;
    marcasCache.set(clave, id);
    return id;
  }

  async function idCategoria(nombreRaw: string): Promise<number> {
    const nombre = (nombreRaw || "").trim();
    const clave = nombre.toUpperCase();
    const hit = categoriasCache.get(clave);
    if (hit) return hit;

    const existente = await tx.categoria.findFirst({
      where: { nombre: { equals: nombre, mode: "insensitive" } },
    });
    const id = existente?.id ?? (await tx.categoria.create({ data: { nombre } })).id;
    categoriasCache.set(clave, id);
    return id;
  }

  async function idColor(nombreRaw: string): Promise<number> {
    const nombre = (nombreRaw || "").trim();
    const clave = nombre.toUpperCase();
    const hit = coloresCache.get(clave);
    if (hit) return hit;

    const existente = await tx.color.findFirst({
      where: { nombre: { equals: nombre, mode: "insensitive" } },
    });
    const id = existente?.id ?? (await tx.color.create({ data: { nombre } })).id;
    coloresCache.set(clave, id);
    return id;
  }

  async function idTalla(grupoNombreRaw: string, valorRaw: string): Promise<number> {
    const grupoNombre = (grupoNombreRaw || "").trim();
    const valor = (valorRaw || "").trim();
    const claveGrupo = grupoNombre.toUpperCase();

    let grupoId = gruposCache.get(claveGrupo);
    if (!grupoId) {
      const grupoExistente = await tx.grupoTalla.findFirst({
        where: { nombre: { equals: grupoNombre, mode: "insensitive" } },
      });
      if (grupoExistente) {
        grupoId = grupoExistente.id;
      } else {
        const nuevoGrupo = await tx.grupoTalla.create({ data: { nombre: grupoNombre } });
        grupoId = nuevoGrupo.id;
      }
      gruposCache.set(claveGrupo, grupoId);
    }

    const claveTalla = `${grupoId}|${valor.toUpperCase()}`;
    const hitTalla = tallasCache.get(claveTalla);
    if (hitTalla) return hitTalla;

    let talla = await tx.talla.findFirst({
      where: { grupoId, valor: { equals: valor, mode: "insensitive" } },
    });
    if (!talla) {
      const maxOrden = await tx.talla.aggregate({ where: { grupoId }, _max: { orden: true } });
      talla = await tx.talla.create({
        data: { grupoId, valor, orden: (maxOrden._max.orden ?? -1) + 1 },
      });
    }
    tallasCache.set(claveTalla, talla.id);
    return talla.id;
  }

  async function productoDe(fila: FilaParseada) {
    const refLimpia = fila.referencia.trim().toUpperCase();
    const nomLimpio = fila.nombre.trim();
    const claveCache = refLimpia;
    const hit = productosCache.get(claveCache);
    if (hit) return hit;

    const categoriaId = await idCategoria(fila.categoria);
    const marcaId = await idMarca(fila.marca);

    const datosProducto = {
      nombre: nomLimpio,
      descripcion: null as string | null,
      categoriaId,
      marcaId,
      genero: (fila.genero || null) as Genero | null,
      material: fila.material?.trim() || null,
      calidad: (fila.calidad || null) as Calidad | null,
      temporada: fila.temporada?.trim() || null,
      costo: fila.costo,
      precioBase: fila.precio,
    };

    // Búsqueda insensible a mayúsculas y minúsculas por referencia O por nombre exacto
    const existente = await tx.producto.findFirst({
      where: {
        OR: [
          { referencia: { equals: refLimpia, mode: "insensitive" } },
          { nombre: { equals: nomLimpio, mode: "insensitive" } },
        ],
      },
    });

    if (existente) {
      await tx.producto.update({
        where: { id: existente.id },
        data: datosProducto,
      });
      productosActualizados++;
      const reg = { id: existente.id, referencia: existente.referencia, creado: false };
      productosCache.set(claveCache, reg);
      return reg;
    }

    const creado = await tx.producto.create({
      data: { referencia: refLimpia, ...datosProducto },
    });
    productosCreados++;
    const reg = { id: creado.id, referencia: creado.referencia, creado: true };
    productosCache.set(claveCache, reg);
    return reg;
  }

  async function varianteDe(
    productoId: number,
    referencia: string,
    colorId: number,
    colorNombre: string,
    tallaId: number,
    tallaValor: string
  ) {
    // 1. Buscar por IDs exactos
    let existente = await tx.variante.findUnique({
      where: { productoId_colorId_tallaId: { productoId, colorId, tallaId } },
    });

    // 2. Si no se encuentra, buscar variantes del producto con igual nombre de color y talla (tolerante a IDs distintos)
    if (!existente) {
      existente = await tx.variante.findFirst({
        where: {
          productoId,
          color: { nombre: { equals: colorNombre.trim(), mode: "insensitive" } },
          talla: { valor: { equals: tallaValor.trim(), mode: "insensitive" } },
        },
      });
    }

    if (existente) return { id: existente.id, creada: false };

    // 3. Crear variante única si no existe
    let sku = generarSku(referencia, colorNombre, tallaValor).toUpperCase();
    let n = 2;
    while (skusExistentes.has(sku)) {
      sku = `${generarSku(referencia, colorNombre, tallaValor).toUpperCase()}-${n++}`;
    }
    skusExistentes.add(sku);

    const creado = await tx.variante.create({
      data: { productoId, colorId, tallaId, sku },
    });
    variantesCreadas++;
    return { id: creado.id, creada: true };
  }

  for (const fila of filas) {
    const [bodegaId, colorId, tallaId] = await Promise.all([
      idBodega(fila.bodega),
      idColor(fila.color),
      idTalla(fila.grupoTalla, fila.talla),
    ]);

    const producto = await productoDe(fila);
    const variante = await varianteDe(
      producto.id,
      producto.referencia,
      colorId,
      fila.color,
      tallaId,
      fila.talla
    );

    const stockActual = await tx.stockBodega.findUnique({
      where: { varianteId_bodegaId: { varianteId: variante.id, bodegaId } },
    });

    const cantidadBase = stockActual?.cantidad ?? 0;
    const cantidadNueva = modo === "sumar" ? cantidadBase + fila.stock : fila.stock;
    const delta = cantidadNueva - cantidadBase;

    await tx.stockBodega.upsert({
      where: { varianteId_bodegaId: { varianteId: variante.id, bodegaId } },
      create: {
        varianteId: variante.id,
        bodegaId,
        cantidad: cantidadNueva,
        minimo: fila.minimo,
      },
      update: {
        cantidad: cantidadNueva,
        minimo: fila.minimo,
      },
    });

    if (delta !== 0) {
      await tx.movimientoInventario.create({
        data: {
          varianteId: variante.id,
          tipo: delta > 0 ? "AJUSTE_ENTRADA" : "AJUSTE_SALIDA",
          cantidad: Math.abs(delta),
          bodegaDestinoId: delta > 0 ? bodegaId : null,
          bodegaOrigenId: delta < 0 ? bodegaId : null,
          nota: `Importación Excel (${modo === "sumar" ? "Sumar stock" : "Reemplazar stock"})`,
        },
      });
    }
  }

  return { productosCreados, productosActualizados, variantesCreadas };
}
