"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { errorDesconocido, type ActionResult } from "@/lib/validations";

export interface AuditoriaData {
  modulo: string;
  accion: string;
  entidad: string;
  entidadId?: string | number | null;
  descripcion: string;
  detalles?: Record<string, unknown> | string | null;
  usuario?: string;
  ip?: string;
}

export async function registrarAuditoria(data: AuditoriaData): Promise<ActionResult<{ id: number }>> {
  try {
    const detallesStr =
      typeof data.detalles === "object" && data.detalles !== null
        ? JSON.stringify(data.detalles)
        : (data.detalles as string) ?? null;

    const registro = await db.auditoria.create({
      data: {
        modulo: data.modulo,
        accion: data.accion,
        entidad: data.entidad,
        entidadId: data.entidadId ? String(data.entidadId) : null,
        descripcion: data.descripcion,
        detalles: detallesStr,
        usuario: data.usuario || "Administrador",
        ip: data.ip || null,
      },
    });

    revalidatePath("/auditoria");
    return { ok: true, data: { id: registro.id } };
  } catch (e) {
    // Audit logger shouldn't fail the parent transaction if called externally, but we log the error
    console.error("Error al registrar auditoría:", e);
    return { ok: false, error: errorDesconocido(e) };
  }
}

export interface FiltrosAuditoria {
  modulo?: string;
  accion?: string;
  usuario?: string;
  fechaInicio?: string;
  fechaFin?: string;
  busqueda?: string;
  take?: number;
  skip?: number;
}

export async function listarAuditoria(filtros?: FiltrosAuditoria) {
  try {
    const where: Record<string, unknown> = {};

    if (filtros?.modulo && filtros.modulo !== "TODOS") {
      where.modulo = filtros.modulo;
    }

    if (filtros?.accion && filtros.accion !== "TODOS") {
      where.accion = filtros.accion;
    }

    if (filtros?.usuario && filtros.usuario !== "TODOS") {
      where.usuario = filtros.usuario;
    }

    if (filtros?.fechaInicio || filtros?.fechaFin) {
      where.createdAt = {
        ...(filtros.fechaInicio ? { gte: new Date(filtros.fechaInicio) } : {}),
        ...(filtros.fechaFin ? { lte: new Date(filtros.fechaFin + "T23:59:59.999Z") } : {}),
      };
    }

    if (filtros?.busqueda) {
      where.OR = [
        { entidad: { contains: filtros.busqueda, mode: "insensitive" } },
        { descripcion: { contains: filtros.busqueda, mode: "insensitive" } },
        { usuario: { contains: filtros.busqueda, mode: "insensitive" } },
      ];
    }

    const [total, registros] = await Promise.all([
      db.auditoria.count({ where }),
      db.auditoria.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: filtros?.take ?? 100,
        skip: filtros?.skip ?? 0,
      }),
    ]);

    return { total, registros };
  } catch (error) {
    console.error("Error al listar auditoría:", error);
    return { total: 0, registros: [] };
  }
}

export type AuditoriaItem = Awaited<ReturnType<typeof listarAuditoria>>["registros"][number];

export async function obtenerEstadisticasAuditoria() {
  try {
    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);

    const [totalHoy, totalMes, modulosCount, accionesCount] = await Promise.all([
      db.auditoria.count({
        where: { createdAt: { gte: hoyInicio } },
      }),
      db.auditoria.count(),
      db.auditoria.groupBy({
        by: ["modulo"],
        _count: { modulo: true },
        orderBy: { _count: { modulo: "desc" } },
        take: 5,
      }),
      db.auditoria.groupBy({
        by: ["accion"],
        _count: { accion: true },
        orderBy: { _count: { accion: "desc" } },
        take: 5,
      }),
    ]);

    return {
      totalHoy,
      totalHistorico: totalMes,
      topModulos: modulosCount.map((m) => ({ modulo: m.modulo, count: m._count.modulo })),
      topAcciones: accionesCount.map((a) => ({ accion: a.accion, count: a._count.accion })),
    };
  } catch (error) {
    console.error("Error al obtener estadísticas de auditoría:", error);
    return {
      totalHoy: 0,
      totalHistorico: 0,
      topModulos: [],
      topAcciones: [],
    };
  }
}
