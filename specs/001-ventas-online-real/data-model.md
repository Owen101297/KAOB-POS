# Data Model: Ventas-online real + Puesta a cero

**Feature**: `specs/001-ventas-online-real` | **Date**: 2026-11-08

## Entidades nuevas (Prisma)

### EstadoPedidoOnline (enum)

```text
PENDIENTE | EMPACADO | EN_CAMINO | ENTREGADO | CANCELADO
```

Transiciones válidas: `PENDIENTE→EMPACADO→EN_CAMINO→ENTREGADO`; `CANCELADO` alcanzable desde `PENDIENTE`, `EMPACADO` o `EN_CAMINO`. Estados finales: `ENTREGADO`, `CANCELADO` (ninguna transición posterior).

### Pedido

| Campo | Tipo | Regla |
|---|---|---|
| id | Int PK autoincrement | — |
| referencia | String @unique | `PED-<YYYYMMDD>-<id>` (D2), se llena en la misma transacción |
| nombreContacto | String | requerido (checkout lo exige) |
| telefonoContacto | String | requerido, con índice para búsqueda en POS |
| ciudad / direccion | String? | datos de envío opcionales |
| notas | String? | notas del cliente |
| total | Int | suma de subtotales de ítems, COP sin decimales (D1) |
| estado | EstadoPedidoOnline | default `PENDIENTE` |
| estadoPor | String? | actor del último cambio (D4) |
| estadoEn | DateTime? | fecha/hora del último cambio de estado |
| createdAt | DateTime | default now() |

Índices: `@index([estado])`, `@index([createdAt])`. Relación 1→N con `items`.

### PedidoItem

| Campo | Tipo | Regla |
|---|---|---|
| id | Int PK | — |
| pedidoId | Int FK | onDelete: Cascade (el ítem no se comparte) |
| varianteId | Int FK Variante | onDelete: Restrict (coherente con `VentaItem`/`CompraItem`) |
| referencia | String | snapshot `Producto.referencia` |
| nombre | String | snapshot `Producto.nombre` |
| tallaValor | String | snapshot `Talla.valor` |
| colorNombre | String | snapshot `Color.nombre` |
| cantidad | Int | ≥ 1 |
| precioUnitario | Int | precio efectivo mostrado en tienda (override de variante si existe; D1) |
| subtotal | Int | cantidad × precioUnitario, calculado en server |

Sin `StockBodega` ni movimientos: la venta real del POS descontará stock al entregar (supuesto del spec).

## Entidades existentes tocadas (solo lectura)

- `Variante` (con `talla`, `color`, `producto.con categoria`): fuente de los FKs y snapshots del `PedidoItem`.
- `Configuracion.telefono`: número del destino WhatsApp (ya usado en `TiendaClient.tsx:317`).

## Orden de borrado — Purga (FR-008/FR-009/FR-010)

Del grafo FK de `prisma/schema.prisma` (líneas 116–811). Los `deleteMany` se ejecutan en `$transaction` en este orden exacto:

### Nivel transaccional

1. `abonosCredito` (FK credito Cascade)
2. `creditoCliente` (Restrict a Cliente — por eso se borra antes que contactos… en transaccional no se borra cliente)
3. `abonoPlanSepare`, `planSepareItem`, `planSepare`
4. `movimientoPuntos` (Cascade a Cliente)
5. `giftCard`, `promocion`
6. `pagoVenta` (FK venta Cascade + desembolso SetNull), `ventaItem`, `venta`
7. `movimientoCaja`, `sesionCaja`
8. `compraItem`, `pagoCompra`, `compra` (Restrict a Proveedor/Bodega — proveedor no se toca)
9. `ordenCompraDetalle`, `ordenCompra`
10. `movimientoBancario`, `conciliacionBancaria`, `desembolsoPlataforma`, `cuentaBancaria`
11. `gasto` (FK cuentaBancaria SetNull — ya vacío tras 10)
12. `auditoria`
13. `trasladoDetalle`, `traslado`, `movimientoInventario` (FK traslado SetNull — vacío tras 13)
14. `pedidoItem`, `pedido` (nuevos)

### Residuos E2E del catálogo (ambos niveles, tras el nivel elegido)

15. `producto` `where nombre startsWith 'E2EE'` (cascada variante/stock/movimientos ya vacíos en transaccional)
16. `color` `startsWith 'INK-'` — solo si `variante` no referencia (Restrict; verificación previa con conteo)
17. `categoria` `startsWith 'E2ECAT-'` (Restrict a Producto: productos ya purgados en 15)
18. `grupoTalla` `startsWith 'E2EGT-'` (Restrict)

### Nivel cero (además de todo lo anterior)

19. `stockBodega`, `variante`, `producto` (todos)
20. `marca`, `categoria`, `talla`, `grupoTalla`, `color` (catálogo restante)
21. `cliente`, `proveedor`, `vendedor`, `domiciliario` (contactos)

**Excepción de conservación en cero total (decisión, D5/F10)**: `Bodega` y `Configuracion` NO se borran. La bodega es infraestructura de operación (todas las FKs de inventario la exigen con Restrict); sin bodega el POS quedaría inoperante tras la purga. `Configuracion` se garantiza por el FR-010. Desviación documentada y por confirmar con el propietario en la revisión del plan.

## Estados y pantallas

| Pantalla | Datos | Operación |
|---|---|---|
| `/tienda` checkout | `(nombre, celular, ciudad?, direccion?, notas?, items[{varianteId, cantidad}])` | guarda `Pedido` |
| `/ventas-online` | pedidos con estado, referencia, total, items count, fecha | filtra por estado |
| `/ventas-online` detalle | ítems + contacto + notas | leer |
| `/ventas-online` acciones | `id`, `nuevoEstado` | avanzar/cancelar (FR-004) |
