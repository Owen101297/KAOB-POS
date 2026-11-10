# Feature Specification: Tienda que vende — pagos online + rediseño 21st

**Feature Branch**: `002-tienda-venta`

**Created**: 2026-11-09

**Status**: Approved

**Input**: User description: "Redesign de /tienda para convertir (plantillas 21st: hero, showcase, cards, trust) + pagos online (Bold, Wompi, Addi, Sistecrédito, fiado, contraentrega). Prendas se gestionan desde el POS (/productos ya lo cubre)."

---

## User Scenarios & Testing

### User Story 1 - Cobros online en el checkout (Priority: P1)

Un cliente arma su bolsa en `/tienda`, completa sus datos y elige cómo pagar antes de confirmar: (a) tarjeta/PSE/Wompi/Bold vía pasarela externa con redirección, (b) Addi o Sistecrédito con su documento, (c) fiado (clientes con cupo), (d) contraentrega en efectivo. El pedido queda creado con su método de pago y, según el método, pasa a Pagado (pasarela approved), En tránsito (BNPL/credito) o Pendiente de cobro (contraentrega).

**Why this priority**: Sin pago en línea no hay conversión: el WhatsApp manual es fricción pura. Es el valor núcleo de "página que vende".

**Independent Test**: Checkout completo con tarjeta en modo test (pasarela sandbox) → pedido Pagado. No depende del rediseño visual ni del admin de prendas.

**Acceptance Scenarios**:
1. **Given** bolsa con productos y datos completos, **When** el cliente paga con tarjeta en la pasarela, **Then** el pedido queda Pagado, con referencia, y se descuenta el stock al despachar desde POS.
2. **Given** cliente con documento válido, **When** elige Addi/Sistecrédito, **Then** queda `PagoVenta` con método ADDI/SISTECREDITO y `desembolsado: false` (aparece en `/bancos/plataformas` para conciliación).
3. **Given** cliente con cupo vencido, **When** elige fiado, **Then** el checkout se niega con mensaje legible y el pedido no queda creado.
4. **Given** contraentrega seleccionada, **When** confirma, **Then** el pedido queda Pendiente de cobro y llega al panel `/ventas-online` como los demás.
5. **Given** rechazo de la pasarela, **When** vuelve el cliente, **Then** el pedido queda en estado *Pago fallido* (no se confirma ni se descuenta stock) y puede reintentar.

### User Story 2 - Gestión de prendas desde el POS (Priority: P2)

El administrador gestiona el catálogo desde el POS existente sin tocar la tienda: agrega prensas, elimina y activa/desactiva. La tienda refleja cambios al instante (misma BD).

**Why this priority**: Ya está completo el backend (`/productos` con creación, eliminación múltiple, toggle `activo`). Solo requiere documentación y verificación de sincronía.

**Independent Test**: Desactivar un producto en POS → desaparece de la tienda sin deploy.

**Acceptance Scenarios**:
1. **Given** un producto activo, **When** se desactiva en POS, **Then** no aparece en `/tienda` ni en búsquedas.
2. **Given** un producto nuevo creado en POS, **When** se activa, **Then** aparece en la vitrina con sus variantes.

### User Story 3 - Rediseño 21st que convierte (Priority: P3)

Rediseño de `/tienda` con piezas de 21st adaptadas a la marca: hero editorial aspiracional, categorías con imagen, showcase de producto destacado, cards con swatches y diferido de inventario, trust badges (envíos, devoluciones, pagos seguros) y skeletons de carga.

**Why this priority**: Visual, pero sin el pago (US1) no hay conversión. Es el "100%" del encargo, una vez cobros funcionando.

**Independent Test**: La página vitrina renderiza con productos reales y Lighthouse móvil ≥ 90 en staging.

**Acceptance Scenarios**:
1. **Given** la vitrina, **When** entra un visitante, **Then** ve hero con foto, titular de marca y CTAs a Dama/Caballero en < 2s.
2. **Given** un producto con stock bajo, **When** se ve la tarjeta, **Then** muestra badge "Últimas unidades".
3. **Given** zona de confianza, **When** scrollea, **Then** ve envíos a Colombia, devoluciones y pagos seguros con iconografía.

### Edge Cases
- Cliente cierra la pasarela sin pagar: el pedido no se crea (entonces no queda rastro) — opción de crear "orden pendiente de pago" evaluada (ver FR-005).
- Doble pago por reintento: webhook idempotente por referencia (FR-006).
- Webhook llega fuera de orden: la conciliación valida estado final (FR-007).
- Sync de stock entre tienda y POS marcada: cambio explícito de estado del pedido en POS (FR-008).

## Requirements

### Functional Requirements

- **FR-001**: Checkout con pasarela (Wompi y Bold) redirige al cliente a la página del proveedor y, al approve, marca el pedido como Pagado con su referencia externa.
- **FR-002**: Checkout con Addi/Sistecrédito registra `PagoVenta` con método + `desembolsado: false` y datos del cliente (documento, nombre, teléfono, dirección).
- **FR-003**: La tienda muestra badges de urgencia por stock (Últimas unidades, Más vendido, Agotado) y trust (envíos, devoluciones, pago seguro).
- **FR-004**: Inventario de la tienda se deriva del stock real por variante (POS), sin duplicar.
- **FR-005**: Webhook de pasarela con firma comprobada y estado consistente con el pedido (idempotente, fuera de orden).
- **FR-006**: Gestión de prendas en POS con alta, baja, activación/desactivación y sincronización instantánea con la tienda.
- **FR-007**: Rediseño 21st con hero aspiracional, categorías con imagen, showcase destacado, cards con swatches y skeletons, todo con la marca KΛOB.

### Key Entities
- **PagoOnline**: referencia, proveedor (WOMPI/BOLD/ADDI/SISTECREDITO/FIADO/CONTRAENTREGA), estado (PENDIENTE/APROBADO/RECHAZADO/EN_TRÁNSITO/CONFIRMED), monto, pedido, webhook id.
- **Pedido**: existe desde 001 (Pendiente/Empacado/En camino/Entregado/Cancelado) — se extiende con estado de pago.

### Success Criteria
- **SC1**: Conversión: ≥ 80% de checkouts iniciados llegan a confirmación (fuera de rechazos de banco).
- **SC2**: 100% de pagos Wompi/Bold conciliados con `DesembolsoPlataforma` o estado Pagado confirmado.
- **SC3**: 100% de pagos ADDI/SISTECREDITO aparecen como pendientes de desembolso en `/bancos/plataformas`.
- **SC4**: Lighthouse móvil ≥ 90 en staging para `/tienda`.
- **SC5**: Cero regresiones E2E (18/18 + nuevos de pago).
- **SC6**: Al enviar una prenda nueva desde POS, la vitrina la refleja en < 5s (revalidación).

### Assumptions
- Llaves live de Wompi/Bold viven en Coolify/gestor cifrado; staging usa llaves de test.
- Addi/Sistecrédito no validan documento en línea en v1 (se registra y se gestiona como ya hace el POS).
- Tienda sigue permitiendo WhatsApp como canal de comunicación paralelo, no como pago.
