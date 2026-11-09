# Quickstart: Validación de Ventas-online real + Puesta a cero

**Feature**: `specs/001-ventas-online-real` | **Fecha**: 2026-11-08

## Prerrequisitos

```bash
npm ci --cache /Users/owen/0z1a/homelab/.runtime/npm-cache-kaob   # caché local; ~/.npm tiene archivos con dueño root
npx prisma generate
```

## Verificación de build (gates estáticos)

```bash
npx tsc --noEmit        # 0 errores
npm run build           # lint + typecheck + build Next
```

## Pruebas unitarias / integración

```bash
npm test                                        # suite existente (auth-basic etc.)
```

## Pruebas E2E contra staging

Requisitos según `README.local.md`: imagen staging corriendo por Coolify, Caddy TLS en `127.0.0.1:3100`, `.env.e2e` con `KAOB_E2E_AUTH_*`.

```bash
npx playwright test tests/e2e                   # 13/13 existentes sin regresarión
npx playwright test tests/e2e/ventas-online-pedido.spec.ts
```

Escenarios esperados del nuevo archivo:

1. Checkout en `/tienda` con datos de contacto y 1–2 prendas → pedido aparece en `/ventas-online` (tras Basic Auth) con su `PED-<fecha>-<id>` y total correcto.
2. Cambio de estado `PENDIENTE → EMPACADO` → el badge del pedido se actualiza con traza de actor/fecha.
3. Al pedido `EMPACADO`, se niega el salto directo `→ ENTREGADO`; `EN_CAMINO → ENTREGADO` sí pasa.

## Prueba de la purga (SOLO staging / datos aislados)

1. Aislar la BD objetivo: exportar `DATABASE_URL` del contenedor staging (ver `README.local.md`; nunca producción).
2. Simulación primero:

```bash
npm run purga -- --nivel=transaccional --simular
```

Esperado: tabla de conteos, `0 filas` borradas.

3. Confirmar y ejecutar de verdad; correr de nuevo un conteo y verificar: tablas transaccionales = 0; catálogo y contactos intactos; residuos `E2ECAT-*` etc. = 0.
4. Nivel cero (staging): tras ejecutar, solo `Configuracion` (+ `Bodega`) sobrevive del dominio de negocio.
5. Seguridad: correr sin escribir `PURGAR` correctamente → código 1 y `0 filas`; correr sin `DATABASE_URL` → código 3.

**Nunca ejecutar la purga contra producción sin autorización y sin `--entorno=produccion` (contract `contracts/purga.md`)`.
