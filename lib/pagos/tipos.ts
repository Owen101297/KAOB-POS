// ───────────────────────── PAGOS: TIPOS COMPARTIDOS ─────────────────────────
// Contrato completo: specs/002-tienda-venta/contracts/pagos.md
// Los valores replican los enums de prisma/schema.prisma (ProveedorPagoOnline,
// EstadoPagoOnline) sin importar @prisma/client para poder unit-testear los
// adapters y mapeos sin generación de cliente.

export const PROVEEDORES_CON_PASARELA = ["WOMPI", "BOLD"] as const;
export const PROVEEDORES_SIN_PASARELA = ["ADDI", "SISTECREDITO", "FIADO", "CONTRAENTREGA"] as const;

export type ProveedorPasarela = (typeof PROVEEDORES_CON_PASARELA)[number];
export type ProveedorDirecto = (typeof PROVEEDORES_SIN_PASARELA)[number];
export type ProveedorPago = ProveedorPasarela | ProveedorDirecto;

export const METODOS_DIRECTOS = ["ADDI", "SISTECREDITO", "FIADO", "CONTRAENTREGA", "WOMPI", "BOLD"] as const;
export type MetodoPagoTienda = (typeof METODOS_DIRECTOS)[number];

export type EstadoPago =
  | "PENDIENTE"
  | "APROBADO"
  | "RECHAZADO"
  | "EN_TRANSITO"
  | "CANCELADO";

export interface CrearPagoInput {
  referencia: string; // PED-<YYYYMMDD>-<id>
  monto: number; // COP, entero
  descripcion: string;
  emailCliente?: string;
  documentoCliente?: string;
  callbackUrl: string; // URL absoluta de retorno/webhook del propio sitio
}

export interface ResultadoPago {
  ok: boolean;
  urlRedireccion?: string; // A dónde redirigir al cliente (o null si es Wompi form)
  referenciaExterna?: string;
  error?: string;
}

// ─────────────────────────── CONFIGURACIÓN (solo servidor) ──────────────────
// Las llaves viven en Coolify / gestor cifrado, nunca en Git (Constitución).

function env(nombre: string): string | undefined {
  const v = process.env[nombre];
  return v && v.trim() !== "" ? v.trim() : undefined;
}

export const configWompi = {
  get entorno(): "sandbox" | "produccion" {
    return env("WOMPI_ENTORNO") === "produccion" ? "produccion" : "sandbox";
  },
  get baseUrl(): string {
    return this.entorno === "produccion"
      ? "https://production.wompi.co"
      : "https://sandbox.wompi.co";
  },
  get checkoutUrl(): string {
    return "https://checkout.wompi.co/p/";
  },
  publicKey: () => env("WOMPI_PUBLIC_KEY"),
  privateKey: () => env("WOMPI_PRIVATE_KEY"),
  integritySecret: () => env("WOMPI_INTEGRITY_SECRET"),
  eventsSecret: () => env("WOMPI_EVENTS_SECRET"),
};

export const configBold = {
  get baseUrl(): string {
    return env("BOLD_BASE_URL") || "https://integrations.api.bold.co";
  },
  apiKey: () => env("BOLD_API_KEY"),
};

export const configTienda = {
  baseUrl: () => env("TIENDA_URL") || env("NEXT_PUBLIC_SITE_URL") || "https://kaob.owenai.uk",
};

export function wompiConfigurado(): boolean {
  return Boolean(configWompi.publicKey() && configWompi.integritySecret());
}

export function boldConfigurado(): boolean {
  return Boolean(configBold.apiKey());
}
