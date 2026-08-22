import type { Calidad, Genero, TipoMovimiento } from "@prisma/client";

export const CALIDADES: { valor: Calidad; label: string }[] = [
  { valor: "PREMIUM", label: "Premium" },
  { valor: "ALTA", label: "Alta" },
  { valor: "ESTANDAR", label: "Estándar" },
  { valor: "ECONOMICA", label: "Económica" },
];

export const CALIDAD_LABEL: Record<Calidad, string> = {
  PREMIUM: "Premium",
  ALTA: "Alta",
  ESTANDAR: "Estándar",
  ECONOMICA: "Económica",
};

export const GENEROS: { valor: Genero; label: string }[] = [
  { valor: "DAMA", label: "Dama" },
  { valor: "CABALLERO", label: "Caballero" },
  { valor: "NINO", label: "Niño" },
  { valor: "UNISEX", label: "Unisex" },
];

export const GENERO_LABEL: Record<Genero, string> = {
  DAMA: "Dama",
  CABALLERO: "Caballero",
  NINO: "Niño",
  UNISEX: "Unisex",
};

export const TIPO_MOVIMIENTO_LABEL: Record<TipoMovimiento, string> = {
  INICIAL: "Stock inicial",
  AJUSTE_ENTRADA: "Ajuste (entrada)",
  AJUSTE_SALIDA: "Ajuste (salida)",
  TRASLADO_SALIDA: "Traslado (salida)",
  TRASLADO_ENTRADA: "Traslado (entrada)",
  COMPRA: "Compra",
  DEVOLUCION: "Devolución",
  VENTA: "Venta",
  DEVOLUCION_CLIENTE: "Devolución cliente",
};

/** Tipos de movimiento que suman stock en destino */
export const MOVIMIENTOS_ENTRADA: TipoMovimiento[] = [
  "INICIAL",
  "AJUSTE_ENTRADA",
  "TRASLADO_ENTRADA",
  "COMPRA",
  "DEVOLUCION",
  "DEVOLUCION_CLIENTE",
];

/** Prefijo SKU por defecto cuando no hay referencia corta */
export function generarSku(
  referencia: string,
  colorNombre: string,
  tallaValor: string,
): string {
  const ref = normalizar(referencia).slice(0, 12);
  const col = normalizar(colorNombre);
  const tal = normalizar(tallaValor);
  return `${ref}-${col}-${tal}`.toUpperCase();
}

function normalizar(texto: string): string {
  return texto
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "");
}

export function formatoTraslado(id: number): string {
  return `TRS-${String(id).padStart(4, "0")}`;
}
