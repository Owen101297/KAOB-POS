# KAOB — código principal y operación local

La carpeta principal es `/home/owen/Projects/KAOB-POS` y la rama de referencia es `main`. Incluye la versión de autenticación, dashboard y Docker revisada en `codex/kaob-coolify-staging`, además de las instrucciones y configuraciones locales existentes. El historial de ambas ramas se conserva.

El worktree `/home/owen/centro/plataforma/releases/KAOB-POS` conserva una versión aislada para staging. No es otra carpeta principal ni debe sobrescribirse durante la sincronización. Preparar una nueva versión de pruebas forma parte de una entrega concreta; no desplegar por actualizar Git.

Producción y staging están administrados por Coolify, con datos y recursos separados. El autodespliegue de producción está desactivado. La configuración local de Caddy conserva el acceso de producción y el Compose conserva su conexión a la red Coolify. No se reiniciaron recursos al unificar el repositorio. Estado y recuperación: `/home/owen/centro/plataforma/migraciones/servicios-coolify/OPERACION.md`.

Secretos DATABASE_URL, KAOB_POS_AUTH_USER y KAOB_POS_AUTH_PASSWORD se configuran en Coolify o en el gestor cifrado, nunca en Git ni en la imagen. El Dockerfile genera Prisma y compila; no migra ni rellena datos automáticamente.

Flujo común: trabajar en una rama, comprobar el cambio, integrar la versión revisada a main y enviarla a GitHub. El servidor recibe avances seguros de main y actualiza las copias de discos; conserva el trabajo local pendiente. `CONTEXT.md` mantiene las decisiones funcionales e historia; las referencias antiguas a Railway o CI necesitan contraste con la operación vigente.

## Comprobaciones

```bash
node --experimental-strip-types --test tests/auth-basic.test.mjs
npx --no-install prisma generate
npx --no-install tsc --noEmit
npm run build
```

## Pruebas E2E (Playwright contra staging)

- Requisitos: la imagen `kaob-pos-local:staging` ejecutándose por Coolify (servicio `KAOB-POS - Staging`), Caddy local con TLS en `127.0.0.1:3100` y credenciales `KAOB_E2E_AUTH_USER` / `KAOB_E2E_AUTH_PASSWORD` en `.env.e2e` (gitignoreado; se toman del env del contenedor staging `app-…` / `fnzik…-app-1`).
- Credenciales: extraer sin imprimir secretos con un env-temporal desde `docker inspect` del contenedor; `.env.e2e` es local.
- Ejecutar la suite completa: `npx playwright test tests/e2e` (POS 9 pruebas + tienda 4; estado 13/13 el 18-10-2026).
- Antes de una corrida completa, limpiar el estado transaccional en staging (devuelve stock, borra ventas/caja): usar el psql del contenedor `opwojqwmmat6uwrsppa5serl` con la secuencia documentada en los scripts de la sesión; no tocar producción.
- Datos generados quedan como residuo E2E (categorías `E2ECAT-*`, grupos `E2EGT-*`, colores `INK-*`, productos `E2EE*`); una purga de transaccionales futura los limpia.
- Defectos conocidos aún abiertos: badge "CAJA ACTIVA" oculto por breakpoint `xs` inexistente en `tailwind.config.js` (E2E-01, cosmético) y `/ventas-online` es demo estática con estados en memoria (no conecta con la BD).

Usar entorno aislado para pruebas. No ejecutar seed, migraciones ni escrituras sobre datos de producción. Los enlaces del proyecto y el procedimiento general están en `/home/owen/Projects/README.md`.
