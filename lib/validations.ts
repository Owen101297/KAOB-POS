import { z } from "zod";

// ───────────────────────── CATÁLOGOS ─────────────────────────

export const nombreSchema = z
  .string()
  .trim()
  .min(2, "Mínimo 2 caracteres")
  .max(80, "Máximo 80 caracteres");

export const bodegaSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  nombre: nombreSchema,
  direccion: z.string().trim().max(200).optional().or(z.literal("")),
  esPrincipal: z.boolean().default(false),
});

export const marcaSchema = z.object({ nombre: nombreSchema });

export const categoriaSchema = z.object({
  nombre: nombreSchema,
  padreId: z.coerce.number().int().positive().nullable().optional(),
});

export const colorSchema = z.object({
  nombre: nombreSchema,
  hex: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})?$/, "Formato hex inválido (#RRGGBB)")
    .optional()
    .or(z.literal("")),
});

export const grupoTallaSchema = z.object({
  nombre: nombreSchema,
  tallas: z
    .array(
      z.object({
        valor: z.string().trim().min(1).max(12),
        orden: z.coerce.number().int().min(0).default(0),
      })
    )
    .min(1, "Agrega al menos una talla"),
});

export const tallaUnicaSchema = z.object({
  valor: z.string().trim().min(1).max(12),
  orden: z.coerce.number().int().min(0).default(0),
});

// ───────────────────────── PRODUCTOS ─────────────────────────

export const productoBaseSchema = z.object({
  referencia: z
    .string()
    .trim()
    .min(2, "Referencia obligatoria")
    .max(24, "Máximo 24 caracteres")
    .regex(/^[a-zA-Z0-9_-]+$/, "Solo letras, números, guiones"),
  nombre: z.string().trim().min(3, "Nombre obligatorio").max(120),
  descripcion: z.string().trim().max(500).optional().or(z.literal("")),
  categoriaId: z.coerce.number().int().positive("Selecciona categoría"),
  marcaId: z.coerce.number().int().positive().nullable().optional(),
  genero: z.enum(["DAMA", "CABALLERO", "NINO", "UNISEX"]).nullable().optional(),
  material: z.string().trim().max(120).optional().or(z.literal("")),
  calidad: z.enum(["PREMIUM", "ALTA", "ESTANDAR", "ECONOMICA"]).nullable().optional(),
  temporada: z.string().trim().max(40).optional().or(z.literal("")),
  costo: z.coerce.number().int().min(0, "No puede ser negativo").max(999999999),
  precioBase: z.coerce.number().int().min(0, "No puede ser negativo").max(999999999),
});

/** Crear producto con matriz de variantes y stock inicial */
export const crearProductoSchema = productoBaseSchema.extend({
  variantes: z
    .array(
      z.object({
        colorId: z.coerce.number().int().positive(),
        tallaId: z.coerce.number().int().positive(),
        stocks: z.array(
          z.object({
            bodegaId: z.coerce.number().int().positive(),
            cantidad: z.coerce.number().int().min(0),
            minimo: z.coerce.number().int().min(0).default(0),
          })
        ),
      })
    )
    .min(1, "Genera al menos una variante (color × talla)"),
});

/** Agregar variantes a un producto existente */
export const agregarVariantesSchema = z.object({
  productoId: z.coerce.number().int().positive(),
  combinaciones: z
    .array(
      z.object({
        colorId: z.coerce.number().int().positive(),
        tallaId: z.coerce.number().int().positive(),
      })
    )
    .min(1, "Selecciona al menos una combinación"),
  stocks: z.array(
    z.object({
      bodegaId: z.coerce.number().int().positive(),
      cantidad: z.coerce.number().int().min(0),
      minimo: z.coerce.number().int().min(0).default(0),
    })
  ),
});

/** Actualización rápida de precios desde la lista */
export const preciosSchema = z.object({
  id: z.coerce.number().int().positive(),
  costo: z.coerce.number().int().min(0).max(999999999),
  precioBase: z.coerce.number().int().min(0).max(999999999),
});

// ──────────────────────── INVENTARIO ─────────────────────────

export const ajusteStockSchema = z.object({
  varianteId: z.coerce.number().int().positive(),
  bodegaId: z.coerce.number().int().positive(),
  nuevaCantidad: z.coerce.number().int().min(0, "No puede ser negativo"),
  motivo: z.string().trim().min(3, "Describe el motivo del ajuste").max(300),
});

export const minimoStockSchema = z.object({
  varianteId: z.coerce.number().int().positive(),
  bodegaId: z.coerce.number().int().positive(),
  minimo: z.coerce.number().int().min(0),
});

export const trasladoSchema = z
  .object({
    bodegaOrigenId: z.coerce.number().int().positive(),
    bodegaDestinoId: z.coerce.number().int().positive(),
    nota: z.string().trim().max(300).optional().or(z.literal("")),
    items: z
      .array(
        z.object({
          varianteId: z.coerce.number().int().positive(),
          cantidad: z.coerce.number().int().positive("Cantidad > 0"),
        })
      )
      .min(1, "Agrega al menos un artículo"),
  })
  .refine((d) => d.bodegaOrigenId !== d.bodegaDestinoId, {
    message: "Origen y destino deben ser diferentes",
    path: ["bodegaDestinoId"],
  });

// ─────────────────────────── TIPOS ───────────────────────────

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string };

export function errorDesconocido(e: unknown): string {
  if (e instanceof Error) {
    if (e.message.includes("Unique constraint")) {
      return "Ya existe un registro con ese nombre/código.";
    }
    return e.message;
  }
  return "Error inesperado. Intenta de nuevo.";
}
