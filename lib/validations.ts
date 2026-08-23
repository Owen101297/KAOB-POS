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

// ───────────────────────── CONTACTOS ───────────────────────────

export const clienteSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  nombre: nombreSchema,
  tipoDoc: z.enum(["CC", "NIT", "OTRO"]).default("CC"),
  documento: z.string().trim().max(20).optional().or(z.literal("")),
  telefono: z.string().trim().max(20).optional().or(z.literal("")),
  direccion: z.string().trim().max(200).optional().or(z.literal("")),
  ciudad: z.string().trim().max(80).optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  cupoCredito: z.coerce.number().int().min(0).max(999999999).default(0),
  diasCredito: z.coerce.number().int().min(0).max(365).default(0),
  notas: z.string().trim().max(500).optional().or(z.literal("")),
});

export const proveedorSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  nombre: nombreSchema,
  nit: z.string().trim().max(20).optional().or(z.literal("")),
  contacto: z.string().trim().max(120).optional().or(z.literal("")),
  telefono: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  direccion: z.string().trim().max(200).optional().or(z.literal("")),
  notas: z.string().trim().max(500).optional().or(z.literal("")),
});

export const vendedorSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  nombre: nombreSchema,
  telefono: z.string().trim().max(20).optional().or(z.literal("")),
  comisionPct: z.coerce.number().min(0).max(100).default(0),
});

export const domiciliarioSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  nombre: nombreSchema,
  telefono: z.string().trim().max(20).optional().or(z.literal("")),
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

// ───────────────────────── VENTAS ──────────────────────────────

export const ventaItemSchema = z.object({
  varianteId: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().int().positive("Cantidad > 0"),
  precioUnitario: z.coerce.number().int().min(0),
  costoUnitario: z.coerce.number().int().min(0),
  descuento: z.coerce.number().int().min(0).default(0),
});

export const pagoVentaSchema = z.object({
  metodo: z.enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA", "PUNTOS", "OTRO"]),
  monto: z.coerce.number().int().positive("Monto > 0"),
  referencia: z.string().trim().max(120).optional().or(z.literal("")),
});

export const registrarVentaSchema = z.object({
  tipo: z.enum(["VENTA", "REMISION", "COTIZACION"]),
  clienteId: z.coerce.number().int().positive().nullable().optional(),
  vendedorId: z.coerce.number().int().positive().nullable().optional(),
  domiciliarioId: z.coerce.number().int().positive().nullable().optional(),
  bodegaId: z.coerce.number().int().positive(),
  items: z.array(ventaItemSchema).min(1, "Agrega al menos un item"),
  pagos: z.array(pagoVentaSchema).optional().default([]),
  descuento: z.coerce.number().int().min(0).default(0),
  nota: z.string().trim().max(300).optional().or(z.literal("")),
}).refine((data) => {
  if (data.tipo === "COTIZACION") return true;
  const totalPagos = data.pagos.reduce((a, p) => a + p.monto, 0);
  const totalVenta = data.items.reduce((a, i) => a + i.cantidad * i.precioUnitario - i.descuento, 0) - data.descuento;
  return totalPagos >= totalVenta;
}, {
  message: "La suma de pagos debe cubrir el total de la venta",
  path: ["pagos"],
});

export const anularVentaSchema = z.object({
  id: z.coerce.number().int().positive(),
  motivo: z.string().trim().min(3, "Describe el motivo").max(300),
});

// ────────────────────────── CAJA ──────────────────────────────

export const abrirCajaSchema = z.object({
  baseInicial: z.coerce.number().int().min(0).default(0),
  bodegaId: z.coerce.number().int().positive().nullable().optional(),
});

export const movimientoCajaSchema = z.object({
  sesionId: z.coerce.number().int().positive(),
  tipo: z.enum(["INGRESO_BASE", "RETIRO", "SUPLIDO", "VENTA_EFECTIVO", "OTRO"]),
  monto: z.coerce.number().int().positive("Monto > 0"),
  referencia: z.string().trim().max(120).optional().or(z.literal("")),
  ventaId: z.coerce.number().int().positive().nullable().optional(),
});

// ────────────────────────── COMPRAS ─────────────────────────────

export const compraItemSchema = z.object({
  varianteId: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().int().positive("La cantidad debe ser mayor a 0"),
  costoUnitario: z.coerce.number().int().min(0, "El costo unitario no puede ser negativo"),
});

export const pagoCompraSchema = z.object({
  metodo: z.enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA", "PUNTOS", "OTRO"]),
  monto: z.coerce.number().int().positive("El monto del pago debe ser mayor a 0"),
  referencia: z.string().trim().max(120).optional().or(z.literal("")),
});

