# Contract: Server Actions de Pedidos Online

**Feature**: `specs/001-ventas-online-real` | **Date**: 2026-11-08

Módulo: `lib/actions/pedidos.ts` (`"use server"`), siguiendo el patrón de `lib/actions/ventas.ts` (zod, `ActionResult<T>`, `revalidatePath`, `requireAuth`).

Todas las funciones: entrada `unknown`, validación con zod `lib/validations.ts`, y retorno `ActionResult<T>` (`{ ok: true; data: T } | { ok: false; error: string }`).

---

## registrarPedidoOnline(input): ActionResult<{ id: number; referencia: string }>

**Accesible SIN auth POS** (el checkout es público, como la tienda): no llama `requireAuth`.

Entrada (zod `pedidoOnlineSchema`):

```json
{
  "nombre": "string 1-120",
  "celular": "string 7-15 dígitos con prefijo opcional",
  "ciudad": "string? (máx 80)",
  "direccion": "string? (máx 200)",
  "notas": "string? (máx 500)",
  "items": [
    { "varianteId": "int>0", "cantidad": "int 1..99" }
  ]
}
```

Validaciones: `items.length >= 1` (FR-001/edge carrito vacío); cada `varianteId` debe existir y estar activa con su producto `activo: true` (la tienda solo lista activas); `cantidad` respeta lo que el carrito envió (la v1 no reserva stock — supuesto del spec).

Persistencia (`$transaction`): crea `Pedido` (total = Σ cantidad×precioEfectivo) → crea `PedidoItem[]` con snapshot (referencia/nombre/talla/color/precioUnitario/subtotal) → `update` de `referencia = PED-<YYYYMMDD>-<id>` → retorna `{ id, referencia }`.

Errores: validación zod (mensaje legible), carrito vacío, variante inexistente/inactiva, error DB.

---

## listarPedidosOnline(estado?): PedidoConItems[]

Server function para RSC `app/ventas-online/page.tsx`. Solo lectura BD — **requiere auth POS** en la página (middleware). Filtros: `estado?: EstadoPedidoOnline` o `"TODOS"`. Orden `createdAt desc`. Select incluye: id, referencia, contacto (nombre/telefono), total, estado, createdAt, `items` (conteo) — sin `paginate` en v1 (límite razonable 200 recientes).

---

## actualizarEstadoPedido(input): ActionResult<{ estado: string }>

**Requiere auth POS** (`requireAuth`).

```json
{ "id": "int>0", "nuevoEstado": "EMPACADO|EN_CAMINO|ENTREGADO" }
```

Reglas: resuelve el pedido actual; compara estado previo con el grafo de transiciones (`PENDIENTE→EMPACADO→EN_CAMINO→ENTREGADO`); переход solo si la transición es adyacente válida; rechaza si el pedido ya cambió desde la lectura (control de concurrencia por estado previo — edge del spec); escribe `estado`, `estadoPor: "Administrador"`, `estadoEn: now()`. `revalidatePath("/ventas-online")`.

Errores: pedido no existe; transición inválida (incluye `ENTREGADO`/`CANCELADO` final y saltos de 2 pasos).

---

## cancelarPedidoOnline(input): ActionResult<{ estado: "CANCELADO" }>

**Requiere auth POS** (`requireAuth`). Entrada: `{ id }`. Reglas: permitido desde `PENDIENTE|EMPACADO|EN_CAMINO`; final rechazado si ya `ENTREGADO` o `CANCELADO`; escribe traza igual que `actualizarEstadoPedido` (D3) y `revalidatePath`.

---

## No cambia en este feature

- `registrarVenta` / `anularVenta` (POS): toca stock como hoy; el pedido online NO genera `Venta` en v1.
- `lib/tienda/public-productos.ts`: solo lectura, redu_MASTER intacto.
- `middleware.ts`: la ruta `/ventas-online` sigue protegida por Basic Auth como hoy; `/tienda` pública.
