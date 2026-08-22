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

## Phase Completion Status

### ✅ Fase 0 - Infraestructura Base
- Git init, Railway project + Postgres ×2, Prisma bootstrap, `/api/health`, CI/CD GitHub
- Next.js security fix 14.2.3 → 14.2.35 (CVE blocking)
- Ambos entornos live con `/api/health` → 200

### ✅ Fase 1 - Catálogo e Inventario Retail
- **Schema**: Bodega, Marca, Categoria (jerárquica), GrupoTalla, Talla, Color, Producto, Variante, StockBodega, MovimientoInventario, Traslado
- **Enums**: Genero, Calidad (4 niveles), TipoMovimiento
- **Acciones**: catalogos.ts, productos.ts, inventario.ts, excel.ts
- **UI**: `/configuracion/catalogos` (CRUD 5 catálogos), `/productos` (matriz talla×color + stock inicial), `/inventario` (stock por bodega + ajuste + mínimos), `/traslados` (1 paso + validación stock), `/movimientos` (bitácora filtrada), `/lista-precios` (edición inline costo/precio + margen)
- **Excel**: plantilla + exportación completa (variante×bodega) + importación atómica upsert (sumar/reemplazar)
- **Shell**: BodegaProvider + selector en Topbar (localStorage)

### ✅ Fase 2 - Contactos
- **Schema**: Cliente (tipoDoc CC/NIT/OTRO, cupo/días crédito), Proveedor, Vendedor (comisión%), Domiciliario
- **UI**: `/clientes`, `/proveedores`, `/vendedores`, `/domiciliarios` (DataTable + Dialog CRUD + búsqueda)

### ✅ Fase 3 - Núcleo POS + Caja Mínima
- **Schema**: Venta, VentaItem, PagoVenta, SesionCaja, MovimientoCaja
- **Enums añadidos**: TipoVenta (VENTA/REMISION/COTIZACION), EstadoVenta (COMPLETADA/PENDIENTE/ANULADA), MetodoPago (EFECTIVO/TRANSFERENCIA/TARJETA/PUNTOS/OTRO), TipoMovimiento (+VENTA, +DEVOLUCION_CLIENTE)
- **Acciones**: `ventas.ts` (buscarProductosPOS, registrarVenta, anularVenta, convertirDocumento, estadisticasDia), `caja.ts` (abrirCaja, cerrarCaja, obtenerSesionAbierta, resumenCajaActual)
- **UI `/ventas/nueva`**: buscador SKU/referencia/nombre → carrito (cantidad, precio, descuento por línea) → pagos mixtos → cliente/vendedor/nota → cobrar + imprimir ticket 80mm
- **UI `/caja/apertura`**: formulario base inicial → resumen arqueo en vivo → botón cerrar caja → indicador Topbar (verde/rojo)
- **Reglas**: venta/remisión requieren caja abierta; cotización no; anulación revierte stock + movimientos inversos; remisión descuenta stock (pendiente cobro)

### ✅ Fase 4 - Histórico y Operaciones
- **UI `/ventas`**: Histórico completo de ventas con métricas del día (Ventas Totales, Ticket Promedio, N° Transacciones, Remisiones/Cotizaciones del día), filtros por estado/búsqueda, modal de detalle de compra con desgloses, modal de anulación con motivo (reversión atómica de inventario `DEVOLUCION_CLIENTE` y ajuste de caja) y modal de reimpresión de comprobante/ticket de 80mm.
- **UI `/remisiones`**: Listado de remisiones pendientes/facturadas/anuladas, modal de detalle, modal de conversión Remisión → Venta (con registro de pago en caja) y anulación.
- **UI `/cotizaciones`**: Listado de cotizaciones vigentes/convertidas/anuladas, modal de detalle, modal de conversión Cotización → Venta (con chequeo y descuento atómico de inventario) y anulación.
- **Componente**: `TicketPrintModal.tsx` reutilizable para previsualización e impresión de tickets de 80mm.

### ✅ Fase 5 - Arqueo y Caja Completa
- **UI `/caja/ingreso`**: Formulario interactivo para movimientos manuales de caja (`INGRESO_BASE`, `RETIRO`, `SUPLIDO`, `OTRO`) con validación de saldo disponible en tiempo real.
- **UI `/caja/cerrar`**: Calculadora de billetes/monedas ($100k, $50k, $20k, $10k, $5k, $2k, $1k y Monedas), comparación en tiempo real del efectivo contado vs esperado con cálculo automático de sobrante/faltante, registro de ajuste y cierre de turno.
- **UI `/caja/cierres`**: Historial de turnos de caja cerrados en `DataTable`, badges de auditoría por diferencia (Exacto / Sobrante / Faltante) y modal de reporte detallado con impresión.
- **Server Actions**: `lib/actions/caja.ts` enriquecido con `cerrarCaja()`, `agregarMovimientoCaja()`, `resumenCajaActual()` y `listarSesionesCaja()`.

