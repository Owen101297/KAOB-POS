# KAOB POS - Context for Continuation (Antigravity)

## Project Overview
**Sistema POS para tienda de ropa en Colombia** - Next.js 14 + PostgreSQL (Railway) + Prisma ORM
- **Repositorio**: https://github.com/Owen101297/KAOB-POS.git
- **Rama develop**: CI/CD → staging (railway.app)
- **Rama main**: CI/CD → production (railway.app)
- **Stack**: Next.js 14.2.35, React 18, TypeScript, Tailwind CSS, Prisma 6.19.3, exceljs, zod
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
- **Límites trial**: 2 proyectos / 5 servicios

---

## Phase Completion Status

### ✅ Fase 0 - Infraestructura Base
- Git init, Railway project + Postgres ×2, Prisma bootstrap, `/api/health`, CI/CD GitHub.
- Next.js security fix 14.2.3 → 14.2.35.
- Ambos entornos live con `/api/health` → 200.

### ✅ Fase 1 - Catálogo e Inventario Retail
- **Schema**: Bodega, Marca, Categoria (jerárquica), GrupoTalla, Talla, Color, Producto, Variante, StockBodega, MovimientoInventario, Traslado.
- **Enums**: Genero, Calidad (4 niveles), TipoMovimiento.
- **Acciones**: `catalogos.ts`, `productos.ts`, `inventario.ts`, `excel.ts`.
- **UI**: `/configuracion/catalogos`, `/productos`, `/inventario`, `/traslados`, `/movimientos`, `/lista-precios`.
- **Excel**: plantilla + exportación completa + importación atómica upsert.

### ✅ Fase 2 - Contactos
- **Schema**: Cliente (tipoDoc CC/NIT/OTRO, cupo/días crédito), Proveedor, Vendedor (comisión%), Domiciliario.
- **UI**: `/clientes`, `/proveedores`, `/vendedores`, `/domiciliarios`.

### ✅ Fase 3 - Núcleo POS + Caja Mínima
- **Schema**: Venta, VentaItem, PagoVenta, SesionCaja, MovimientoCaja.
- **Enums**: TipoVenta, EstadoVenta, MetodoPago, TipoMovimiento (+VENTA, +DEVOLUCION_CLIENTE).
- **Acciones**: `ventas.ts`, `caja.ts`.
- **UI**: `/ventas/nueva` (POS completo con pagos mixtos y ticket 80mm) y `/caja/apertura`.

### ✅ Fase 4 - Histórico y Operaciones
- **UI `/ventas`**: Histórico completo de ventas, métricas del día, detalle, anulación con reversión de stock y reimpresión de tickets 80mm.
- **UI `/remisiones`**: Listado de remisiones, detalle, conversión a venta con cobro y anulación.
- **UI `/cotizaciones`**: Listado de cotizaciones, detalle, conversión a venta con descuento de stock y anulación.

### ✅ Fase 5 - Arqueo y Caja Completa
- **UI `/caja/ingreso`**: Movimientos manuales de efectivo (`INGRESO_BASE`, `RETIRO`, `SUPLIDO`, `OTRO`) con validación de saldo.
- **UI `/caja/cerrar`**: Calculadora de billetes/monedas, arqueo ciego, cálculo de sobrante/faltante y cierre de turno.
- **UI `/caja/cierres`**: Historial de turnos de caja cerrados con badges de auditoría y reporte detallado.

### ✅ Fase 6 - Compras y Proveedores
- **Schema**: Compra, CompraItem, PagoCompra, OrdenCompra, OrdenCompraDetalle.
- **Acciones**: `compras.ts` (`registrarCompra`, `anularCompra`, `crearOrdenCompra`, `listarCompras`, `listarOrdenesCompra`).
- **UI `/compras/documento-soporte`**: Recepción de mercancía de proveedores con buscador de prendas, ingreso atómico de inventario (`COMPRA`) y actualización de costo base.
- **UI `/compras/historico-doc-soporte`**: Consulta de compras, detalle, impresión de comprobante y anulación con reversión de stock.
- **UI `/ordenes-compra`**: Creación y seguimiento de pedidos preliminares a proveedores.

### ✅ Fase 7 - Crédito y Cartera de Clientes
- **Schema**: CreditoCliente, AbonoCredito, MetodoPago (`CREDITO`).
- **Acciones**: `credito.ts` (`listarCreditos`, `obtenerResumenCartera`, `obtenerEstadoCuentaCliente`, `registrarAbono`).
- **UI `/creditos`**: Dashboard de cartera con semáforo de morosidad, modal de registro de abono con ingreso a caja, modal de estado de cuenta del cliente con barra de cupo e impresión de recibo térmico de 80mm.