export const registrarCompraSchema = z.object({
  numeroFactura: z.string().trim().max(50).optional().or(z.literal("")),
  proveedorId: z.coerce.number().int().positive("Selecciona un proveedor"),
  bodegaId: z.coerce.number().int().positive("Selecciona una bodega"),
  items: z.array(compraItemSchema).min(1, "Agrega al menos un artículo"),
  pagos: z.array(pagoCompraSchema).optional().default([]),
  impuesto: z.coerce.number().int().min(0).default(0),
  nota: z.string().trim().max(300).optional().or(z.literal("")),
});

export const anularCompraSchema = z.object({
  id: z.coerce.number().int().positive(),
  motivo: z.string().trim().min(3, "Describe el motivo").max(300),
});

export const ordenCompraDetalleSchema = z.object({
  varianteId: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().int().positive(),
  costoEstimado: z.coerce.number().int().min(0),
});

export const crearOrdenCompraSchema = z.object({
  proveedorId: z.coerce.number().int().positive(),
  bodegaId: z.coerce.number().int().positive(),
  detalles: z.array(ordenCompraDetalleSchema).min(1, "Agrega al menos un artículo"),
  nota: z.string().trim().max(300).optional().or(z.literal("")),
});

// ────────────────────────── CRÉDITO Y CARTERA ─────────────────────

export const registrarAbonoCreditoSchema = z.object({
  creditoId: z.coerce.number().int().positive("Selecciona un crédito"),
  monto: z.coerce.number().int().positive("El monto del abono debe ser mayor a 0"),
  metodo: z.enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA", "PUNTOS", "OTRO", "CREDITO"]),
  referencia: z.string().trim().max(120).optional().or(z.literal("")),
  nota: z.string().trim().max(300).optional().or(z.literal("")),
  bodegaId: z.coerce.number().int().positive().optional(),
});

// ────────────────────────── PLAN SEPARE ─────────────────────────

export const planSepareItemSchema = z.object({
  varianteId: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().int().positive("La cantidad debe ser mayor a 0"),
  precioUnitario: z.coerce.number().int().positive("El precio debe ser mayor a 0"),
});

export const crearPlanSepareSchema = z.object({
  clienteId: z.coerce.number().int().positive("Selecciona un cliente"),
  bodegaId: z.coerce.number().int().positive("Selecciona una bodega"),
  diasLimite: z.coerce.number().int().min(1).default(30),
  items: z.array(planSepareItemSchema).min(1, "Agrega al menos un artículo"),
  abonoInicial: z.coerce.number().int().min(0).default(0),
  metodoAbono: z.enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA", "PUNTOS", "OTRO", "CREDITO"]).optional(),
  referenciaAbono: z.string().trim().max(120).optional().or(z.literal("")),
  nota: z.string().trim().max(300).optional().or(z.literal("")),
});

export const registrarAbonoSepareSchema = z.object({
  planSepareId: z.coerce.number().int().positive(),
  monto: z.coerce.number().int().positive("Monto debe ser mayor a 0"),
  metodo: z.enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA", "PUNTOS", "OTRO", "CREDITO"]),
  referencia: z.string().trim().max(120).optional().or(z.literal("")),
  nota: z.string().trim().max(300).optional().or(z.literal("")),
  bodegaId: z.coerce.number().int().positive().optional(),
});

// ────────────────────────── PUNTOS Y FIDELIZACIÓN ───────────────

export const ajustarPuntosSchema = z.object({
  clienteId: z.coerce.number().int().positive("Selecciona un cliente"),
  tipo: z.enum(["ACUMULACION", "REDENCION", "AJUSTE"]),
  puntos: z.coerce.number().int().positive("Puntos > 0"),
  nota: z.string().trim().max(300).optional().or(z.literal("")),
});

// ────────────────────────── PROMOCIONES ─────────────────────────

export const promocionSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  nombre: z.string().trim().min(2, "Mínimo 2 caracteres").max(100),
  tipo: z.enum(["PORCENTAJE", "MONTO_FIJO"]),
  valor: z.coerce.number().int().positive("Valor > 0"),
  montoMinimo: z.coerce.number().int().min(0).default(0),
  activa: z.boolean().default(true),
  fechaInicio: z.string().optional().or(z.literal("")),
  fechaFin: z.string().optional().or(z.literal("")),
});

// ────────────────────────── TARJETAS DE REGALO ──────────────────

export const emitirGiftCardSchema = z.object({
  codigo: z.string().trim().min(3).max(30),
  montoInicial: z.coerce.number().int().positive("Monto > 0"),
  clienteId: z.coerce.number().int().positive().optional().nullable(),
  fechaVencimiento: z.string().optional().or(z.literal("")),
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

