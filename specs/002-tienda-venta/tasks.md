---
description: "Task list for feature tienda que vende (pagos online + rediseño 21st)"
---

# Tasks: Tienda que vende

**Input**: Design documents from `/specs/002-tienda-venta/`

**Prerequisites**: plan.md (required), spec.md, research.md, data-model.md, contracts/ ✅

**Tests**: Unit + E2E (checkout, webhook, redesign smoke) ✅

**Organization**: Grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup

- [x] T001 Branch `002-tienda-venta`, spec aprobado (spec.md + checklists)
- [ ] T002 [P] Tool evaluation doc entry: Bold + Wompi in `docs/HERRAMIENTAS.md` with columns (licencia, mantenimiento, coste, exportación, restauración, decisión, evidencia) — Sin live keys, sin suscripciones

---

## Phase 2: Foundational (Bloquea US1/US3)

- [ ] T003 Modelos Prisma: `PagoOnline` + `ProveedorPago` (+ `Pedido.pagos` relación, migración SQL) 
- [ ] T004 [P] `lib/pagos/tipos.ts`: tipos `ProveedorPago`, `MetodoPagoTienda`, `EstadoPagoOnline`, `ResultadoPago`
- [ ] T005 [P] `lib/pagos/wompi.ts`: cliente Wompi (crear transacción, consultar estado, validar firma webhook HMAC-SHA256)
- [ ] T006 [P] `lib/pagos/bold.ts`: cliente Bold (crear enlace/orden pago, consultar estado, validar webhook)
- [ ] T007 [P] `lib/pagos/cobros.ts`: `registrarPagoOnline(pedidoId, metodo, datos)` — crea PagoOnline + PagoVenta (+ Desembolso plataforma si aplica)
- [ ] T008 [P] `lib/pagos/firmas.ts`: utilidades de firma webhook (HMAC SHA256 por proveedor, constant-time)

**Checkpoint**: Foundation ready — model + adapters testables sin UI.

---

## Phase 3: User Story 1 — Cobros online en el checkout (P1) 🎯 MVP

> Checkout multi-método: tarjeta/PSE vía pasarela, Addi/Sistecrédito, fiado con cupo, contraentrega.

- [ ] T009 [US1] `app/api/checkout/wompi/route.ts` POST: crea pedido/proveedor, registra `PagoOnline` PENDIENTE, redirige a página Wompi
- [ ] T010 [US1] `app/api/checkout/bold/route.ts` POST: igual con Bold
- [ ] T011 [US1] `app/api/webhooks/wompi/route.ts`: valida firma, actualiza PagoOnline/Pedido (idempotente, fuera de orden)
- [ ] T012 [US1] `app/api/webhooks/bold/route.ts`: igual con Bold
- [ ] T013 [US1] `CartDrawerTienda.tsx`: selector de método con logos, formularios por método (Addi doc / Sistecrédito doc / fiado cliente / tarjeta y PSE a pasarela), confirmación
- [ ] T014 [US1] `lib/actions/pedidos.ts`: `registrarPedidoOnline` acepta método; `cambioEstadoPedido` maneja PAGADO/EN_TRÁNSITO
- [ ] T015 [US1] `/ventas-online` muestra badge método + estado de pago

**Checkpoint**: US1 puede probarse en staging con llaves test.

### Tests US1
- [ ] T016 [US1] `tests/pagos-adapters.test.mjs`: firmas webhook (HMAC) + mapeo estados
- [ ] T017 [US1] E2E: checkout → redirige a pasarela sandbox → webhook (o consulta) → pedido PAGADO/EN_TRÁNSITO

---

## Phase 4: User Story 2 — Prendas desde POS (P2) ✅ ya completo

- [ ] T018 [US2] Documentar en `docs/productos-pos.md`: flujo alta/baja/activación en `/productos`, sincronía con tienda < 5s, thumbnails

**Checkpoint**: /productos ya cubre alta/baja/activación (001 ya implementado). Solo docs + verificación.

---

## Phase 5: User Story 3 — Rediseño 21st (P3)

> Adaptado de archivos existentes, sin publicar código ajeno; mismo lenguaje visual KΛOB.

- [ ] T019 [P] [US3] `components/tienda/HeroTienda.tsx`: hero editorial aspiracional (foto grande + titular de marca + CTAs Dama/Caballero, marquee animado)
- [ ] T020 [P] [US3] `components/tienda/CategoryGridBento.tsx`: bento con imagen, hover zoom, conteo real de prendas
- [ ] T021 [P] [US3] `components/tienda/FeaturedShowcase.tsx`: showcase destacado (foto grande, precio, estrellas, CTA)
- [ ] T022 [P] [US3] `components/tienda/ProductCardTienda.tsx` v2: foto grande, swatches con estado real, hover quick-view, badges (stock bajo, más vendido)
- [ ] T023 [P] [US3] `components/tienda/TrustSection.tsx`: trust badges (envíos, devoluciones, pago seguro) + testimonios
- [ ] T024 [P] [US3] `components/tienda/ProductGridSkeleton.tsx`: skeletons de carga
- [ ] T025 [US3] `app/tienda/page.tsx`: Next/Image AVIF + `prefers-reduced-motion` + metadata SEO/OG

**Checkpoint**: US3 visual verificable en staging.

---

## Phase N: Polish & Cierre

- [ ] T026 E2E smoke tienda (render, filtros, add-to-bag, checkout)

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 (Foundational) → US1 (P1) → US2 (P2, docs) → US3 (P3)
- US1 y US3 comparten `CartDrawerTienda` → secuencial (US1 primero, US3 después)
- US2 independiente (docs, puede ir en paralelo a US1/US3)

## Parallel Opportunities
- T004–T008 [P]
- T016–T017 [P]
- T019–T025 [P]
