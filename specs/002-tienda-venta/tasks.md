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
- [x] T002 [P] Tool evaluation doc entry: Bold + Wompi in `docs/HERRAMIENTAS.md` with columns (licencia, mantenimiento, coste, exportación, restauración, decisión, evidencia) — Sin live keys, sin suscripciones

---

## Phase 2: Foundational (Bloquea US1/US3)

- [x] T003 Modelos Prisma: `PagoOnline` + `ProveedorPago` (+ `Pedido.pagos` relación, migración SQL) 
- [x] T004 [P] `lib/pagos/tipos.ts`: tipos `ProveedorPago`, `MetodoPagoTienda`, `EstadoPagoOnline`, `ResultadoPago`
- [x] T005 [P] `lib/pagos/wompi.ts`: cliente Wompi (crear transacción, consultar estado, validar firma webhook HMAC-SHA256)
- [x] T006 [P] `lib/pagos/bold.ts`: cliente Bold (crear enlace/orden pago, consultar estado, validar webhook)
- [x] T007 [P] `lib/pagos/cobros.ts`: `registrarPagoOnline(pedidoId, metodo, datos)` — crea PagoOnline + PagoVenta (+ Desembolso plataforma si aplica)
- [x] T008 [P] `lib/pagos/firmas.ts`: utilidades de firma webhook (HMAC SHA256 por proveedor, constant-time)

**Checkpoint**: Foundation ready — model + adapters testables sin UI.

---

## Phase 3: User Story 1 — Cobros online en el checkout (P1) 🎯 MVP

> Checkout multi-método: tarjeta/PSE vía pasarela, Addi/Sistecrédito, fiado con cupo, contraentrega.

- [x] T009 [US1] `app/api/checkout/wompi/route.ts` POST: crea pedido/proveedor, registra `PagoOnline` PENDIENTE, redirige a página Wompi
- [x] T010 [US1] `app/api/checkout/bold/route.ts` POST: igual con Bold
- [x] T011 [US1] `app/api/webhooks/wompi/route.ts`: valida firma, actualiza PagoOnline/Pedido (idempotente, fuera de orden)
- [x] T012 [US1] `app/api/webhooks/bold/route.ts`: igual con Bold
- [x] T013 [US1] `CartDrawerTienda.tsx`: selector de método con logos, formularios por método (Addi doc / Sistecrédito doc / fiado cliente / tarjeta y PSE a pasarela), confirmación
- [x] T014 [US1] `lib/actions/pedidos.ts`: `registrarPedidoOnline` acepta método; `cambioEstadoPedido` maneja PAGADO/EN_TRÁNSITO
- [x] T015 [US1] `/ventas-online` muestra badge método + estado de pago

**Checkpoint**: US1 puede probarse en staging con llaves test.

### Tests US1
- [x] T016 [US1] `tests/pagos-adapters.test.mjs`: firmas webhook (HMAC) + mapeo estados
- [x] T017 [US1] E2E: checkout → redirige a pasarela sandbox → webhook (o consulta) → pedido PAGADO/EN_TRÁNSITO

---

## Phase 4: User Story 2 — Prendas desde POS (P2) ✅ ya completo

- [x] T018 [US2] Documentar en `docs/productos-pos.md`: flujo alta/baja/activación en `/productos`, sincronía con tienda < 5s, thumbnails

**Checkpoint**: /productos ya cubre alta/baja/activación (001 ya implementado). Solo docs + verificación.

---

## Phase 5: User Story 3 — Rediseño 21st (P3)

> Adaptado de archivos existentes, sin publicar código ajeno; mismo lenguaje visual KΛOB.

- [x] T019 [P] [US3] `components/tienda/HeroTienda.tsx`: hero editorial aspiracional (foto grande + titular de marca + CTAs Dama/Caballero, marquee animado)
- [x] T020 [P] [US3] `components/tienda/CategoryGridBento.tsx`: bento con imagen, hover zoom, conteo real de prendas
- [x] T021 [P] [US3] `components/tienda/FeaturedShowcase.tsx`: showcase destacado (foto grande, precio, estrellas, CTA)
- [x] T022 [P] [US3] `components/tienda/ProductCardTienda.tsx` v2: foto grande, swatches con estado real, hover quick-view, badges (stock bajo, más vendido)
- [x] T023 [P] [US3] `components/tienda/TrustSection.tsx`: trust badges (envíos, devoluciones, pago seguro) + testimonios
- [x] T024 [P] [US3] `components/tienda/ProductGridSkeleton.tsx`: skeletons de carga
- [x] T025 [US3] `app/tienda/page.tsx`: Next/Image AVIF + `prefers-reduced-motion` + metadata SEO/OG

**Checkpoint**: US3 visual verificable en staging.

---

## Phase N: Polish & Cierre

- [x] T026 E2E smoke tienda (render, filtros, add-to-bag, checkout)

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 (Foundational) → US1 (P1) → US2 (P2, docs) → US3 (P3)
- US1 y US3 comparten `CartDrawerTienda` → secuencial (US1 primero, US3 después)
- US2 independiente (docs, puede ir en paralelo a US1/US3)

## Parallel Opportunities
- T004–T008 [P]
- T016–T017 [P]
- T019–T025 [P]

## 002b — Identidad editorial boutique (2026-11-10)

Iteración visual de la misma feature, autorizada por el propietario: reconstrucción de la
vitrina con identidad propia (premium · exclusivo · editorial claro) y llamados a la compra.

- [x] T027 Tokens de diseño: paleta bone/ink/bronze + tipografía de exhibición (Playfair) en tailwind
- [x] T028 Fuentes auto-alojadas en `app/fonts/` (Inter + Playfair Display, OFL) con `next/font/local` — el build no depende de fonts.gstatic.com (causa de 2 despliegues fallidos)
- [x] T029 Hero editorial: titular serif con reveal palabra a palabra, parallax del isotipo, CTA "Descubrir la colección" + ediciones Dama/Caballero
- [x] T030 Navbar isla: indicador activo con `layoutId`, elevación al scroll, logotipo `currentColor` sin perder transparencia
- [x] T031 Marquee infinito de promesas (respeta `prefers-reduced-motion`)
- [x] T032 Tarjeta de producto premium: nombre serif, tallas y color visibles sin abrir el detalle, escasez en bronce
- [x] T033 Mosaico de colecciones con numeración serif, testimonios como cita, footer con cierre de compra y WhatsApp
- [x] T034 Empty-state premium con CTA a WhatsApp (sustituye el mensaje técnico "No hay productos")
- [x] T035 Skeletons en paleta hueso y metadata SEO/OG conservadas
- [x] T036 Verificación: tsc, 25/25 unitarias, build (52 rutas) y E2E 21/21 contra staging con el diseño nuevo
