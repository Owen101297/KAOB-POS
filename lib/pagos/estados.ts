// ───────────────────────── PAGOS: MAPEOS DE ESTADO ─────────────────────────
// Traducción de los estados de las pasarelas a los estados internos
// (EstadoPagoOnline en schema.prisma, spec 002 FR-005). Archivo sin imports de
// runtime para poder unit-testearlo directamente con node --test.

import type { EstadoPago } from "./tipos";

interface EstamentoMapa {
  [estado: string]: EstadoPago | undefined;
}

const MAPA_WOMPI: EstamentoMapa = {
  APPROVED: "APROBADO",
  DECLINED: "RECHAZADO",
  VOIDED: "CANCELADO",
  ERROR: "RECHAZADO",
  PENDING: "PENDIENTE",
};

export function mapearEstadoWompi(status: string | undefined): EstadoPago {
  return (status && MAPA_WOMPI[status]) || "PENDIENTE";
}

const MAPA_BOLD: EstamentoMapa = {
  ACTIVE: "PENDIENTE",
  PROCESSING: "EN_TRANSITO",
  PAID: "APROBADO",
  REJECTED: "RECHAZADO",
  CANCELLED: "CANCELADO",
  EXPIRED: "RECHAZADO",
};

export function mapearEstadoBold(status: string | undefined): EstadoPago {
  return (status && MAPA_BOLD[status]) || "PENDIENTE";
}
