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

---

## ⏭️ Próximos Pasos y Roadmap

1. **Gestión de Usuarios y Permisos en el POS (`/usuarios`)**:
   - Panel de administración de usuarios para crear cajeros, vendedores y gerentes, asignar roles y restablecer contraseñas.
2. **Configuración de Google OAuth (Opcional)**:
   - Configurar `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET` en las variables de Railway si se desea habilitar el botón de Google.
3. **Pruebas Integrales E2E en Staging (`develop`)**:
   - Flujo completo de mostrador: Login como Admin/Cajero → Apertura de caja → Venta Cockpit POS → Métodos de pago (Efectivo, Tarjeta, Addi/Sistecrédito, Fiado) → Ticket térmico → Descuento de stock por variantes → Cierre y arqueo ciego de caja.
   - Flujo de tienda online: Pedidos desde el catálogo e-commerce (`/tienda`) → Conversión a WhatsApp → Despacho en `/ventas-online`.
4. **Facturación Electrónica (DIAN / POS Electrónico)**:
   - Evaluación y conexión con API de proveedor tecnológico para emisión de documentos electrónicos válidos en Colombia.
5. **Módulo de Producción / Taller de Confección (`/produccion`)**:
   - Registro de órdenes de confección, corte, consumo de insumos (telas, avíos) y liquidación de costos de producción.
6. **Puesta a Cero de Base de Datos para Lanzamiento**:
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