# Constitución Homelab 0Z1A (global, todos los proyectos)

Fuente canónica de operación. La capa local de cada repo (`constitution-local.md`)
añade stack y particularidades; ante contradicción, esta capa global manda en
operación y despliegue.

## I. Ramas y aprobación (NO NEGOCIABLE)

- `main` = producción, `staging` = pruebas, `feat/*` = trabajo en curso.
- Nada entra a `main` sin revisión del propietario en staging.
- Ningún `git commit` / `git push` a GitHub sin confirmación explícita del
  propietario. Los cambios quedan en rama local hasta su aprobación.

## II. Secretos (NO NEGOCIABLE)

- Nunca en chat, salidas, Git ni documentación: ni tokens, ni KEY/TOKEN, ni passwords.
- Las credenciales viven en `/srv/homelab/credentials/` (solo root) y la bóveda.
- Verificar sin mostrar valores (hashes, conteos, códigos de estado).

## III. Despliegue seguro

- Un servicio a la vez; conservar el tag/imagen anterior para rollback.
- Tags inmutables (`staging-<sha>` / `prod-<sha>`); nunca reutilizar `latest`.
- Producción primero: sin reinicios ni redeploys de producción sin confirmación.
- Todo cambio de producción se registra en `homelab-ops/REGISTRO.md`
  (una línea por cambio, sin secretos).
- Staging se apaga cuando nadie lo usa; ningún dato real en staging.

## IV. Verificación antes de declarar listo

- Probar ejecutando: builds que compilan, tests que pasan, endpoints que
  responden. Nada de "debería funcionar".
- Toda feature se prueba en staging antes de producción.
- Los tests que ya existen deben seguir pasando (cero regresiones).

## V. Simplicidad y compatibilidad

- Preferir open source; nada de pago sin aprobación explícita.
- No duplicar servicios (un solo plano de gestión por responsabilidad).
- Cambios compatibles hacia atrás salvo aprobación expresa.
- Empezar simple; documentar decisiones en el repo, no solo en el chat.
