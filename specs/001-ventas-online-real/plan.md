# Implementation Plan: Ventas-online real con BD + Puesta a cero de datos

**Branch**: `feat/001-ventas-online-real` | **Date**: 2026-11-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-ventas-online-real/spec.md`

## Summary

Convierte el panel demo `/ventas-online` en una gestión real: el checkout de la tienda (`/tienda`) persiste un Pedido con sus ítems (variante exacta, snapshot de descripción/precio) y datos de contacto; el POS gestiona esos pedidos en el ciclo Pendiente → Empacado → En camino → Entregado (con cancelación trazada) conservando el envío por WhatsApp sin regresiones. Añade un script de puesta a cero de datos en dos niveles (transaccional / cero total) con conteos previos, confirmación escrita y abort en producción sin flag explícito. Incluye como tarea rápida el fix E2E-01 (breakpoint `xs` de Tailwind).

## Technical Context

**Language/Version**: TypeScript 5.x / Next.js 14.2 / Node 26 (skills ya usan `--experimental-strip-types` para tests)

**Primary Dependencies**: React 18, Prisma 6.19.3 + PostgreSQL, Tailwind CSS 3.3, zod (patrón `lib/validations.ts`), lucide-react, shadcn-style `components/ui/*`

**Storage**: PostgreSQL vía Prisma (`lib/db.ts`, singleton con log de errores; `DATABASE_URL` por entorno)

**Testing**: Node test runner (`node --experimental-strip-types --test tests/`) + Playwright E2E contra staging (`npx playwright test tests/e2e`, 13 pruebas actuales) + `tsc --noEmit` + `npm run build`

**Target Platform**: Web POS táctil (Next.js SSR/RSC) + tienda pública (`/tienda`), desplegada en Coolify (`kaob-staging.owenai.uk`, `kaob.owenai.uk` bajo Basic Auth salvo `/api/health` y rutas públicas de tienda)

**Project Type**: Web application (monorepo único, estructura `app/` + `lib/`)

**Performance Goals**: Listado de `/ventas-online` responde < 1.5s en staging con menos de 100 pedidos abiertos; checkout registra pedido < 2s

**Constraints**: Sin stock descontado ni Venta generada al crear pedido (v1); sin pasarela de pago; sin commits/push ni despliegue sin autorización del propietario; datos aislados en staging (nada real en pruebas)

**Scale/Scope**: 2 modelos Prisma nuevos (Pedido, PedidoItem) + 1 archivo de actions + 1 panel reescrito + 1 script CLI (~300 líneas) + ajustes menores (Tailwind, `CartDrawerTienda`, Sidebar no cambia, ruta `/ventas-online` ya existe)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Evidencia |
|---|---|---|
| I. Ramas y aprobación (`feat/*`) | ✅ | Rama `feat/001-ventas-online-real`; sin commits todavía; push/merge solo con confirmación del propietario |
| II. Secretos | ✅ | Purga lee `DATABASE_URL` del entorno; nunca imprime la cadena; no hay secretos nuevos en el feature |
| III. Despliegue seguro | ✅ | Nada se despliega en este feature sin autorización; staging con datos aislados; producción solo tras revisión del propietario |
| IV. Verificación antes de declarar listo | ✅ | Gates: `tsc --noEmit`, `npm test`, `npm run build`, suite E2E 13/13 + pruebas nuevas; purga verificada en staging (local/aislado) |
| V. Simplicidad | ✅ | Alcanza el pico (fields de trazas sobre tabla separada; sin tabla `PedidoCambioEstado` v1; WhatsApp reutilizado); sin servicios nuevos ni pagos |
| Particularidad local: cobro/inventario probado en staging antes de `main` | ✅ | El pedido no toca cobro ni stock (supuesto del spec); igualmente toda la feature se valida en staging |

**Post-design re-check**: sin violaciones (ver "Complexity Tracking" vacío).

## Project Structure

### Documentation (this feature)

```text
specs/001-ventas-online-real/
├── plan.md              # Este archivo
├── research.md          # Decisiones de diseño (Fase 0)
├── data-model.md        # Entidades y estados (Fase 1)
├── quickstart.md        # Guía de validación (Fase 1)
├── contracts/           # Contratos de interfaz (Fase 1)
│   ├── pedidos.md       # Server actions de pedidos online
│   └── purga.md         # Interfaz CLI del script de purga
└── tasks.md             # Fase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
app/
├── ventas-online/
│   ├── page.tsx                 # Server component: carga pedidos reales (BD)
│   └── VentasOnlineClient.tsx   # Panel reescrito: lista real, filtros, acciones
├── tienda/                      # Shell público (sin cambios estructurales)
lib/
├── actions/
│   └── pedidos.ts               # registrarPedidoOnline, actualizarEstadoPedido, cancelarPedidoOnline
├── tienda/
│   └── public-productos.ts      # (sin cambios; fuente de snapshot en checkout)
├── validations.ts               # pedidoOnlineSchema, cambioEstadoPedidoSchema
tailwind.config.js               # screens.xs (fix E2E-01)
components/tienda/CartDrawerTienda.tsx  # checkout: llama registrarPedidoOnline + mantiene WhatsApp
scripts/
└── purga-datos.ts               # CLI puesta a cero (2 niveles)
tests/
├── e2e/
│   └── ventas-online-pedido.spec.ts    # E2E: checkout→pedido→ciclo de estados
prisma/
├── schema.prisma                # num EstadosPedidoOnline, model Pedido, model PedidoItem
└── migrations/<date>_pedidos_online/migration.sql
```

**Structure Decision**: Proyecto único Next.js existente; se sigue el patrón dominante (Server Actions en `lib/actions/` con `"use server"`, zod y `ActionResult<T>`, páginas RSC que cargan datos y delegan a Clients). El script de purga vive en `scripts/` junto a los tools de Node del repo y se expone vía `npm run purga`.

## Complexity Tracking

> Sin violaciones de constitución que justificar.
