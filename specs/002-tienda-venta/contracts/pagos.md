---
description: "Contratos de interfaz — Pagos online tienda"
---

# Contracts: Pagos online (Bold + Wompi)

## lib/pagos/tipos.ts

```ts
export type ProveedorPago = "WOMPI" | "BOLD" | "ADDI" | "SISTECREDITO" | "FIADO" | "CONTRAENTREGA";

export type EstadoPagoOnline = "PENDIENTE" | "APROBADO" | "RECHAZADO" | "EN_TRANSITO" | "CANCELADO";

export interface ResultadoPago {
  ok: boolean;
  proveedor: ProveedorPago;
  referenciaExterna: string;
  urlRedireccion?: string;
  error?: string;
}
```

## lib/pagos/wompi.ts

- `crearPagoWompi({ monto, referencia, emailCliente, nombre, telefono }): Promise<ResultadoPago>` — POST `/v1/transactions` (sandbox/prod por env).
- `validarWebhookWompi(payload: unknown, checksum: string): boolean` — HMAC-SHA256 id+status+amount+timestamp con `WOMPI_EVENTS_SECRET`, constant-time.
- `consultarEstadoWompi(transactionId: string): Promise<EstadoPagoOnline>` — GET `/v1/transactions/{id}`.

## lib/pagos/bold.ts

- `crearPagoBold({ monto, referencia, emailCliente }): Promise<ResultadoPago>` — POST enlaces Bold (`BOLD_API_KEY`).
- `validarWebhookBold(payload: unknown, firma: string): boolean`.
- `consultarEstadoBold(referenciaExterna: string): Promise<EstadoPagoOnline>`.

## app/api/checkout/wompi/route.ts — POST (público, sin auth — checkout)

Entrada: `{ nombre, celular, ciudad, direccion, notas, items: [{ varianteId, cantidad }], email }`
Salida: `{ ok, urlRedireccion }` | `{ ok:false, error }` — crea pedido + PagoOnline PENDIENTE y redirige a pasarela.

## app/api/checkout/bold/route.ts — POST

Idéntico contrato con proveedor BOLD.

## app/api/webhooks/wompi/route.ts — POST (público, firma verificada)

Entrada: evento Wompi (`transaction.updated`). Salida: 200 OK siempre (idempotente); actualiza PagoOnline + Pedido (PAGADO / Pago fallido) y revalida.

## app/api/webhooks/bold/route.ts — POST

Idéntico contrato con Bold.

## lib/pagos/cobros.ts

- `registrarPagoOnline(pedidoId, proveedor, datos: { documento?, referenciaBancaria?, monto }): Promise<ActionResult>` — registros ADDI/SISTECREDITO/FIADO/CONTRAENTREGA sin pasarela (formularios).
- `consultarEstadoPago(pagoId): Promise<EstadoPagoOnline>` — orquesta proveedor (Wompi/Bold por API; resto por estado local).
