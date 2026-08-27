# KAOB POS - Context for Continuation (Antigravity)

## Project Overview
**Sistema POS & Portal E-Commerce para tienda de ropa en Colombia** - Next.js 14 + PostgreSQL (Railway) + Prisma ORM
- **Marca Oficial**: **KΛOB MODERN WEAR** (Isotipo circular KA + Monocromo Streetwear Luxury)
- **Repositorio**: https://github.com/Owen101297/KAOB-POS.git
- **Rama develop**: CI/CD → staging (railway.app)
- **Rama main**: CI/CD → production (railway.app)
- **Stack**: Next.js 14.2.35, React 18, TypeScript, Tailwind CSS, Prisma 6.19.3, exceljs, zod
- **MCP Servers Conectados**: `21st` (UI Components & Design), `higgsfield` (AI Fashion Studio & Assets), `firebase-mcp-server`.
- **UI Components**: DataTable, Dialog, Select, Button, Card, Badge, PageHeader, EmptyState, StatCard (shadcn-style)
- **Server Actions pattern**: `"use server"`, zod validation, `ActionResult<T>`, `revalidatePath`, `$transaction`

## Infrastructure (Railway)
- **Project**: `pos-system` (f4c69f6b-5277-4cf9-ba99-3365d5fa4e23)
- **PostgreSQL**: 1 servicio con volúmenes, PGDATA `/var/lib/postgresql/data/pgdata`
- **Environments**:
  - **Production** (main): 6cfdc1e4-54c7-4814-99ce-6ba84b207259 → https://app-production-b081.up.railway.app
  - **Staging** (develop): 605c228b-ddef-4e9c-89a9-58e871b2908e → https://app-staging-61f4.up.railway.app
- **Deploy**: preDeployCommand `npx prisma migrate deploy`, healthcheck `/api/health`
- **Secrets**: `DATABASE_URL` por entorno, shadow DB para migraciones

---

## Phase Completion Status

### ✅ Fase 0 - Infraestructura Base
- Git init, Railway project + Postgres ×2, Prisma bootstrap, `/api/health`, CI/CD GitHub.
- Next.js security fix 14.2.3 → 14.2.35. Ambos entornos live con `/api/health` → 200.

### ✅ Fase 1 - Catálogo e Inventario Retail
- **Schema**: Bodega, Marca, Categoria (jerárquica), GrupoTalla, Talla, Color, Producto, Variante, StockBodega, MovimientoInventario, Traslado.
- **Acciones**: `catalogos.ts`, `productos.ts`, `inventario.ts`, `excel.ts`.
- **UI**: `/configuracion/catalogos`, `/productos`, `/inventario`, `/traslados`, `/movimientos`, `/lista-precios`.
- **Mejoras**: Edición rápida de stock en inventario (con chips de cálculo rápido `+1`, `+5`, `-1`, `-5`), selección múltiple y eliminación masiva de productos.

### ✅ Fase 2 - Contactos
- **Schema**: Cliente (CC/NIT/OTRO, cupo/días crédito), Proveedor, Vendedor (comisión%), Domiciliario.
- **UI**: `/clientes`, `/proveedores`, `/vendedores`, `/domiciliarios`.

### ✅ Fase 3 - Núcleo POS + Caja Mínima
- **Schema**: Venta, VentaItem, PagoVenta, SesionCaja, MovimientoCaja.
- **Acciones**: `ventas.ts`, `caja.ts`.
- **UI**: `/ventas/nueva` (POS completo con pagos mixtos, atajos de billetes colombianos, escáner de cámara móvil/pistola y ticket 80mm).

### ✅ Fase 4 - Histórico y Operaciones
- **UI `/ventas`**: Histórico completo de ventas, métricas del día, detalle, anulación con reversión de stock y reimpresión de tickets.
- **UI `/remisiones`**: Listado de remisiones, detalle, conversión a venta con cobro y anulación.
- **UI `/cotizaciones`**: Listado de cotizaciones, detalle, conversión a venta con descuento de stock y anulación.

