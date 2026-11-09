# Contract: CLI Puesta a cero de datos

**Feature**: `specs/001-ventas-online-real` | **Date**: 2026-11-08

Script: `scripts/purga-datos.ts` | Exposición: `npm run purga -- [flags]` | Entorno: Node ≥ 26 (`--experimental-strip-types`), Prisma Client con `DATABASE_URL` del shell.

---

## Interfaz

```bash
npm run purga -- --nivel=transaccional     # conservadores: catálogo + contactos intactos
npm run purga -- --nivel=cero              # además vacía catálogo y contactos (FR-010)
npm run purga -- --nivel=transaccional --simular   # solo conteos, 0 filas borradas
```

Sin `--nivel` → muestra ayuda y sale con código 2 (no es válido omitir para evitar accidentes).

**Simulación implícita**: cualquier corrida real muestra primero la tabla de conteos por tabla objetivo (`registro: pendiente de borrar`) y exige confirmación escrita: la palabra exacta `PURGAR` por teclado (readline). Si la respuesta no coincide: sale con código 1 y **0 filas afectadas** (FR-011 / SC-005).

---

## Comportamiento

1. Lee `DATABASE_URL` del entorno. Ausente → aborta (código 3, mensaje claro, nada tocado).
2. Conecta y evalúa el entorno: si el host/base coincide con la configuración de producción conocida y no hay `--entorno=produccion`, aborta con aviso (código 4). Con el flag, pide doble confirmación escrita (`PURGAR-PRODUCCION`).
3. Lista conteos por tabla objetivo (orden del `data-model.md`).
4. Exige confirmación escrita.
5. Ejecuta los `deleteMany` en `$transaction` en el orden definido (hoja→raíz). Residuos E2E del catálogo (`E2EE*`, `INK-*`, `E2ECAT-*`, `E2EGT-*`) se incluidos tras el nivel elegido (FR-008).
6. Imprime tabla final de filas eliminadas por tabla (debe coincidir con los conteos de 3) y `exit 0`.

En BD ya vacía → corrida exitosa con `0` en todas las filas (edge del spec).

**Nunca**: imprime la cadena `DATABASE_URL`; borra algo sin confirmación; toca `Configuracion` ni `Bodega` (aun en nivel cero — decisión documentada en data-model.md).

---

## Códigos de salida

| Código | Significado |
|---|---|
| 0 | Purga ejecutada o simulación mostrada con éxito |
| 1 | Confirmación escrita incompleta/incorrecta (`0 filas`) |
| 2 | `--nivel` ausente/inválido o error de argumentos |
| 3 | Sin `DATABASE_URL` / no hay conexión |
| 4 | Entorno producción sin flag explícito |
| 5 | Error de BD en transacción (sin commit) |