## Schema Key Models (prisma/schema.prisma)

```prisma
enum TipoVenta { VENTA REMISION COTIZACION }
enum EstadoVenta { COMPLETADA PENDIENTE ANULADA }
enum MetodoPago { EFECTIVO TRANSFERENCIA TARJETA PUNTOS OTRO }
enum TipoMovimiento { INICIAL AJUSTE_ENTRADA AJUSTE_SALIDA TRASLADO_SALIDA TRASLADO_ENTRADA COMPRA DEVOLUCION VENTA DEVOLUCION_CLIENTE }
enum TipoDocumento { CC NIT OTRO }
enum Genero { DAMA CABALLERO NINO UNISEX }
enum Calidad { PREMIUM ALTA ESTANDAR ECONOMICA }

model Producto { 
  id Int @id @default(autoincrement())
  referencia String @unique
  nombre String
  categoriaId Int
  marcaId Int?
  genero Genero?
  calidad Calidad?
  costo Int @default(0)
  precioBase Int @default(0)
  variantes Variante[]
}
model Variante {
  sku String @unique
  precioOverride Int?
  color Color @relation(fields: [colorId], references: [id])
  talla Talla @relation(fields: [tallaId], references: [id])
  @@unique([productoId, colorId, tallaId])
}
model Venta {
  consecutivo Int @unique
  tipo TipoVenta
  estado EstadoVenta @default(PENDIENTE)
  items VentaItem[]
  pagos PagoVenta[]
}
model StockBodega { @@unique([varianteId, bodegaId]) }
model MovimientoInventario { tipo TipoMovimiento }
model Traslado { detalles TrasladoDetalle[] }
```

## Key Technical Decisions
1. **Montos**: enteros COP (sin decimales)
2. **Snapshots**: costo/precio capturados en cada VentaItem (utilidad histórica)
3. **Stock**: decremento atómico en transacción + MovimientoInventario tipo VENTA/DEVOLUCION_CLIENTE
4. **Caja mínima / completa**: arqueo ciego por denominaciones con ajuste atómico de sobrantes/faltantes
5. **Remisión**: descuenta stock y queda PENDIENTE; conversión a venta cobra y completa
6. **Excel**: tabla única plana (1 fila = variante×bodega); importación upsert atómica, nunca borra
7. **Bodega activa**: Context global + localStorage; usada por defecto en POS
8. **Consecutivos**: por tipo (V-0001, R-0001, C-0001)
9. **Prisma en dependencies** (necesario para `migrate deploy` en Railway)

## Commands
```bash
# Desarrollo
npm run dev          # puerto 3000
npm run build        # producción + lint + typecheck
npx prisma migrate dev --name <nombre>
npx prisma generate
npx tsc --noEmit     # solo tipos

# Deploy
git push origin main:develop --force-with-lease  # staging
# merge main via GitHub → producción
```

## Next Phase: Fase 6 — Compras y Proveedores
**Prioridad**:
- Gestión de facturas de compra e ingreso de mercancía de proveedores.
- Actualización automática de inventario (tipo `COMPRA`) y recalculo opcional de costo medio.
- Cuentas por pagar a proveedores y registro de órdenes de compra.

## Files Modified Recently (Fase 5)
- `lib/actions/caja.ts` (Servicios de caja, cierre y arqueo)
- `app/caja/ingreso/IngresoEfectivoClient.tsx` & `page.tsx` (Movimientos manuales)
- `app/caja/cerrar/CerrarCajaClient.tsx` & `page.tsx` (Calculadora billetes y cierre)
- `app/caja/cierres/CierresCajaClient.tsx` & `page.tsx` (Historial y reporte cierres)

## Staging Verified (app-staging-61f4.up.railway.app)
- `/api/health` → 200
- `/productos`, `/inventario`, `/traslados`, `/movimientos`, `/lista-precios`, `/configuracion/catalogos` → 200
- `/clientes`, `/proveedores`, `/vendedores`, `/domiciliarios` → 200
- `/ventas/nueva`, `/caja/apertura`, `/caja/ingreso`, `/caja/cerrar`, `/caja/cierres` → 200
- `/ventas`, `/remisiones`, `/cotizaciones` → 200

## Contact
- GitHub: Owen101297
- Railway: owen101297
- Email: owenalvarez97@gmail.com