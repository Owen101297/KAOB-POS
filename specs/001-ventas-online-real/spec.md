# Feature Specification: Ventas-online real con BD + Puesta a cero de datos

**Feature Branch**: `001-ventas-online-real`

**Created**: 2026-11-08

**Status**: Draft

**Input**: User description: "Conectar /ventas-online real con la BD y script de puesta a cero de datos para lanzamiento; incluir fix E2E-01 (badge CAJA ACTIVA) como tarea rápida del branch."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Checkout de tienda crea pedido en BD (Priority: P1)

Un cliente de la tienda web (`/tienda`) arma su bolsa, completa sus datos de contacto y envía el pedido. Al confirmar, el pedido queda registrado en la base de datos con sus líneas (producto, variante, cantidad, precio) y datos de contacto; la opción actual de WhatsApp queda disponible además como canal de seguimiento.

**Why this priority**: Es la funcionalidad núcleo: sin pedidos reales en BD, el panel `/ventas-online` no tiene datos y la tienda no deja rastro operativo. Convierte la demo en sistema real.

**Independent Test**: Completar un checkout en `/tienda` y verificar, con acceso al POS, que existe un pedido consultable en `/ventas-online` con el detalle exacto de lo comprado. No depende de gestión de estados ni de la purga.

**Acceptance Scenarios**:

1. **Given** un catálogo con productos y stock, **When** un cliente completa el checkout con nombre y teléfono, **Then** un pedido queda persistido con estado inicial, sus ítems (producto, variante, cantidad, precio unitario) y datos de contacto.
2. **Given** un carrito con variantes concretas (talla/color), **When** se confirma el pedido, **Then** cada línea identifica la variante exacta para despachar la prenda correcta.
3. **Given** un intento de checkout con carrito vacío, **When** se confirma, **Then** el sistema rechaza la operación sin dejar pedidos vacíos en la BD.
4. **Given** el botón "Enviar por WhatsApp" existente, **When** el pedido queda registrado, **Then** la ruta de WhatsApp sigue disponible con el comportamiento actual.

---

### User Story 2 - Panel de gestión de pedidos online en el POS (Priority: P2)

El personal del POS abre `/ventas-online` y ve los pedidos reales de la tienda (sustituyendo los pedidos demo estáticos en memoria). Puede ver el detalle de cada pedido, avanzar su estado en el ciclo de despacho (Pendiente → Empacado → En camino → Entregado), cancelar pedidos no entregados y filtrar por estado.

**Why this priority**: Da valor operativo directo al personal del POS, pero depende de que US1 genere pedidos reales que valga la pena gestionar.

**Independent Test**: Con al menos un pedido creado, avanzar su estado y verificar que el cambio queda registrado (estado, fecha y actor). Demuestra el valor de gestión aunque no se cree ningún otro pedido.

**Acceptance Scenarios**:

1. **Given** pedidos en distintos estados, **When** el operario abre `/ventas-online`, **Then** ve solo pedidos reales de la BD (sin `PED-1001..1003` demo) con su estado actual.
2. **Given** un pedido en estado Pendiente, **When** el operario lo marca Empacado, **Then** el estado queda persistido con registro del cambio (fecha y actor).
3. **Given** un pedido Entregado, **When** se intenta retroceder o reenviar su estado, **Then** la transición inválida es rechazada.
4. **Given** un pedido aún no Entregado, **When** el operario lo cancela, **Then** queda con estado Cancelado conservando el rastro para auditoría.

---

### User Story 3 - Puesta a cero de datos para lanzamiento (Priority: P3)

Antes del arranque oficial de operaciones, el propietario ejecuta desde la raíz del repo un script que elimina datos de pruebas/demo de la base de datos en dos niveles elegibles: **transaccional** (ventas, compras, caja, créditos, plan separe, puntos, gift cards, auditoría, gastos, movimientos bancarios, movimientos de inventario, traslados y pedidos online, además de los residuos marcados de pruebas E2E del catálogo, conservando catálogo real y contactos) y **cero total** (borra todo lo anterior además de catálogo y contactos, garantizando únicamente `Configuracion`). El script interactivo muestra los conteos por tabla ANTES de borrar y exige confirmación escrita por teclado.

