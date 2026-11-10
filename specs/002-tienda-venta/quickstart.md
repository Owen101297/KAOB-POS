---
description: "Qué validar en staging tras implementar pagos + rediseño"
---

# Quickstart: Validación completa (staging aislado)

## 0. Precondiciones
- Env vars de staging con llaves TEST de Wompi (`pub_test_*`, `prv_test_*`) y Bold (test key) en Coolify.
- Sin llaves live en repo; env vars de tests gitignoreados.

## 1. pagos (US1)
```bash
# Unit
node --experimental-strip-types --test tests/pagos-adapters.test.mjs
# debe validar: firma webhook (HMAC), mapeo de estados, idempotencia

# E2E (nuevo file)
npx playwright test tests/e2e/pagos-tienda.spec.ts
# • checkout tarjeta Wompi sandbox → redirige → webhook → pedido PAGADO
# • Addi: documento → PagoVenta con desembolsado=false → aparece en /bancos/plataformas
# • fiado con cupo insuficiente → error legible, sin pedido
# • contraentrega → pedido Pendiente con pago EN_TRANSITO
```

## 2. prendas (US2)
- Crear prenda en POS → aparece en `/tienda` (< 5s)
- Desactivar → desaparece de vitrina y búsquedas

## 3. rediseño (US3)
- `npm run build`
- Lighthouse móvil `/tienda` ≥ 90 (Chrome DevTools, staging)
- Capturas desktop/móvil del hero, showcase, cards, trust

## 4. Regresiones
```bash
npx playwright test tests/e2e
node --experimental-strip-types --test tests/
npx tsc --noEmit
```
