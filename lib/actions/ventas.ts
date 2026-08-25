"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  anularVentaSchema,
  errorDesconocido,
  pagoVentaSchema,
  registrarVentaSchema,
  type ActionResult,
} from "@/lib/validations";
import { registrarAuditoria } from "@/lib/actions/auditoria";

const VENTA_PATHS = ["/ventas/nueva", "/ventas", "/remisiones", "/cotizaciones", "/inventario", "/movimientos", "/auditoria"];

// ─────────────────────────── TIPOS PARA CLIENTE ──────────────────

export interface VarianteConRelaciones {
  id: number;
  activa: boolean;
  createdAt: Date;
  productoId: number;
  colorId: number;
  tallaId: number;
  sku: string;
  precioOverride: number | null;
  color: { id: number; nombre: string; hex: string | null };
  talla: { id: number; valor: string; orden: number };
}

export interface ProductoPOS {
  id: number;
  referencia: string;
  nombre: string;
  descripcion: string | null;
  categoriaId: number;
  marcaId: number | null;
  genero: "DAMA" | "CABALLERO" | "NINO" | "UNISEX" | null;
  material: string | null;
  calidad: "PREMIUM" | "ALTA" | "ESTANDAR" | "ECONOMICA" | null;
  temporada: string | null;
  costo: number;
  precioBase: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
  variantes: ({
    id: number;
    sku: string;
    precioOverride: number | null;
    color: { id: number; nombre: string; hex: string | null };
    talla: { id: number; valor: string; orden: number };
    stocks: { cantidad: number }[];
  })[];
}

