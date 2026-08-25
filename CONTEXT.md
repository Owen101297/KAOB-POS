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

---

## ⏭️ Próximos Pasos para Mañana
1. **Pruebas Integrales de Usuario en Producción**:
   - Probar flujo de venta en mostrador (POS) y flujo de compra en la tienda web (`/tienda`).
   - Validar responsive en móvil y escritorio.
2. **Puesta a Cero de Datos de Prueba (Cuando el usuario lo indique)**:
   - Script o procedimiento para limpiar ventas/inventario de prueba y dejar la base de datos limpia para arranque en producción.
3. **Módulo de Producción / Confección de Prendas (`/produccion`)**:
   - Registro de lotes de corte, materias primas (telas/hilos/botones) y costo de confección por prenda.

---

## Commands
```bash
# Desarrollo
npm run dev          # puerto 3000
npm run build        # producción + lint + typecheck
npx prisma migrate dev --name <nombre>
npx prisma generate
npx tsc --noEmit     # verificación de tipos

# Deploy
git push origin main:develop   # staging
git push origin main           # producción
```

## Contact & Credits
- GitHub: Owen101297
- Railway: owen101297
- Email: owenalvarez97@gmail.com