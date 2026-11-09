---

description: "Task list for feature ventas-online real + puesta a cero"
---

# Tasks: Ventas-online real con BD + Puesta a cero

**Input**: Design documents from `/specs/001-ventas-online-real/`

**Prerequisites**: plan.md ✅, spec.md ✅ (aprobada por propietario), research.md, data-model.md, contracts/, quickstart.md

**Tests**: El spec exige suite verde (SC-002/003): se incluyen unit tests del contrato de actions y E2E nuevas.

**Organization**: Tasks agrupadas por user story para entrega incremental independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin dependencias)
- **[Story]**: User story owner (US1, US2, US3)
- Rutas exactas incluidas en cada tarea

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Baseline validado, listo para tocar código.

- [x] T001 Dependencias instaladas (`npm ci` con caché `~/0z1a/homelab/.runtime/npm-cache-kaob`) + `prisma generate` + branch `feat/001-ventas-online-real` desde `main`
- [x] T002 Baseline verificado: `npx tsc --noEmit` = 0 errores antes de cambios

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, validaciones y el fix E2E-01 — nada de las historias arranca sin esto.

- [x] T003 [P] Fix E2E-01: añadir `screens: { xs: '400px' }` en `theme.extend` de `tailwind.config.js` (beneficia `app/ventas/nueva/VentaClient.tsx:602,750`; FR-012)
- [x] T004 Añadir a `prisma/schema.prisma`: enum `EstadoPedidoOnline`, modelo `Pedido` y `PedidoItem` según `data-model.md` (Campos D1/D2/D3; sin tocar modelos existentes)
- [x] T005 Generar migración SQL SIN conectar BD: `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/<YYYYMMDD>_pedidos_online/migration.sql` + `migration_lock.toml` si la carpeta no existe; registrar en la carpeta del feature
- [x] T006 [P] Añadir a `lib/validations.ts`: `pedidoOnlineSchema` y `cambioEstadoPedidoSchema` (contratos en `contracts/pedidos.md`)
- [x] T007 Verificar con `npx prisma validate` + `npx tsc --noEmit` tras el schema nuevo

**Checkpoint**: Foundation ready — schema y validaciones listos, apply de migración queda para staging-checkpoint (T019).

---

## Phase 3: User Story 1 - Checkout de tienda crea pedido en BD (Priority: P1) 🎯 MVP

**Goal**: El checkout de `/tienda` persiste un Pedido real con ítems y contacto; WhatsApp sigue disponible con la referencia incluida.

**Independent Test**: Completar checkout y verificar el pedido en BD (`/ventas-online` con auth o query directa) — no depende de US2/US3.

### Implementation for User Story 1

- [x] T008 [US1] Crear `lib/actions/pedidos.ts` con `registrarPedidoOnline` (público, sin `requireAuth`): valida `pedidoOnlineSchema`, `$transaction` crea pedido → ítems con snapshot → `referencia = PED-<YYYYMMDD>-<id>` (D1/D2 de `research.md`; patrón `ActionResult<T>` de `lib/actions/ventas.ts:250`)
- [x] T009 [US1] Modificar `components/tienda/CartDrawerTienda.tsx`: en el submit del checkout llamar `registrarPedidoOnline` primero (D7); en `ok` abrir `wa.me` con el mismo mensaje actual + `Referencia: PED-…`; en fallo mostrar error legible y NO abrir WhatsApp; el botón WhatsApp independiente queda intacto (FR-005)
- [x] T010 [P] [US1] Unit test `tests/pedido-actions.test.ts`: schema zod rechaza carrito vacío / cantidad 0 / celular vacío; test de todas las validaciones sin BD (estilo `tests/auth-basic.test.mjs`)

**Checkpoint**: US1 functional — un checkout de staging genera pedido real consultable con query directa a DB.

---

## Phase 4: User Story 2 - Panel de gestión de pedidos online en el POS (Priority: P2)

**Goal**: `/ventas-online` lista pedidos reales con gestión del ciclo de despacho.

**Independent Test**: Con ≥1 pedido creado por US1, avanzar estado y verificar persistencia de traza — sin depender de US3.

### Implementation for User Story 2

- [x] T011 [US2] Reescribir `app/ventas-online/VentasOnlineClient.tsx` (sustituye demo `PED-1001..1003`, FR-006): filtros por estado, orden `createdAt desc`, formato COP existente (`lib/format.ts`), tarjetas de estado estilo POS actual (DataTable/StatCard de `components/ui/`)
- [x] T012 [US2] Actualizar `app/ventas-online/page.tsx` (RSC): cargar con `listarPedidosOnline` (helper en `lib/actions/pedidos.ts`, select con items count y contacto según `contracts/pedidos.md`); filtros por `searchParams`
- [x] T013 [US2] Añadir a `lib/actions/pedidos.ts`: `actualizarEstadoPedido` y `cancelarPedidoOnline` con `requireAuth`, grafo de transiciones del `data-model.md`, control de concurrencia por estado previo (D3) y `revalidatePath("/ventas-online")`
- [x] T014 [US2] Detalle de pedido y acciones de avance/cancelación en el panel (confirmar la cancelación con Dialog existente); estados entregado/cancelado no muestran acciones (edge del spec)