### ✅ Fase 5 - Arqueo y Caja Completa
- **UI `/caja/ingreso`**: Movimientos manuales de efectivo (`INGRESO_BASE`, `RETIRO`, `SUPLIDO`, `OTRO`).
- **UI `/caja/cerrar`**: Calculadora de billetes/monedas, arqueo ciego, cálculo de descuadre y cierre de turno.
- **UI `/caja/cierres`**: Historial de turnos de caja cerrados con badges de auditoría y reporte detallado.

### ✅ Fase 6 - Compras y Proveedores
- **Schema**: Compra, CompraItem, PagoCompra, OrdenCompra, OrdenCompraDetalle.
- **UI `/compras/documento-soporte`**, `/compras/historico-doc-soporte`, `/ordenes-compra`.

### ✅ Fase 7 - Crédito y Cartera de Clientes
- **Schema**: CreditoCliente, AbonoCredito.
- **UI `/creditos`**: Dashboard de cartera con semáforo de morosidad, abonos con ingreso a caja y recibo térmico de 80mm.

### ✅ Fase 8 - Reportes e Informes Gerenciales
- **UI `/informes`**: Ventas y Rendimiento, Utilidad Bruta (Ingresos vs COGS), Rotación y Top Sellers, exportación Excel y PDF.

### ✅ Fase 9 - Fidelización, Plan Separe y Promociones
- **Schema**: PlanSepare, PlanSepareItem, AbonoPlanSepare, MovimientoPuntos, Promocion, GiftCard.
- **UI `/plan-separe`**: Apartados de mercancía con reserva de existencias, abonos y cancelación con devolución de stock.
- **UI `/puntos`**, `/promociones`, `/gift-cards`.

### ✅ Fase 10 - Auditoría, Bancos, Conciliaciones y Gastos
- **UI `/configuracion`**, `/auditoria`, `/bancos`, `/bancos/movimientos`, `/bancos/conciliaciones`, `/gastos`.

### ✅ Fase 11 - Identidad de Marca KAOB MODERN WEAR
- **Branding Assets**:
  - `public/brand/isotype.svg` (Monograma circular KA).
  - `public/brand/logo.svg` (Wordmark geométrico KΛOB MODERN WEAR).
  - `app/icon.svg` (Favicon oficial).
  - Encabezados térmicos de 80mm en tickets de venta y apartados.
  - Topbar con avatar monograma y enlace directo a la tienda.

### ✅ Fase 12 - Portal E-Commerce Autónomo (`/tienda`)
- **Aislamiento Total (`Shell.tsx`)**: Al entrar a `/tienda`, la pantalla carga 100% limpia sin el Sidebar ni el Topbar del POS.
- **Top Announcement Bar**: Marquee animado con beneficios y envíos a Colombia.
- **Segmentación por Sexo y Colección**:
  - 👗 **Dama**: Prendas casuales, tops, conjuntos y vestidos.
  - 👕 **Caballero**: Camisetas oversize heavyweight, hoodies y streetwear.
  - ⚡ **Unisex & Urban**: Siluetas neutras y boxy fit.
  - 🎒 **Accesorios**: Gorras estructuradas y complementos.
- **Bento Grid de Colecciones (`CategoryGridBento.tsx`)**: Cuadrícula visual de acceso directo a colecciones.
- **Tarjetas de Producto con Ganchos de Venta (`ProductCardTienda.tsx`)**: Muestras de color (*swatches*), selector de tallas en tiempo real, badges de urgencia (*"Últimas unidades"*, *"Más Vendido"*).
- **Modal de Vista Rápida (`ProductDetailModal.tsx`)**: Zoom, descripción y selección ágil.
- **Bolsa de Compras Deslizable (`CartDrawerTienda.tsx`)**: Barra de progreso para envío gratis y checkout en 1 clic formateado para WhatsApp.
- **Social Proof & Confianza (`SocialProofSection.tsx`)**: Testimonios de clientes 5 estrellas y sellos de garantía.
- **Footer Oficial (`FooterTienda.tsx`)**: Enlaces, políticas y contacto de WhatsApp directo.

