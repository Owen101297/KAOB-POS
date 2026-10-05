# Acceso protegido de KAOB-POS

## Configuración

La aplicación usa autenticación HTTP Basic, administrada por el navegador. En Coolify, agrega estas variables a la aplicación y vuelve a desplegar:

- `KAOB_POS_AUTH_USER`: usuario compartido del POS.
- `KAOB_POS_AUTH_PASSWORD`: contraseña única de al menos 16 caracteres.

El nombre de usuario no puede contener `:` (separa usuario/contraseña en HTTP Basic).

Configúralas antes de exponer el servicio y usa siempre HTTPS. En producción, las rutas privadas sin HTTPS responden `426`; detrás de Coolify, el proxy debe enviar `X-Forwarded-Proto: https`. Si una variable falta en producción, el POS privado responde `503` y no queda abierto. En desarrollo local se permite acceso sin credenciales únicamente cuando ambas variables están vacías.

No copies valores reales a Git, `.env.example`, tickets o reportes. En local, usa el `.env` ignorado por Git.

## Alcance

- Exige autenticación en las páginas internas, solicitudes de Server Actions y rutas de Excel.
- Cada Server Action y las dos rutas de Excel vuelven a comprobar la credencial en servidor; ocultar una página no se toma como control de acceso.
- Mantiene `/tienda` pública y deja `/api/health` disponible para comprobaciones. Los archivos estáticos públicos también siguen accesibles.
- La consulta pública de la tienda selecciona solo los campos que necesita y entrega existencias agregadas por variante, sin costo, mínimo ni desglose por bodega.

## Limitaciones actuales

Es una sola identidad compartida: cualquier persona autenticada tiene los mismos permisos administrativos. No hay cuentas individuales, roles, cierre de sesión de aplicación ni atribución fiable de auditoría por persona. El navegador gestiona las credenciales Basic; para salir, cierra la sesión del navegador o elimina sus credenciales guardadas. Antes de dar acceso al personal de caja, la fase siguiente debe incorporar cuentas y permisos por rol.

## Verificación manual en staging

1. En una ventana privada, abrir `/` y `/api/excel/exportar` debe pedir autenticación; cancelar o enviar credenciales incorrectas debe bloquear el acceso.
2. Con las credenciales de staging, las páginas internas y la exportación deben responder. No uses datos reales como prueba.
3. `/tienda` debe seguir visible sin autenticación y no debe incluir campos de costo, umbral mínimo ni cantidades desglosadas por bodega en los datos entregados al navegador.
4. `/api/health` debe seguir respondiendo sin autenticación; puede indicar que la base de datos está disponible o no.

Estas verificaciones deben hacerse en staging con información ficticia. No se despliega esta fase automáticamente a producción.