**Why this priority**: Requisito puntual de lanzamiento, no de operación diaria; corre al final, cuando ya no hay pedidos que convertir, y con autorización explícita si apunta a producción.

**Independent Test**: Ejecutar el nivel transaccional en una BD de staging con datos de prueba y verificar: tablas transaccionales a 0, catálogo/contactos conservados y `Configuracion` intacta. Nivel cero análogo (solo `Configuracion` sobrevive).

**Acceptance Scenarios**:

1. **Given** una BD de staging con datos mixtos, **When** se ejecuta el nivel transaccional confirmado, **Then** toda tabla transaccional queda a 0 y catálogo real, contactos y `Configuracion` se conservan.
2. **Given** cualquier BD, **When** se ejecuta el script sin completar la confirmación escrita, **Then** no se elimina nada (0 filas afectadas).
3. **Given** residuos de pruebas E2E (categorías `E2ECAT-*`, grupos `E2EGT-*`, colores `INK-*`, productos `E2EE*`), **When** se corre la purga, **Then** solo esos registros marcados se eliminan del catálogo, no los productos reales.
4. **Given** una corrida de cero total, **When** se revisa la BD resultante, **Then** `Configuracion` existe intacta y toda tabla de negocio está a 0.

### Edge Cases

- ¿Qué pasa si el cliente confirma checkout y un ítem carece de variante concreta? El pedido registra la línea con el detalle disponible; sin ID de variante la línea se rechaza (la tienda opera si y solo si cada línea lleva una variante real).
- ¿Cómo maneja el script la ausencia de `DATABASE_URL`? Aborta con mensaje claro; no se ejecuta borrado alguno.
- ¿Cómo maneja el script una BD ya vacía? Corrida exitosa reportando 0 filas afectadas por tabla.
- ¿Qué pasa si dos operarios avanzan el mismo pedido a la vez? La segunda confirmación es rechazada porque el estado ya cambió (control por comparación de estado previo).
- ¿El pedido Entregado puede volverse desactivar? No: Entregado y Cancelado son estados finales; el rastro queda para auditoría.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El checkout de la tienda guardará cada pedido con: datos de contacto (nombre, teléfono), líneas con referencia a producto/variante (con snapshot suave de descripción y precio), referencia única legible (formato `PED-<fecha>-<secuencia>`), fecha/hora de creación y estado inicial Pendiente.
- **FR-002**: Cada pedido podrá estar en uno de 5 estados: Pendiente, Empacado, En camino, Entregado o Cancelado.
- **FR-003**: El panel `/ventas-online` listará solo pedidos reales de la BD (sin datos demo), con filtros por estado y orden descendente por fecha.
- **FR-004**: Desde el panel, el operario podrá avanzar el estado solo por el ciclo válido (Pendiente→Empacado→En camino→Entregado) o cancelar si no está ya entregado; cada cambio registrará fecha/hora y actor (usuario autenticado del POS).
- **FR-005**: La ruta de WhatsApp del checkout actual permanecerá disponible tras registrar el pedido (sin regresión del comportamiento existente).
- **FR-006**: La demo estática será reemplazada: no quedarán pedidos demo (`PED-1001..1003`) en memoria ni código renderizado en `/ventas-online`.
- **FR-007**: El script de purga se ejecutará como comando npm (`npm run purga -- --nivel=transaccional|cero`), interactivo, con conteos por tabla mostrados ANTES de ejecutar el borrado y confirmación escrita obligatoria.
- **FR-008**: La purga transaccional dejará a 0 todas las tablas transaccionales: Venta+VentaItem+PagoVenta, SesionCaja+MovimientoCaja, Compra+CompraItem+PagoCompra, OrdenCompra+Detalle, CreditoCliente+AbonoCredito, PlanSepare+Items+Abonos, MovimientoPuntos, Promocion, GiftCard, Auditoria, CuentaBancaria+DesembolsoPlataforma+MovimientoBancario+ConciliacionBancaria, Gasto, MovimientoInventario, Traslado+Detalle y Pedido+PedidoItem; además purgará del catálogo los residuos E2E marcados (`E2ECAT-*`, `E2EGT-*`, `INK-*`, `E2EE*`).
- **FR-009**: La purga en nivel transaccional conservará íntegras las filas de `Configuracion`, bodega, catálogo escalable (Marca, Categoria, GrupoTalla, Talla, Color), contactos (Cliente, Proveedor, Vendedor, Domiciliario) y usuario(s) de acceso, salvo los residuos E2E del catálogo (FR-008).
- **FR-010**: La purga en nivel cero adicionalmente vaciará catálogo y contactos; garantizando únicamente que `Configuracion` sobreviva.
- **FR-011**: El script abortará con error claro y 0 filas afectadas si: no hay `DATABASE_URL`; el entorno conectado es producción sin el flag `--entorno=produccion` explícito; o la confirmación escrita no coincide exactamente.
- **FR-012**: La corrección E2E-01 añadirá el breakpoint `xs` faltante en Tailwind para que el badge "CAJA ACTIVA" sea visible en pantallas de mostrador/tablet y las aserciones Playwright (visible tras `toBeAttached`) pasen.