### ✅ Fase 8 - Reportes e Informes Gerenciales
- **Acciones**: `reportes.ts` (`obtenerReporteVentas`, `obtenerReporteRentabilidad`, `obtenerReporteInventarioRotacion`).
- **UI `/informes`**:
  - Filtros dinámicos por período (7d, 30d, 90d, 1 año) y por bodega.
  - Tab 1 (Ventas y Rendimiento): KPIs de facturación, ventas por método de pago, ventas por categoría y comisiones por vendedor.
  - Tab 2 (Utilidad y Rentabilidad): Margen de Utilidad Bruta (Ingresos vs COGS), badges de margen (%) y desglose por producto.
  - Tab 3 (Rotación e Inventario): Valoración de stock a costo vs venta, ranking Top Sellers y alertas de reabastecimiento.
  - Exportación de informes a Excel (.csv) e impresión en PDF.

### ✅ Fase 9 - Fidelización, Plan Separe y Promociones
- **Schema**: PlanSepare, PlanSepareItem, AbonoPlanSepare, MovimientoPuntos, Promocion, GiftCard.
- **Acciones**: `fidelizacion.ts` (`crearPlanSepare`, `registrarAbonoSepare`, `cancelarPlanSepare`, `ajustarPuntos`, `guardarPromocion`, `togglePromocion`, `emitirGiftCard`).
- **UI `/plan-separe`**: Apartados de mercancía con reserva física de existencias en bodega, registro de cuotas y cancelación con devolución de stock.
- **UI `/puntos`**: Historial de puntos por compras y modal de ajuste/asignación manual.
- **UI `/promociones`**: Descuentos automáticos por porcentaje o monto fijo con vigencias y switch de activación en vivo.
- **UI `/gift-cards`**: Emisión de tarjetas de regalo con código aleatorio y vale imprimible de 80mm.

### ✅ Fase 10 - Auditoría, Bancos, Conciliaciones, Gastos y Configuración de Tienda
- **Schema**: Auditoria, CuentaBancaria, MovimientoBancario, ConciliacionBancaria, Gasto, ampliación de Configuracion (regimen, ciudad, pieTicket, etc.).
- **Acciones**: `auditoria.ts`, `bancos.ts`, `gastos.ts`, `configuracion.ts` e instrumentación en anulaciones de ventas, compras, apertura/cierre de caja y gastos.
- **UI `/configuracion`**: Configuración de razón social, NIT, régimen fiscal, metas diarias, reglas de puntos y simulador/preview en vivo de ticket térmico 80mm.
- **UI `/auditoria`**: Bitácora inmutable de eventos con estadísticas de seguridad, filtros multicriterio y modal de inspección JSON de metadatos.
- **UI `/bancos`**: Panel consolidado de cuentas bancarias y billeteras virtuales, creación/edición con colores identificadores y transferencias interbancarias directas.
- **UI `/bancos/movimientos`**: Extracto detallado con registro de notas débito/crédito, comisiones e ingresos.
- **UI `/bancos/conciliaciones`**: Asistente de conciliación contra extractos bancarios con cotejo de movimientos y cálculo automático de descuadre.
- **UI `/gastos`**: Módulo de egresos operativos categorizados con afectación directa a caja activa o débito en cuenta bancaria y opción de anulación con reversión.

---

## ⏭️ Siguiente Paso: Fase 11 — Producción / Ensamble de Prendas y Ventas Online
**Módulos Operativos de Venta Mostrador (Completados)**:
1. **Lector de Código de Barras Móvil con Cámara Web/Celular (`/ventas/nueva`)**: Escaneo continuo por cámara de smartphone/tablet con feedback sonoro (Web Audio Beep) y vibración, más soporte nativo de pistolas lectoras USB/Bluetooth.
2. **Modal de Cobro Express con Atajos de Billetes y Cambio (`/ventas/nueva`)**: Atajos de denominaciones colombianas ($10k, $20k, $50k, $100k, $200k, Exacto), cálculo de vueltas en tiempo real y soporte de pagos mixtos (Efectivo, Transferencia Nequi/Bancolombia, Tarjeta, Crédito).
3. **Generador e Impresión de Etiquetas con Códigos de Barras (`/productos`)**: Renderizado de códigos de barras Code128 para rollos adhesivos e impresoras térmicas (50x30mm, 40x25mm, 80mm).
4. **Impresión de Tirilla Térmica 80mm Directa**: Ticket con datos fiscales de la tienda (NIT, dirección, ciudad, teléfono, resolución y pie de ticket).
5. **Creación Express de Cliente**: Modal integrado en el flujo de cobro para registrar clientes sin perder los productos del carrito.

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

## Contact
- GitHub: Owen101297
- Railway: owen101297
- Email: owenalvarez97@gmail.com