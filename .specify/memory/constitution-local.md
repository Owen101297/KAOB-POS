# Constitución local: KAOB-POS

Capa por proyecto. Complementa la constitución global del homelab
(`.specify/memory/constitution.md`), que manda en operación y despliegue.

## Stack
- Next.js 14.2 + React 18 + Prisma 6.19.3 + Tailwind 3.3. Gestor: npm.
- Base de datos: PostgreSQL (Compose `kaob-production-db` / staging).

## Comandos
- Instalar: `npm ci`. Desarrollar: `npm run dev`. Build: `npm run build`.
- Tests: `npm test` (donde existan). Salud: `GET /api/health`.

## Despliegue
- Dockerfile: `./Dockerfile` (raíz). Imagen: `localhost:5000/kaob-pos:<staging|prod>-<sha12>`.
- Coolify: prod `kaob-production` (`kaob.owenai.uk`, :3312) + staging `kaob-staging`
  (`kaob-staging.owenai.uk`, :3310, bajo demanda, con Access).
- Ramas: `staging` (actual) y `main`. Pipeline runner `pipeline.yml` OK.

## Particularidades
- POS en producción real: cualquier cambio de cobro/inventario exige prueba en
  staging con datos aislados antes del merge a `main`.
- `middleware.ts` permite `/api/health` sin auth; no romper esa excepción.
