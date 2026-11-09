# Research: Ventas-online real + Puesta a cero

**Feature**: `specs/001-ventas-online-real` | **Date**: 2026-11-08

## D1 — Pedido sigue las convenciones monetarias del POS (COP Int + snapshot)

**Decision**: `PedidoItem.precioUnitario`/`cantidad` como `Int` (pesos colombianos, sin decimales) y snapshot de texto (`referencia`, `nombre`, `tallaValor`, `colorNombre`) además de FKs a variante.
**Rationale**: Todo el dominio económico del POS usa `Int` (Venta, VentaItem, Compra, Gasto). El snapshot hace legible el pedido aunque cambie el catálogo posteriormente, igual que hace el mensaje de WhatsApp hoy (`components/tienda/CartDrawerTienda.tsx:54-70`).
**Alternatives considered**: `Decimal` en dinero (contradice el resto del dominio); prescindir de snapshot (el WhatsApp ya lo captura — se evita doble fuente de verdad borrando el snapshot).

## D2 — Referencia del pedido derivada del id (sin contador adicional)

**Decision**: `referencia = 'PED-' + YYYYMMDD + '-' + id`, llenada en la misma transacción/`create` posterior a la inserción (update puntual con `WHERE id`), `@unique`.
**Rationale**: `id` autoincrement ya garantiza unicidad y orden; un contador diario (`Venta.consecutivo`) añadiría una carrera por concurrencia innecesaria para un flujo web público.
**Alternatives considered**: contador diario con `$transaction` serializable (más código, más riesgo); UUID (referencia ilegible para despacho).

## D3 — Trazabilidad de estados mediante campos en `Pedido` (no tabla aparte)

**Decision**: campos `estado` actualizado junto a `estadoPor` y `estadoEn` en el mismo `update`.
**Rationale**: Constitución V (simplicidad): la historia específica sólo cubre 5 estados en v1; v1 registra el último cambio con actor y fecha, suficiente para auditoría operativa. `Auditoria` (ya existente) sigue capturando eventos globales.
**Alternatives considered**: tabla `PedidoCambioEstado` (historial completo con rastro por transición — se adoptará si el propietario exige auditoría completa por transición).

## D4 — Actor de los cambios = usuario Basic Auth (administrador único)

**Decision**: `estadoPor = "Administrador"` (constante), tras pasar `requireAuth()`; el esquema guarda el campo opcional por si el auth multi-usuario llega posteriormente.
**Rationale**: Basic Auth actual es de un solo usuario (`KAOB_POS_AUTH_USER`, sin diferencia de identidad por petición); la auditoría existente usa el mismo fallback (`lib/actions/auditoria.ts:35`).
**Alternatives considered**: usuario del entorno Basic Auth (no expuesto por decisión de secretos; escribiría al dato objetivo el mismo valor).

## D5 — Purga con `deleteMany` explícitos en orden de dependencias en `$transaction`

**Decision**: el script borra con `db.<modelo>.deleteMany({})` en orden hoja→raíz (definido en `data-model.md`), una `$transaction`, tras conteos por tabla y confirmación escrita; además, y de forma separada, borra residuos E2E del catálogo por `startsWith` con nombres del patrón.
**Bounds**: NO usa `prisma migrate reset` (destruye/pierde el schema+config de Coolify en el entorno apuntado), ni `TRUNCATE ... CASCADE` (borra en silencio filas de tablas no anticipadas — rompería la garantía de conteo exacto mostrado).
**Rationale**: Prisma crea FK `ON DELETE CASCADE` en la DB, pero el borrado explícito garantiza que los conteos reportados antes de confirmar sean exactos y deterministas.
**Alternatives considered**: SQL en crudo (pierde tipado y portabilidad///enlaza con el schema actual), `migrate reset` (cae/apaga servicios fuera del alcance).

## D6 — `screens.xs: '400px'` vía `extend` de Tailwind

**Decision**: añadir `screens: { xs: '400px' }` dentro de `theme.extend` de `tailwind.config.js` (merge con breakpoints por defecto, `sm`/`md` siguen intactos).
**Rationale**: la causa raíz del E2E-01 es el uso de `hidden xs:inline` en `VentaClient.tsx:602,750` con breakpoint no definido; con `xs` el merge de Tailwind valida las dos reglas sin mover las existentes.
**Alternatives considered**: sustituir por la variante arbitraria `min-[400px]:inline` en línea (esparce el valor `400px` en 2 componentes en lugar de la centralización); definir `xs` global es la corrección mínima y coherente con el diseño del POS.

## D7 — Checkout: guardar pedido y abrir WhatsApp encima de la misma acción

**Decision**: `CartDrawerTienda` envía `registrarPedidoOnline` primero; si resulta `ok`, el botón abierto de WhatsApp se entrega con `referencia` incluida en el mensaje (sin romper el flujo actual `wa.me`); si la llamada falla, se muestra el error y no se abre WhatsApp.
**Rationale**: el requisito aprobado conserva ambos canales; guardar primero además permite que la referencia quede ya en el mensaje que el cliente abre.
**Alternatives considered**: WhatsApp primero y luego guardar (dejaría pedidos sin guardar aunque el cliente ya abriera el chat, o desincronía si el guardado falla después).

## D8 — E2E nuevas en archivo propio contra staging

**Decision**: nuevo `tests/e2e/ventas-online-pedido.spec.ts` con: checkout → pedido visible en `/ventas-online`, cambio de estado → badge actualizado. Reutiliza credenciales de `.env.e2e` como el resto de la suite.
**Rationale**: la suite existente (13/13) queda intacta (cero regresiones, principio IV); el feature añade sus pruebas SIN transacción de staging compartido de forma segregada (limpieza transaccional ya documentada en `README.local.md`).