export interface VentaLista {
  id: number;
  consecutivo: number;
  tipo: "VENTA" | "REMISION" | "COTIZACION";
  estado: "COMPLETADA" | "PENDIENTE" | "ANULADA";
  clienteId: number | null;
  vendedorId: number | null;
  domiciliarioId: number | null;
  bodegaId: number;
  subtotal: number;
  descuento: number;
  total: number;
  nota: string | null;
  createdAt: Date;
  updatedAt: Date;
  cliente: { id: number; nombre: string } | null;
  vendedor: { id: number; nombre: string } | null;
  bodega: { id: number; nombre: string };
  items: { id: number; ventaId: number; varianteId: number; cantidad: number; precioUnitario: number; costoUnitario: number; descuento: number; subtotal: number; variante: { id: number; sku: string; color: { nombre: string }; talla: { valor: string } } }[];
  pagos: { id: number; metodo: "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "PUNTOS" | "OTRO"; monto: number; referencia: string | null }[];
}

// ─────────────────────────── CONSULTAS ──────────────────────────

const varianteInclude = {
  include: {
    color: true,
    talla: true,
    producto: true,
  },
} as const;

export async function listarVentas(opts?: {
  tipo?: "VENTA" | "REMISION" | "COTIZACION";
  estado?: "COMPLETADA" | "PENDIENTE" | "ANULADA";
  desde?: Date;
  hasta?: Date;
  clienteId?: number;
  vendedorId?: number;
  take?: number;
}) {
  try {
    return await db.venta.findMany({
      where: {
        ...(opts?.tipo ? { tipo: opts.tipo } : {}),
        ...(opts?.estado ? { estado: opts.estado } : {}),
        ...(opts?.clienteId ? { clienteId: opts.clienteId } : {}),
        ...(opts?.vendedorId ? { vendedorId: opts.vendedorId } : {}),
        ...(opts?.desde || opts?.hasta
          ? {
              createdAt: {
                ...(opts.desde ? { gte: opts.desde } : {}),
                ...(opts.hasta ? { lte: opts.hasta } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: opts?.take ?? 200,
      include: {
        cliente: true,
        vendedor: true,
        bodega: true,
        items: { include: { variante: varianteInclude } },
        pagos: true,
      },
    });
  } catch (error) {
    console.error("Error en listarVentas:", error);
    return [];
  }
}

export async function obtenerVenta(id: number) {
  return db.venta.findUnique({
    where: { id },
    include: {
      cliente: true,
      vendedor: true,
      bodega: true,
      items: { include: { variante: varianteInclude } },
      pagos: true,
    },
  });
}

export async function buscarVariantePorSku(sku: string, bodegaId?: number) {
  if (!sku || sku.trim().length === 0) return null;
  const cleanSku = sku.trim();
  return db.variante.findFirst({
    where: {
      OR: [
        { sku: { equals: cleanSku, mode: "insensitive" } },
        { sku: { contains: cleanSku, mode: "insensitive" } },
      ],
      activa: true,
    },
    include: {
      color: true,
      talla: true,
      producto: true,
      stocks: bodegaId ? { where: { bodegaId } } : true,
    },
  });
}

export async function buscarProductosPOS(
  q?: string,
  bodegaId?: number,
  categoriaId?: number,
  soloActivos = true
) {
  const query = q?.trim();
  const where: any = {
    activo: soloActivos,
  };

  if (categoriaId) {
    where.categoriaId = categoriaId;
  }

  if (query && query.length >= 1) {
    where.OR = [
      { referencia: { contains: query, mode: "insensitive" } },
      { nombre: { contains: query, mode: "insensitive" } },
      { variantes: { some: { sku: { contains: query, mode: "insensitive" }, activa: true } } },
    ];
  }

  const res = await db.producto.findMany({
    where,
    take: 36,
    orderBy: { updatedAt: "desc" },
    include: {
      categoria: true,
      variantes: {
        where: { activa: true },
        include: {
          color: true,
          talla: true,
          stocks: bodegaId ? { where: { bodegaId } } : true,
        },
      },
    },
  });
  return res as unknown as {
    id: number;
    referencia: string;
    nombre: string;
    descripcion: string | null;
    categoriaId: number;
    marcaId: number | null;
    genero: "DAMA" | "CABALLERO" | "NINO" | "UNISEX" | null;
    material: string | null;
    calidad: "PREMIUM" | "ALTA" | "ESTANDAR" | "ECONOMICA" | null;
    temporada: string | null;
    costo: number;
    precioBase: number;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    variantes: ({
      id: number;
      sku: string;
      productoId: number;
      colorId: number;
      tallaId: number;
      precioOverride: number | null;
      activa: boolean;
      color: { id: number; nombre: string; hex: string | null };
      talla: { id: number; valor: string; orden: number };
      stocks: { cantidad: number }[];
    })[];
  }[];
}

export async function obtenerConsecutivoVenta(tipo: "VENTA" | "REMISION" | "COTIZACION"): Promise<number> {
  const ultima = await db.venta.findFirst({
    where: { tipo },
    orderBy: { consecutivo: "desc" },
    select: { consecutivo: true },
  });
  return (ultima?.consecutivo ?? 0) + 1;
}

// ─────────────────────────── REGISTRAR VENTA ──────────────────────────

export async function registrarVenta(input: unknown): Promise<ActionResult<{ id: number; consecutivo: number; codigo: string }>> {
  try {
    const data = registrarVentaSchema.parse(input);

    if (data.tipo !== "COTIZACION") {
      for (const item of data.items) {
        const stock = await db.stockBodega.findUnique({
          where: { varianteId_bodegaId: { varianteId: item.varianteId, bodegaId: data.bodegaId } },
        });
        if (!stock || stock.cantidad < item.cantidad) {
          const v = await db.variante.findUnique({
            where: { id: item.varianteId },
            select: { sku: true },
          });
          return {
            ok: false,
            error: `Stock insuficiente para ${v?.sku ?? "artículo"} (disponible: ${stock?.cantidad ?? 0}, solicitado: ${item.cantidad})`,
          };
        }
      }
    }

    const tieneCredito = data.pagos.some((p) => p.metodo === "CREDITO");
    if (tieneCredito && !data.clienteId) {
      return {
        ok: false,
        error: "Para realizar una venta a crédito debes seleccionar o registrar un cliente.",
      };
    }

    const consecutivo = await obtenerConsecutivoVenta(data.tipo);
    const codigo = `${data.tipo === "VENTA" ? "V" : data.tipo === "REMISION" ? "R" : "C"}-${String(consecutivo).padStart(4, "0")}`;

    const subtotal = data.items.reduce((a, i) => a + i.cantidad * i.precioUnitario - i.descuento, 0);
    const total = subtotal - data.descuento;
    const totalPagos = data.pagos.reduce((a, p) => a + p.monto, 0);

    let estado: "COMPLETADA" | "PENDIENTE" = "COMPLETADA";
    if (data.tipo === "COTIZACION") estado = "PENDIENTE";
    else if (data.tipo === "REMISION") estado = "PENDIENTE";
    else if (totalPagos < total || tieneCredito) estado = "PENDIENTE";

    const venta = await db.$transaction(async (tx) => {
      const v = await tx.venta.create({
        data: {
          consecutivo,
          tipo: data.tipo,
          estado,
          clienteId: data.clienteId ?? null,
          vendedorId: data.vendedorId ?? null,
          domiciliarioId: data.domiciliarioId ?? null,
          bodegaId: data.bodegaId,
          subtotal,
          descuento: data.descuento,
          total,
          nota: data.nota || null,
        },
      });

      for (const item of data.items) {
        const variante = await tx.variante.findUniqueOrThrow({
          where: { id: item.varianteId },
          select: { productoId: true, producto: { select: { costo: true } } },
        });
        const costoProducto = variante.producto.costo;

        await tx.ventaItem.create({
          data: {
            ventaId: v.id,
            varianteId: item.varianteId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            costoUnitario: costoProducto,
            descuento: item.descuento,
            subtotal: item.cantidad * item.precioUnitario - item.descuento,
          },
        });

        if (data.tipo !== "COTIZACION") {
          await tx.stockBodega.update({
            where: { varianteId_bodegaId: { varianteId: item.varianteId, bodegaId: data.bodegaId } },
            data: { cantidad: { decrement: item.cantidad } },
          });
          await tx.movimientoInventario.create({
            data: {
              varianteId: item.varianteId,
              tipo: "VENTA",
              cantidad: item.cantidad,
              bodegaOrigenId: data.bodegaId,
              costoUnitario: costoProducto,
              nota: `Venta ${codigo}`,
              refDocumento: codigo,
            },
          });
        }
      }

      for (const pago of data.pagos) {
        await tx.pagoVenta.create({
          data: {
            ventaId: v.id,
            metodo: pago.metodo,
            monto: pago.monto,
            referencia: pago.referencia || null,
          },
        });
        if (pago.metodo === "EFECTIVO") {
          const sesion = await tx.sesionCaja.findFirst({
            where: { estado: "ABIERTA" },
            orderBy: { openedAt: "desc" },
          });
          if (sesion) {
            await tx.movimientoCaja.create({
              data: {
                sesionId: sesion.id,
                tipo: "VENTA_EFECTIVO",
                monto: pago.monto,
                referencia: `Venta ${codigo}`,
                ventaId: v.id,
              },
            });
          }
        }
      }

      // Si la venta incluye crédito, registrar automáticamente en cartera
      if (tieneCredito && data.clienteId) {
        const montoCredito = data.pagos
          .filter((p) => p.metodo === "CREDITO")
          .reduce((a, p) => a + p.monto, 0);

        const ultimoCredito = await tx.creditoCliente.findFirst({
          orderBy: { consecutivo: "desc" },
          select: { consecutivo: true },
        });
        const consecutivoCredito = (ultimoCredito?.consecutivo ?? 0) + 1;
        const dias = 30;
        const fechaVencimiento = new Date();
        fechaVencimiento.setDate(fechaVencimiento.getDate() + dias);

        await tx.creditoCliente.create({
          data: {
            consecutivo: consecutivoCredito,
            clienteId: data.clienteId,
            ventaId: v.id,
            montoTotal: montoCredito,
            saldoPendiente: montoCredito,
            diasCredito: dias,
            fechaVencimiento,
            estado: "PENDIENTE",
            nota: `Crédito originado en Venta ${codigo}`,
          },
        });
      }

      return v;
    });

    revalidatePath("/ventas/nueva");
    revalidatePath("/ventas");
    revalidatePath("/remisiones");
    revalidatePath("/creditos");
    revalidatePath("/clientes");
    revalidatePath("/cotizaciones");
    revalidatePath("/inventario");
    revalidatePath("/movimientos");
    return { ok: true, data: { id: venta.id, consecutivo, codigo } };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

// ─────────────────────────── ANULAR VENTA ──────────────────────────

export async function anularVenta(input: unknown): Promise<ActionResult> {
  try {
    const data = anularVentaSchema.parse(input);

    const venta = await db.venta.findUnique({
      where: { id: data.id },
      include: { items: true, pagos: true },
    });
    if (!venta) return { ok: false, error: "La venta no existe." };
    if (venta.estado === "ANULADA") return { ok: false, error: "La venta ya está anulada." };

    await db.$transaction(async (tx) => {
      if (venta.tipo !== "COTIZACION") {
        for (const item of venta.items) {
          await tx.stockBodega.update({
            where: { varianteId_bodegaId: { varianteId: item.varianteId, bodegaId: venta.bodegaId } },
            data: { cantidad: { increment: item.cantidad } },
          });
          await tx.movimientoInventario.create({
            data: {
              varianteId: item.varianteId,
              tipo: "DEVOLUCION_CLIENTE",
              cantidad: item.cantidad,
              bodegaDestinoId: venta.bodegaId,
              costoUnitario: item.costoUnitario,
              nota: `Anulación venta ${venta.tipo === "VENTA" ? "V" : "R"}-${String(venta.consecutivo).padStart(4, "0")}: ${data.motivo}`,
              refDocumento: `${venta.tipo === "VENTA" ? "V" : "R"}-${String(venta.consecutivo).padStart(4, "0")}`,
            },
          });
        }
      }

      for (const pago of venta.pagos) {
        if (pago.metodo === "EFECTIVO") {
          const sesion = await tx.sesionCaja.findFirst({
            where: { estado: "ABIERTA" },
            orderBy: { openedAt: "desc" },
          });
          if (sesion) {
            await tx.movimientoCaja.create({
              data: {
                sesionId: sesion.id,
                tipo: "OTRO",
                monto: -pago.monto,
                referencia: `Anulación venta ${venta.tipo === "VENTA" ? "V" : "R"}-${String(venta.consecutivo).padStart(4, "0")}`,
                ventaId: venta.id,
              },
            });
          }
        }
      }

      await tx.venta.update({
        where: { id: data.id },
        data: { estado: "ANULADA", nota: (venta.nota ? venta.nota + "\n" : "") + `ANULADA: ${data.motivo}` },
      });
    });

    await registrarAuditoria({
      modulo: "VENTAS",
      accion: "ANULACION",
      entidad: `${venta.tipo} #${venta.consecutivo}`,
      entidadId: venta.id,
      descripcion: `Anulación de ${venta.tipo} por valor de $${venta.total.toLocaleString("es-CO")}. Motivo: ${data.motivo}`,
      detalles: {
        tipo: venta.tipo,
        total: venta.total,
        motivo: data.motivo,
        itemsCount: venta.items.length,
      },
    });

    revalidatePath("/ventas/nueva");
    revalidatePath("/ventas");
    revalidatePath("/remisiones");
    revalidatePath("/cotizaciones");
    revalidatePath("/inventario");
    revalidatePath("/movimientos");
    return { ok: true };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

// ─────────────────────────── CONVERTIR DOCUMENTO ──────────────────────────

export async function convertirDocumento(
  ventaId: number,
  nuevoTipo: "VENTA" | "REMISION",
  pagos?: { metodo: string; monto: number; referencia?: string }[]
): Promise<ActionResult<{ id: number }>> {
  try {
    const venta = await db.venta.findUniqueOrThrow({
      where: { id: ventaId },
      include: { items: true, pagos: true },
    });
    if (venta.estado !== "PENDIENTE") return { ok: false, error: "Solo se pueden convertir documentos pendientes." };
    if (venta.tipo === "COTIZACION" && nuevoTipo !== "VENTA") return { ok: false, error: "La cotización solo se puede convertir a venta." };
    if (venta.tipo === "REMISION" && nuevoTipo !== "VENTA") return { ok: false, error: "La remisión solo se puede convertir a venta." };
    if (venta.tipo === nuevoTipo) return { ok: false, error: "El documento ya es de ese tipo." };

    await db.$transaction(async (tx) => {
      if (venta.tipo === "COTIZACION") {
        for (const item of venta.items) {
          await tx.stockBodega.update({
            where: { varianteId_bodegaId: { varianteId: item.varianteId, bodegaId: venta.bodegaId } },
            data: { cantidad: { decrement: item.cantidad } },
          });
          await tx.movimientoInventario.create({
            data: {
              varianteId: item.varianteId,
              tipo: "VENTA",
              cantidad: item.cantidad,
              bodegaOrigenId: venta.bodegaId,
              costoUnitario: item.costoUnitario,
              nota: `Conversión cotización a venta`,
              refDocumento: `V-${String(venta.consecutivo).padStart(4, "0")}`,
            },
          });
        }
      }

      const consecutivo = await obtenerConsecutivoVenta(nuevoTipo);
      const codigo = `${nuevoTipo === "VENTA" ? "V" : "R"}-${String(consecutivo).padStart(4, "0")}`;

      await tx.venta.update({
        where: { id: ventaId },
        data: {
          tipo: nuevoTipo,
          consecutivo,
          estado: "COMPLETADA",
          nota: (venta.nota ? venta.nota + "\n" : "") + `Convertido a ${nuevoTipo} ${codigo}`,
        },
      });

      if (pagos && pagos.length > 0) {
        for (const p of pagos) {
          await tx.pagoVenta.create({
            data: { ventaId, metodo: p.metodo as any, monto: p.monto, referencia: p.referencia || null },
          });
          if (p.metodo === "EFECTIVO") {
            const sesion = await tx.sesionCaja.findFirst({ where: { estado: "ABIERTA" }, orderBy: { openedAt: "desc" } });
            if (sesion) {
              await tx.movimientoCaja.create({
                data: { sesionId: sesion.id, tipo: "VENTA_EFECTIVO", monto: p.monto, referencia: `Venta ${codigo}`, ventaId },
              });
            }
          }
        }
      }
    });

    revalidatePath("/ventas/nueva");
    revalidatePath("/ventas");
    revalidatePath("/remisiones");
    revalidatePath("/cotizaciones");
    revalidatePath("/inventario");
    revalidatePath("/movimientos");
    return { ok: true, data: { id: ventaId } };
  } catch (e) {
    return { ok: false as const, error: errorDesconocido(e) };
  }
}

// ─────────────────────────── ESTADÍSTICAS DEL DÍA ──────────────────────────

export async function estadisticasDia(fecha?: Date) {
  try {
    const dia = fecha ?? new Date();
    const inicio = new Date(dia);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(dia);
    fin.setHours(23, 59, 59, 999);

    const [ventas, remisiones, cotizaciones] = await Promise.all([
      db.venta.aggregate({
        where: { tipo: "VENTA", estado: "COMPLETADA", createdAt: { gte: inicio, lte: fin } },
        _sum: { total: true },
        _count: true,
      }),
      db.venta.aggregate({
        where: { tipo: "REMISION", estado: { in: ["COMPLETADA", "PENDIENTE"] }, createdAt: { gte: inicio, lte: fin } },
        _sum: { total: true },
        _count: true,
      }),
      db.venta.aggregate({
        where: { tipo: "COTIZACION", createdAt: { gte: inicio, lte: fin } },
        _count: true,
      }),
    ]);

    return {
      ventas: { total: ventas._sum.total ?? 0, cantidad: ventas._count ?? 0 },
      remisiones: { total: remisiones._sum.total ?? 0, cantidad: remisiones._count ?? 0 },
      cotizaciones: { cantidad: cotizaciones._count ?? 0 },
    };
  } catch (error) {
    console.error("Error en estadisticasDia:", error);
    return {
      ventas: { total: 0, cantidad: 0 },
      remisiones: { total: 0, cantidad: 0 },
      cotizaciones: { cantidad: 0 },
    };
  }
}