### ✅ Fase 13 - Despacho Online en POS (`/ventas-online`)
- Panel de control en el POS para gestionar pedidos recibidos por la tienda web con estados (*Pendiente*, *Empacado*, *En camino*, *Entregado*).

### ✅ Fase 14 - Robustez en Eliminación y Filtro de Categorías
- **Limpieza en Cascada de Productos**: En `lib/actions/productos.ts`, `eliminarProducto` y `eliminarMultiplesProductos` limpian automáticamente registros huérfanos de pruebas (ítems de planes separe cancelados, ventas/compras anuladas) permitiendo borrar productos sin bloqueos de base de datos.
- **Filtro de Categorías Activas**: `listarCategorias(true)` en POS (`/ventas/nueva`) y Tienda (`/tienda`) para mostrar únicamente las categorías que contienen productos reales activos (ocultando categorías plantilla como `COMPLETO`, `PRENDA INFERIOR`, `PRENDA SUPERIOR`).

### ✅ Fase 15 - Cockpit POS & Modal de Cobro Multimétodo 21st.dev
- **Arquitectura Cockpit en `/ventas/nueva`**: Catálogo interactivo de alta densidad, swatches de tallas/colores en vivo, carrito lateral compacto y atajos rápidos.
- **Modal de Cobro en 2 Columnas**: 5 métodos limpios (Efectivo, Tarjeta/Datáfono, Transferencia Bancaria, Plataforma Digital BNPL, Fiado/Crédito Directo).
- **Integración BNPL & Plataformas de Crédito**: Gestión de Addi, Sistecrédito y plataformas dinámicas con dinero en tránsito, liquidación de lotes y conciliación bancaria.
- **Buscador & Registro de Clientes en Vivo**: Búsqueda por CC/NIT o nombre y creación ágil de clientes directamente desde el modal de cobro.
- **Teclado Táctil & Billetes**: Teclado numérico táctil integrado, botones de denominaciones colombianas y cálculo automático de cambio express.

### ✅ Fase 16 - Responsividad Global 100% y Diseño Móvil
- **Adaptabilidad Total**: Optimización en todos los módulos del sistema para teléfonos, tablets, laptops y pantallas táctiles POS de mostrador.
- **Sidebar Móvil Deslizable**: Menú colapsable con backdrop táctil para navegación fluida en celulares.
- **Tablas y Formularios Adaptativos**: DataTable con scroll horizontal protegido y encabezados legibles en pantallas reducidas.
- **Modal de Tickets Térmico 80mm**: Diseño blanco puro de alto contraste, legible en cualquier resolución y eliminación de impresión automática no deseada.