**Checkpoint**: US1+US2 integrados — checkout→pedido→ciclo de estados funciona end-to-end en desarrollo (BD staging).

---

## Phase 5: User Story 3 - Puesta a cero de datos para lanzamiento (Priority: P3)

**Goal**: Script CLI de purga en 2 niveles, seguro contra producción, validado en staging.

**Independent Test**: Correr `--simular` sobre staging → tabla de conteos; correr real → transaccionales a 0 y catálogo/contactos/Configuracion intactos; sin confirmación → 0 filas.

### Implementation for User Story 3

- [x] T015 [US3] Crear `scripts/purga-datos.ts` (CLI readline según `contracts/purga.md`): parse args (sin nivel→exit 2), guard `DATABASE_URL` (exit 3), guard producción sin `--entorno=produccion` (exit 4), conteos previos, confirmación escrita `PURGAR`, `$transaction` con orden deleteMany de `data-model.md` (15–21 según nivel), reporte final de filas borradas, sin imprimir la cadena de conexión (II de la constitución)
- [x] T016 [P] [US3] Añadir script npm `"purga": "node --experimental-strip-types scripts/purga-datos.ts"` en `package.json`
- [x] T017 [US3] Unit test `tests/purga-guardas.test.ts`: parse args y lógica de guards/confirmación con mocks de `process.env` (sin BD)

**Checkpoint**: US3 listo para validarse en staging (T019), producción queda bloqueada a autorización del propietario.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validación completa y documentación.

- [x] T018 [P] E2E nuevo `tests/e2e/ventas-online-pedido.spec.ts`: checkout→pedido visible en `/ventas-online`; avance `PENDIENTE→EMPACADO`; salto inválido rechazado (escenarios del quickstart.md)
- [ ] T019 (BLOQUEADA: staging no accesible desde esta Mac — aplicar migración y correr E2E en el servidor) Válido en staging: aplicar migración (`npx prisma migrate deploy` con `DATABASE_URL` staging), correr E2E completo incluyendo 13/13 existentes (README.local.md), y validar purga con `--simular` + corrida real en staging
- [x] T020 [P] Documentación: registrar la fase en `CONTEXT.md` (decisiones D1–D8 resumidas) y `README.local.md` (uso de `npm run purga`; nota de que Railway ya no aplica en ese archivo si aparece)
- [ ] T021 (parcial: tsc + npm test + build verdes; E2E suite pendiente del staging) Gates finales: `npm test`, `npx tsc --noEmit`, `npm run build`, suite E2E — cero regresiones
- [ ] T022 Reporte final al propietario con resumen; commit/push/deploy SOLO tras autorización explícita (Constitución I) — producción nunca se purga sin `--entorno=produccion` + confirmación aparte

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: ✅ completado
- **Foundational (Phase 2)**: bloquea US1/US2/US3 (schema + validaciones). T003 (fix E2E-01) es independiente y [P]
- **US1 (Phase 3)**: tras Foundation. MVP
- **US2 (Phase 4)**: necesita T008 (actions base del mismo archivo); el resto de su trabajo es nuevo
- **US3 (Phase 5)**: independiente de US1/US2 salvo orden de borrado el uso del modelo `pedidoItem/pedido` en data-model (necesita T004)
- **Polish (Phase 6)**: depende de todas las historias

### User Story Dependencies

- **US1**: Foundation → T008 → T009 (misma cadena; T010 [P] en paralelo tras T008+T006)
- **US2**: T008 (actions del archivo) → T011 [P]/T012/T013 → T014
- **US3**: T004 → T015 → (T016 [P], T017 [P])
- **Polish**: T018 [P] puede escribirse tras T014; T019–T022 al final

### Parallel Opportunities

- T003 (Tailwind) en paralelo con todo Phase 2
- T006, T016, T017, T018, T020 en paralelo con sus cadenas de dependencias
- Un solo agente ejecuta secuencialmente por orden P1→P2→P3

---

## Implementation Strategy

### MVP First (US1)

1. ✅ Setup + ✅ Foundation
2. T008–T010 → **STOP and VALIDATE**: checkout en dev (+staging T019 parcial) genera pedido
3. Recién entonces US2

### Incremental Delivery

1. Foundation → US1 (MVP: pedidos en BD) → US2 (gestión en panel) → US3 (purga) → Polish
2. Cada checkpoint prueba la historia de forma independiente (quickstart.md)

### Notas de cierre 2026-11-08
- Build local verde (route list completo); purga tests 15/15; tsc limpio.
- E2E staging y `migrate deploy` pendientes de acceso al entorno del servidor (README.local.md).

### Stop-gates de seguridad (constitución)

- Nada se commitea sin T021 verde y confirmación del propietario (T022)
- ninguna corrida real de purga apuntando a producción sin flag ni doble confirmación (contracts/purga.md)
