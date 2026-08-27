"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { configuracionSchema, errorDesconocido, type ActionResult } from "@/lib/validations";
import { registrarAuditoria } from "@/lib/actions/auditoria";

export async function obtenerConfiguracion() {
  try {
    let config = await db.configuracion.findFirst({
      where: { id: 1 },
    });

    if (!config) {
      config = await db.configuracion.create({
        data: {
          id: 1,
          nombreTienda: "KAOB",
          nit: "900.123.456-7",
          direccion: "Villagarzón, Putumayo",
          telefono: "3136332887",
          ciudad: "Villagarzón",
          email: "contacto@kaob.com",
          regimen: "Responsable de IVA",
          mensajeTicket: "¡Gracias por su compra en KAOB!",
          pieTicket: "Conserve esta factura para cambios o garantías (plazo máx. 30 días con etiquetas).",
          metaDiaria: 1500000,
          puntosPorMonto: 10000,
        },
      });
    }

    return config;
  } catch (error) {
    console.error("Error al obtener configuración:", error);
    return {
      id: 1,
      nombreTienda: "KAOB",
      nit: "900.123.456-7",
      direccion: "Villagarzón, Putumayo",
      telefono: "3136332887",
      ciudad: "Villagarzón",
      email: "contacto@kaob.com",
      regimen: "Responsable de IVA",
      mensajeTicket: "¡Gracias por su compra en KAOB!",
      pieTicket: "Conserve este ticket para cambios.",
      logoUrl: null,
      metaDiaria: 1000000,
      puntosPorMonto: 10000,
      updatedAt: new Date(),
    };
  }
}

export async function guardarConfiguracion(formData: unknown): Promise<ActionResult> {
  try {
    const parsed = configuracionSchema.safeParse(formData);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const {
      nombreTienda,
      nit,
      direccion,
      telefono,
      ciudad,
      email,
      regimen,
      mensajeTicket,
      pieTicket,
      logoUrl,
      metaDiaria,
      puntosPorMonto,
    } = parsed.data;

    const anterior = await db.configuracion.findFirst({ where: { id: 1 } });

    await db.configuracion.upsert({
      where: { id: 1 },
      update: {
        nombreTienda,
        nit: nit || null,
        direccion: direccion || null,
        telefono: telefono || null,
        ciudad: ciudad || "Bogotá",
        email: email || null,
        regimen: regimen || null,
        mensajeTicket: mensajeTicket || null,
        pieTicket: pieTicket || null,
        logoUrl: logoUrl || null,
        metaDiaria,
        puntosPorMonto,
      },
      create: {
        id: 1,
        nombreTienda,
        nit: nit || null,
        direccion: direccion || null,
        telefono: telefono || null,
        ciudad: ciudad || "Bogotá",
        email: email || null,
        regimen: regimen || null,
        mensajeTicket: mensajeTicket || null,
        pieTicket: pieTicket || null,
        logoUrl: logoUrl || null,
        metaDiaria,
        puntosPorMonto,
      },
    });

    // Auditoría
    await registrarAuditoria({
      modulo: "CONFIGURACION",
      accion: "MODIFICACION",
      entidad: "Configuración General",
      entidadId: "1",
      descripcion: `Actualización de parámetros y datos fiscales de la tienda (${nombreTienda})`,
      detalles: {
        anterior: anterior ? { nombre: anterior.nombreTienda, meta: anterior.metaDiaria } : null,
        nuevo: { nombre: nombreTienda, meta: metaDiaria },
      },
    });

    revalidatePath("/configuracion");
    revalidatePath("/ventas/nueva");
    revalidatePath("/ventas");
    revalidatePath("/informes");

    return { ok: true, data: undefined };
  } catch (e) {
    console.error("Error al guardar configuración:", e);
    return { ok: false, error: errorDesconocido(e) };
  }
}
