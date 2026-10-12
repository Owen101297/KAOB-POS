# KAOB en Coolify

Staging contiene el POS y PostgreSQL existentes. Production está preparado desde GitHub y detenido, con autodespliegue desactivado. La rama preparada codex/kaob-coolify-staging incluye Docker, autenticación, corrección del dashboard y CI; permanece local hasta aprobar su publicación. main todavía no contiene estos cambios.

Agenda y tareas del proyecto están en Nextcloud, calendario KAOB. n8n verifica manualmente POS, base y agenda sin modificar datos. El monitor existente comprueba disponibilidad cada cinco minutos; no se añade otro monitor periódico. El portal privado reúne estos accesos.

Secretos DATABASE_URL, KAOB_POS_AUTH_USER y KAOB_POS_AUTH_PASSWORD se configuran en Coolify, nunca en Git ni en la imagen. El Dockerfile genera Prisma y compila; no migra ni rellena datos automáticamente. El compose de deploy corresponde al staging local; production usará la aplicación Git y una base identificada durante el ensayo.

Para retirar Railway: identificar servicios y datos vigentes, obtener un dump consistente y archivos, restaurar en una base separada de ensayo, comparar tablas/cantidades y probar ventas, clientes, inventario, caja y reportes. Verificar acceso definitivo y recuperación antes de cambiar el tráfico y retirar servicios. Railway aún no está cancelado ni eliminado.

Pruebas: node --experimental-strip-types --test tests/auth-basic.test.mjs; npx prisma generate; npx tsc --noEmit; npm run build.
