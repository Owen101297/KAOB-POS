# Research: Pagos online (Bold + Wompi) y rediseño 21st

**Fecha**: 2026-11-09 | **Fuente**: código del repo + docs públicas (Wompi/Bold sin verificar en vivo; validar con llaves test en staging)

## Contexto del repo (verificado)

- `MetodoPago` ya incluye `ADDI`, `SISTECREDITO`, `BOLD` (`schema.prisma:90-92`) — la conciliación de plataformas pasa por `PagoVenta.desembolsado` + `DesembolsoPlataforma`.
- `Pedido`/`PedidoItem` existen (001) con `estado` de despacho; el cobro hoy es manual (efectivo/POS).
- `lib/actions/plataformas.ts` registra desembolsos y lista pendientes por ADDI/SISTECREDITO.
- Checkout de tienda hoy: `registrarPedidoOnline` → WhatsApp, sin pasarela.

## Wompi (Colombia)

- **Modelo**: un negocio (cuenta Wompi) con `publicKey` (cliente) + `privateKey`/`eventsSecret` (servidor). Producción: `https://production.wompi.co/v1/...`; sandbox/test: `https://sandbox.wompi.co/v1/...` con llaves `pub_test_` / `prv_test_`.
- **Flujo tarjeta/PSE**: crear transacción vía REST:
  - `POST /v1/transactions` header `Authorization: Bearer <pub_key>` con `{ amountInCents, currency: 'COP', customer: { email, name, phoneNumber ... }, reference, redirectUrl?, paymentMethod: { type: 'card'|'pse', ... } }`.
  - Wompi devuelve la transacción; el cliente paga en la página hospedada de Wompi o con datos de tarjeta si se usa el widget.
  - **Webhooks**: evento `transaction.updated` con firma `X-Event-Checksum` = SHA256 de (`transaction.id`, `status`, `amountInCents`, `timestamp`, `eventsSecret`), concatenado según spec Wompi. Estados: `APPROVED`, `DECLINED`, `PENDING`, `FAILED`, `REFUNDED`; `type`: `card`, `pse`, `bancolombia`, `nequi`.
- **Payment Links**: alternativa ligera — crear link por API (`POST /v1/payment-links`) y redirigir.
- **Licencia/coste**: Wompi es de Mercado Pago; cobrar tarifa por transacción según merchant (verificable en dashboard). La evaluación formal va en `docs/HERRAMIENTAS.md`.

## Bold (Colombia)

- **Modelo**: cuenta Bold Cobros con `apiKey` (live/test) vía dashboard. Producto principal para tiendas: **enlaces de pago** y **checkout embebido**.
- **Flujo**: crear enlace/orden (`POST https://api.bold.co/v1/checkout/links` o equivalente según versión documentada con la API key) y redirigir al cliente; webhook de estado de pago con firma del sistema Bold.
- Alternativa *Bold como pasarela manual*: generar el enlace desde el dashboard y pegarlo — no requiere integración en v1 si el checkout técnico se retrasa, pero el spec pide integración API.
- **Licencia/coste**: Bold es plataforma fintech colombiana; retención por transacción (verificable en dashboard).

## Impacto local (Colombia) — qué implica para KAOB

1. **Addi y Sistecrédito NO son pasarelas online por API pública**: en Colombia Addi/Sistecrédito en tienda física POS son BNPL; para online el cliente escoge "pagar con crédito" y la tienda registra la venta con el método BNPL + documento (el desembolso luego se concilia en `/bancos/plataformas`, como ya se modela). No hay checkout hosted de Addi para e-commerce externo de terceros en v1; por eso el spec define: formulario documento → PagoVenta con método + desembolsado false.

2. **PSE**: disponible vía Wompi (type pse) y Bold Cobros según canal habilitado.

3. **Idempotencia**: webhooks pueden llegar duplicados y fuera de orden; se diseñan claves únicas por `(proveedor, referencia_externa)`.

4. **Seguridad**: llaves solo en env (Coolify/gestor cifrado), nunca en Git; webhooks con verificación HMAC-SHA256 constant-time.

## Decisión documentada (a confirmar con evidencia live)

- **Wompi primero** (tarjeta/PSE/Bold como redirigentes), **Bold enlaces** como canal secundario — dependiendo de costes reales comprobados en dashboard.
- Evaluación de licencia/coste/mantenimiento/exportación va en `docs/HERRAMIENTAS.md` antes de llaves live (Constitución).