### ✅ Fase 18 - Autenticación, Roles, Migraciones y Despliegue CI/CD Staging
- **NextAuth v5 (Auth.js)**: Implementación completa de sesión con estrategia JWT, credenciales seguras con `bcryptjs` y soporte condicional para Google OAuth.
- **Modelos de Autenticación & Roles**: `Usuario`, `Account`, `Session`, `VerificationToken` y enum `Rol` (`ADMIN`, `GERENTE`, `CAJERO`, `VENDEDOR`, `BODEGUERO`).
- **Migración SQL en Railway**: Generación y aplicación exitosa de la migración [`20260826082000_add_auth_tables`](file:///f:/SISTEMAS-OWEN/KAOB-POS/prisma/migrations/20260826082000_add_auth_tables/migration.sql) en PostgreSQL de staging.
- **Auto-Aprovisionamiento & Resiliencia**:
  - Auto-creación bajo demanda del usuario Admin inicial (`admin@kaob.com` / `Admin123!`).
  - Búsqueda de email insensible a mayúsculas/minúsculas (`mode: "insensitive"`) y limpieza de espacios.
  - Exclusión de `/api/health` en el middleware para garantizar que el healthcheck de Railway pase exitosamente.
  - Corrección del filtro en `dashboard.ts` (remoción de `bodegaId` en consultas de `Gasto`).
- **UI `/login`**: Formulario oficial de inicio de sesión con branding KΛOB, toggle de contraseña y retroalimentación de errores.
- **Estado Actual de Railway**: Despliegue en staging (`develop`) en estado **SUCCESS**, base de datos migrada y login 100% operativo.

### ✅ Fase 19 - Motor de Conversión (CRO) en la Tienda Online

- **Schema**: `PedidoOnline` / `PedidoOnlineItem` (pedidos reales capturados en el checkout web, antes de abrir WhatsApp) y `LeadTienda` (contactos capturados por exit-intent para recuperación manual). Migración [`20260826150000_add_tienda_cro_pedidos_leads`](file:///f:/SISTEMAS-OWEN/KAOB-POS/prisma/migrations/20260826150000_add_tienda_cro_pedidos_leads/migration.sql).
- **Acciones**: `lib/actions/tienda.ts` — `crearPedidoOnline`, `listarPedidosOnline`, `actualizarEstadoPedidoOnline`, `registrarLeadTienda`, `listarLeadsTienda`, `marcarLeadContactado`, `obtenerVentasPorProducto` (contador de vendidos reales), `obtenerActividadRecienteVitrina` (prueba social basada 100% en pedidos reales, sin datos inventados), `obtenerPromocionDestacada`.
- **`/ventas-online` ahora es real**: dejó de usar datos mock; lee `PedidoOnline` de la base de datos y agrega una pestaña **Leads de Recuperación** para contactar manualmente a visitantes que recibieron el cupón de salida.
- **Checkout de la tienda (2 pasos, sin pasarela real)**: al enviar el pedido por WhatsApp, `CartDrawerTienda` ahora también lo persiste como `PedidoOnline` (con método de pago/financiación elegido), visible de inmediato en `/ventas-online`.
- **Financiación visible (`FinanciacionCalculadora.tsx`)**: calculadora de cuotas (Plan Separe / Addi / Sistecrédito) en tarjeta de producto, modal de detalle y carrito, con aviso de que el valor es estimado y sujeto a aprobación.
- **Urgencia y escasez con datos reales**: badge "vendidos este mes" (`obtenerVentasPorProducto`), banner de oferta flash con cuenta regresiva (`OfertaFlashBanner.tsx`) ligado a `Promocion`, toast de actividad reciente (`RecentPurchaseToast.tsx`) que solo se muestra si hay pedidos reales — nunca simula compras falsas.
- **Recuperación de visitantes**: `ExitIntentModal.tsx` detecta intención de salida y ofrece 10% de descuento a cambio de WhatsApp/correo, guardado como `LeadTienda` para seguimiento manual.
- **Descubrimiento**: búsqueda predictiva con sugerencias en vivo en `NavbarTienda`, y franja "Vistos recientemente" (`RecentlyViewedTienda.tsx`) basada en `localStorage`.
- **Confianza en checkout**: franja de métodos de pago aceptados (efectivo, Nequi/Daviplata, Wompi, Addi, Sistecrédito, Plan Separe) en el footer y en el carrito.
- **Nota de despliegue**: la migración se escribió a mano (sin acceso a `DATABASE_URL` en este entorno) siguiendo el estilo exacto de Prisma; se aplicará automáticamente en el próximo despliegue vía `prisma migrate deploy` (Railway).

### ✅ Fase 20 - Rediseño Editorial + Panel de Fotos con Railway Buckets

- **Infraestructura (Railway MCP)**: se creó un bucket de almacenamiento S3-compatible `kaob-tienda-fotos` en cada entorno (`production` y `staging`, este último con nombre autogenerado por Railway). Las credenciales (`BUCKET_NAME`, `BUCKET_ACCESS_KEY_ID`, `BUCKET_SECRET_ACCESS_KEY`, `BUCKET_REGION`, `BUCKET_ENDPOINT`) se inyectaron como variables de entorno del servicio `app` en ambos entornos vía referencias `${{bucket.VAR}}`, documentadas también en `.env.example` para desarrollo local.
- **Schema**: `ProductoImagen` (galería por producto, con `colorId` opcional para asociar una foto a un color específico, `orden` y `esPrincipal`). Migración [`20260826200000_add_producto_imagenes`](file:///f:/SISTEMAS-OWEN/KAOB-POS/prisma/migrations/20260826200000_add_producto_imagenes/migration.sql).
- **Almacenamiento (`lib/storage.ts`)**: cliente S3 (`@aws-sdk/client-s3`) para subir/eliminar/leer objetos. Los buckets de Railway son privados (no hay modo público), así que las fotos se sirven mediante un proxy propio `app/api/media/[...key]/route.ts` (excluido del middleware de auth, con `Cache-Control: immutable` de 1 año) en vez de URLs firmadas que expiran.
- **Subida (`app/api/upload/route.ts`)**: endpoint protegido (requiere sesión) que valida tipo/tamaño (máx. 8MB, JPG/PNG/WEBP/GIF), sube el archivo al bucket y crea el registro `ProductoImagen`.
- **Acciones**: `lib/actions/productos.ts` — `eliminarImagenProducto`, `marcarImagenPrincipal`, `reordenarImagenesProducto`, `asignarColorImagen`. `listarProductos`/`obtenerProducto` ahora incluyen `imagenes`.
- **Panel de gestión de fotos (`components/productos/GestionFotosModal.tsx`)**: se abre desde `/productos` (ícono de imagen por fila). Arrastrar-y-soltar o seleccionar archivos, galería con reordenar, marcar portada, eliminar y asignar una foto a un color específico de la variante.
- **La tienda ahora muestra fotos reales**: `ProductCardTienda`, `ProductDetailModal` y `RecentlyViewedTienda` priorizan la foto del color seleccionado, luego la portada, y solo si no hay ninguna foto cargada usan el placeholder de monograma (nunca se pierde funcionalidad si un producto aún no tiene fotos).
- **Rediseño visual (dirección híbrida)**: fondo cálido tipo editorial (`#F8F5F0`) en el cuerpo de la tienda, tipografía serif `Playfair Display` (`font-display`, cargada solo en `/tienda` vía `app/tienda/layout.tsx`) para titulares, con Navbar y Footer negros como anclas fuertes de marca KAOB. `HeroTienda` y `CategoryGridBento` pasaron de fondo oscuro a paleta clara premium con acentos CTA negros.
- **Nota de despliegue**: igual que en fases anteriores, la migración se escribió a mano (sin `DATABASE_URL` en este entorno) y se aplicará sola en el próximo `prisma migrate deploy` de Railway. Las variables del bucket ya están configuradas en Railway (production y staging), así que el panel de fotos debería funcionar en cuanto se despliegue.

### ✅ Fase 21 - Rediseño Editorial UI/UX Pro Max con Jerarquía de 9 Secciones e Insignias SVG de Pagos
- **Jerarquía Editorial de 9 Secciones**: `<HeroBanner />` (50/50), `<TrustBadges />` (3 cols), `<CategoryGrid />` (3:4), `<ProductSection title="NEW ARRIVALS" />` (6 cols), `<SplitBanner />` (asimétrico beige), `<ProductSection title="BEST SELLERS" />` (6 cols), `<JournalSection />` (3 cols con modal), `<NewsletterForm />` (lead capture), `<FooterTienda />` (sellos SVG).
- **Insignias SVG de Pagos (`PaymentMethodsBadges.tsx`)**: Addi, Sistecrédito, Nequi, Bancolombia, Visa, Mastercard, Plan Separe. Exclusión total de contraentrega.

### ✅ Fase 22 - Matriz Bidimensional de Navegación (Género × Categorías Reales de Inventario)
- **Sincronización 100% Automática de Inventario**:
  - `CategoryGrid.tsx`: Mapea dinámicamente las categorías reales de la base de datos (`Categoria`) con conteo de prendas activas y foto de portada automática del primer producto de la categoría.
  - `NavbarTienda.tsx`: Menú desplegable dinámico de "CATEGORÍAS" que lista todas las categorías activas en tiempo real.
- **Navegación de Doble Nivel (Género × Subcategorías)**:
  - **Nivel 1 (Macro)**: `[ TODO ] [ MEN ] [ WOMEN ] [ OVERSIZE ] [ ACCESSORIES ]`.
  - **Nivel 2 (Subcategorías Dinámicas)**: Al seleccionar un género (ej: `MEN`), calcula en tiempo real qué categorías de inventario contienen ropa para hombre y muestra chips filtrables: `[ Todo Men (24) ] [ Camisetas (12) ] [ Hoodies (8) ] [ Pantalones (4) ]`.
  - **Breadcrumbs Interactivos**: `INICIO > MEN > HOODIES` con chips de remoción individual para navegación intuitiva.

### ✅ Fase 23 - Datos de Pago Inmediatos, Mensajería VIP Concierge y WhatsApp Oficial
- **Número Oficial Configurable**:
  - Establecido teléfono oficial por defecto: `3136332887` (`573136332887`).
  - Sincronización en tiempo real con `db.configuracion.telefono` y cuentas bancarias activas (`db.cuentaBancaria`).
- **Tarjetas Interactivas de Pago en Carrito (`CartDrawerTienda.tsx`)**:
  - **Transferencia (Nequi / Bancolombia)**: Tarjetas interactivas con número de cuenta y botón *"Copiar"* de 1 clic con feedback visual.
  - **Addi**: Explicación de 3 cuotas con 0% de interés y generación de link directo.
  - **Sistecrédito**: Instrucciones para validación ágil de cupo con cédula en 30 segundos.
  - **Plan Separe (30%)**: Cálculo dinámico del anticipo del 30% para apartar y congelar la talla por 30 días con datos de Nequi.
- **Mensaje WhatsApp de Alto Nivel ("Concierge VIP")**:
  - Separadores limpios `━━━━━━━━━━━━━━━━━━━━`, cabecera de orden `#KB-XXXX`, desglose jerárquico de prendas (`•`, `└`), destino de despacho y llamada a la acción contextualizada según el método de pago.
- **Atención en 1 Clic desde el POS (`/ventas-online`)**:
  - Botón *"Atender en WA"* con respuestas prediseñadas automáticas por método de pago para que el vendedor responda al cliente en segundos.

### ✅ Fase 24 - Aislamiento de Login, Rediseño Luxury Split-Screen, Sistema RBAC de Roles y Módulo de Usuarios
- **Aislamiento Total del Login (`Shell.tsx`)**: Exclusión de rutas de autenticación (`/login`, `/register`) para renderizar pantalla 100% limpia sin Topbar ni Sidebar del POS.
- **Rediseño Editorial Luxury de Login (`LoginForm.tsx` & `(auth)/layout.tsx`)**:
  - Split-screen: panel de marca KΛOB Modern Wear con isotipo circular, lemas y tarjetas de características; panel derecho con formulario estilizado, toggle de contraseña y **botones de acceso rápido demo (1-clic)** para probar roles al instante (`Admin`, `Gerente`, `Cajero`, `Vendedor`, `Bodeguero`).
- **Sistema Centralizado de Permisos y Protección RBAC (`lib/permissions.ts` & `auth.ts`)**:
  - Matriz de permisos por rol (`ADMIN`, `GERENTE`, `CAJERO`, `VENDEDOR`, `BODEGUERO`).
  - Filtrado dinámico de módulos y submenús en `Sidebar.tsx` con `useSession()`.
  - Protección de rutas en middleware NextAuth con redirección inteligente si el usuario intenta entrar a una sección no autorizada.
- **Panel de Gestión de Usuarios en el POS (`/usuarios`)**:
  - `app/usuarios/page.tsx` protegido para rol `ADMIN`.
  - `components/usuarios/GestionUsuariosClient.tsx`: métricas de usuarios activos, tabla interactiva, modales para crear usuario, editar rol, restablecer contraseña y alternar estado activo/inactivo.

### ✅ Fase 25 - Calculadora Inteligente de Margen y Precios Retail con Semáforo en Vivo
- **Asistencia Financiera en Formulario de Productos (`ProductosClient.tsx`)**:
  - Panel interactivo con cálculo en tiempo real de **Margen Bruto Real (%)**, **Multiplicador (Markup ×)** y **Ganancia Neta por Prenda (COP)**.
  - **Chips de Margen Rápido (1 Clic)**: `50% (×2.0 Mínimo)`, `55% (×2.2 Estándar)`, `60% (×2.5 Premium)`, `70% (×3.3 Accesorios)`.
  - **Redondeo Psicológico Comercial Automático**: Redondea los precios sugeridos a la terminación oficial de moda (`.900` COP) sin requerir cálculo mental.
  - **Semáforo Diagnóstico de Rentabilidad**: Alertas visuales en vivo (Rojo `<45%` margen riesgoso, Amarillo `45-52%` margen moderado, Verde `53-64%` margen retail saludable, Púrpura `≥65%` margen accesorio de alta rentabilidad).
  - **Desglose Opcional de Costo Total (Absorción)**: Campos desplegables para incluir empaque/bolsa KAOB y flete prorrateado en el costo base antes de aplicar margen.

---

## ⏭️ Próximos Pasos y Roadmap

1. **Configuración de Google OAuth (Opcional)**:
   - Configurar `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET` en las variables de Railway si se desea habilitar el botón de Google.
2. **Pruebas Integrales E2E en Staging (`develop`)**:
   - Flujo completo de mostrador: Login como Admin/Cajero → Apertura de caja → Venta Cockpit POS → Métodos de pago (Efectivo, Tarjeta, Addi/Sistecrédito, Fiado) → Ticket térmico → Descuento de stock por variantes → Cierre y arqueo ciego de caja.
   - Flujo de tienda online: Pedidos desde el catálogo e-commerce (`/tienda`) → Conversión a WhatsApp → Despacho en `/ventas-online`.
3. **Facturación Electrónica (DIAN / POS Electrónico)**:
   - Evaluación y conexión con API de proveedor tecnológico para emisión de documentos electrónicos válidos en Colombia.
4. **Módulo de Producción / Taller de Confección (`/produccion`)**:
   - Registro de órdenes de confección, corte, consumo de insumos (telas, avíos) y liquidación de costos de producción.
5. **Puesta a Cero de Base de Datos para Lanzamiento**:
   - Script de purga de datos demo/pruebas para arrancar operaciones oficiales con inventario inicial real.

---

## Commands
```bash
# Desarrollo
npm run dev          # puerto 3000
npm run build        # producción + lint + typecheck
npx prisma migrate dev --name <nombre>
npx prisma generate
npx tsc --noEmit     # verificación de tipos

# Deploy / Flujo Git
git checkout develop && git push origin develop  # despliegue automático a staging (railway)
git checkout main && git push origin main        # despliegue automático a producción (railway)
```

## Contact & Credits
- GitHub: Owen101297
- Railway: owen101297
- Email: owenalvarez97@gmail.com