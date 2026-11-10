---
description: "Modelo de datos — Pagos online tienda"
---

# Data Model: Pagos online

## Entidades nuevas

### PagoOnline (tabla `pagos_online`)
- `id` BigInt autoincrement
- `pedidoId` FK a Pedido (único por pedido: un pedido = un pago)
- `proveedor` enum: WOMPI | BOLD | ADDI | SISTECREDITO | FIADO | CONTRAENTREGA
- `estado` enum: PENDIENTE | APROBADO | RECHAZADO | EN_TRANSITO | CANCELADO
- `referenciaExterna` único (id de la pasarela, p.ej. `WOMPI-<txid>`), para idempotencia webhook
- `monto` Int COP
- `moneda` String (`COP`)
- `emailCliente` String?
- `documentoCliente` String? (ADDI/SISTECREDITO)
- `webhookEventos` Int (contador, idempotencia)
- `createdAt`/`updatedAt`

### Relación con Venta
- Cuando el pedido pagado se convierte en Venta en POS, se crea `PagoVenta` con el método correspondiente (`metodo: ADDI | SISTECREDITO | TRANSFERENCIA` para pasarelas) y `referencia = referenciaExterna`, `desembolsado` según proveedor (tarjeta/PSE: true al acreditarse; BNPL: false hasta desembolso).

### Pedido (modificación)
- Nuevo campo `pagoId` FK opcional a PagoOnline (1 pago por pedido).
- Estado de despacho sigue igual (PENDIENTE/EMPACADO/EN_CAMINO/ENTREGADO/CANCELADO), ORTOGONAL al estado de pago: un pedido puede estar EMPACADO con pago EN_TRÁNSITO.

## Índices
- `PagoOnline(referenciaExterna)` único
- `PagoOnline(pedidoId)` único (esto ya compatible con 1 pago/pedido)
- `EstadoPagoOnline` no-indexado (volumen bajo en v1)

## Reglas de validación
- Un pedido pago contraentrega: PagoOnline con proveedor CONTRAENTREGA y estado EN_TRANSITO (se cobra en entrega).
- Fiado: requiere cliente con cupo ≥ total (validación en `registrarPagoOnline`).
- Addi/Sistecrédito: documento formateado y válido por longitud dígitos (CC 6-12, NIT su propio formato).
- Webhook: si el pago ya está en estado final, se ignora sin error (idempotencia).

## Índices
- `PagoOnline(referenciaExterna)` único
- `PagoOnline(pedidoId)` único (esto ya compatible con 1 pago/pedido)
- `EstadoPagoOnline` no-indexado (volumen bajo en v1)

## Reglas de validación
- Un pedido pago contraentrega: PagoOnline con proveedor CONTRAENTREGA y estado EN_TRANSITO (se cobra en entrega).
- Fiado: requiere cliente con cupo ≥ total (validación en `registrarPagoOnline`).
- Addi/Sistecrédito: documento formateado y válido por longitud dígitos (CC 6-12, NIT su propio formato).
- Webhook: si el pago ya está en estado final, se ignora sin error (idempotencia).