### Key Entities *(include if feature involves data)*

- **Pedido online**: documento de tienda web con contacto, referencia, fecha/hora, estado (Pendiente/Empacado/En camino/Entregado/Cancelado) y líneas de despacho.
- **Línea de pedido**: referencia al producto/variante con snapshot suave (descripción, precio) más cantidad y precio unitario al momento del checkout.
- **Registro de cambio de estado**: por cada avance/cancelación: estado anterior→nuevo, fecha/hora y actor.
- **Datos de demo/prueba a eliminar**: pedidos demo en memoria, residuos E2E del catálogo y demás registros transaccionales listados en FR-008.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% de los checkouts de tienda que operan sin error generan un pedido consultable en `/ventas-online` con detalle exacto (variantes, cantidades, contacto).
- **SC-002**: Cero regresiones: la suite E2E existente (13/13) sigue pasando; las pruebas del ciclo del pedido pasan en staging con datos aislados.
- **SC-003**: `npm run build`, `npx tsc --noEmit` y `npm test` pasan al cierre del branch.
- **SC-004**: La purga transaccional deja a 0 el 100% de los conteos de sus tablas objetivo en staging, conservando el 100% de catálogo real, contactos y `Configuracion`.
- **SC-005**: 0 filas eliminadas en intentos del script sin confirmación escrita (verificado en staging antes de listar el primer borrado real).

## Assumptions

- El descuento de stock NO ocurre al crear el pedido online en v1: el stock se administra al registrar la venta en POS al entregar; el pedido actúa como agenda del despacho.
- El checkout de la tienda no genera Venta ni PagoVenta en v1 (no hay pasarela de pago); el cobro ocurre en POS en la entrega.
- El actor del ciclo de despacho es el usuario autenticado del POS (basic auth vigente); no hay cuenta separada para el cliente de la tienda.
- El script de purga corre con el mismo toolchain del proyecto (Node + Prisma) desde la raíz del repo; requiere `DATABASE_URL` del entorno objetivo.
- El fix de Tailwind también abarca el ícono de escáner en `VentaClient.tsx` (misma causa del defecto).
- Ningún pedido demo (`PED-1001..1003`) representa datos reales; desaparecen con el reemplazo de la demo.

## Review Notes

- Pendiente post-merge (fuera de alcance): pasarela/pagos electrónicos en checkout, purga programada de residuos E2E y conversión de pedido→Venta directa desde el panel.
