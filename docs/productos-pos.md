# Prendas: agregar y quitar en la vitrina (POS → tienda)

La tienda `/tienda` no gestiona catálogo: **lo que se muestra es el inventario
real del POS, en vivo (misma base de datos)**. Toda alta/baja se hace en el POS.

## Flujo correcto

1. **Agregar una prenda nueva**
   - En el POS → `/productos` → "Nuevo producto" (o "+ Agregar prenda").
   - Completa: nombre, referencia, categoría, género (Dama/Caballero), calidad,
     precio base y variantes (colores, tallas, stock por bodega).
   - Al guardarse con `activo = ON`, la prenda aparece en la vitrina de
     `/tienda` al instante (página dinámica, sin deploy).

2. **Quitar una prenda (sin borrarla)**
   - En `/productos`, usa el toggle **activo/inactivo** de la fila.
   - Al desactivarla desaparece de la tienda y de las búsquedas; conserva su
     historial de ventas, plan separe y compras. Es la forma recomendada.

3. **Eliminar de verdad (irreversible para variantes ligadas)**
   - `/productos` → selección múltiple → "Eliminar" (o el botón por fila).
   - El sistema se niega si la prenda está reservada en un Plan Separe ACTIVO
     (cancela el plan primero).
   - El historial de pedidos online conserva el snapshot del nombre y referencia
     (los items del pedido guardan su propia copia).

4. **Ajuste fino de precios y stock**
   - `precioOverride` por variante (useful para liquidación) se respeta en la
     tienda; si está vacío, la tienda usa el precio base del producto.
   - El stock disponible en tienda es la **suma de todas las bodegas** por
     variante activa.

## Reglas de sincronía (spec 002, US2)

| Acción en POS | Efecto en `/tienda` | Latencia |
|---|---|---|
| Crear producto activo | Aparece en vitrina y filtros | < 1 s |
| Activar producto | Aparece en vitrina | < 1 s |
| Desactivar producto | Desaparece de vitrina/búsqueda | < 1 s |
| Eliminar producto | Desaparece; pedidos pasados intactos | < 1 s |
| Cambiar precio/override | Cambia al refrescar la tienda | < 1 s |
| Stock 0 en todas las variantes | Sale de las tarjetas comprables | < 1 s |

## Detalle técnico (solo desarrolladores)

- Listado: `listarProductosPublicos()` (`lib/tienda/public-productos.ts`) consulta
  `Producto` con `activo: true`, variantes activas y `stock` agregado.
- Server recalcula los totales al crear el pedido (`crearPedidoConItems`,
  `lib/tienda/checkout-core.ts`), recalculando el precio por si cambió durante
  la sesión; la bolsa avisa si una variante ya no está disponible.
- La página de tienda es `force-dynamic` + server-rendered: no hay caché de
  catálogo ni CDN intermedio.
