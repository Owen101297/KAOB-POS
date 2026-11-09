import test from 'node:test';
import assert from 'node:assert/strict';
import {
  pedidoOnlineSchema,
  cambioEstadoPedidoSchema,
  cancelarPedidoSchema,
} from '../lib/validations.ts';

// Contratos: specs/001-ventas-online-real/contracts/pedidos.md
// El store es único por variante; el request del checkout envía items 1..99.

const base = {
  nombre: 'Ana Pérez',
  celular: '3001234567',
  items: [{ varianteId: 1, cantidad: 1 }],
};

test('pedidoOnlineSchema acepta un checkout mínimo válido', () => {
  const res = pedidoOnlineSchema.safeParse(base);
  assert.equal(res.success, true);
  if (res.success) {
    assert.equal(res.data.items.length, 1);
    assert.equal(res.data.celular, '3001234567');
  }
});

test('pedidoOnlineSchema acepta campos opcionales vacíos y los normaliza', () => {
  const res = pedidoOnlineSchema.safeParse({
    ...base,
    ciudad: '',
    direccion: '',
    notas: '  Apto 301  ',
  });
  assert.equal(res.success, true);
  if (res.success) assert.equal(res.data.notas, 'Apto 301');
});

test('pedidoOnlineSchema rechaza carrito vacío (FR-001 / edge del spec)', () => {
  const res = pedidoOnlineSchema.safeParse({ ...base, items: [] });
  assert.equal(res.success, false);
  if (!res.success) assert.match(res.error.issues[0].message, /al menos una prenda/i);
});

test('pedidoOnlineSchema rechaza cantidad 0 y cantidades fuera de rango', () => {
  assert.equal(pedidoOnlineSchema.safeParse({ ...base, items: [{ varianteId: 1, cantidad: 0 }] }).success, false);
  assert.equal(pedidoOnlineSchema.safeParse({ ...base, items: [{ varianteId: 1, cantidad: 100 }] }).success, false);
});

test('pedidoOnlineSchema rechaza checkout sin nombre o sin teléfono', () => {
  assert.equal(pedidoOnlineSchema.safeParse({ ...base, nombre: '  ' }).success, false);
  assert.equal(pedidoOnlineSchema.safeParse({ ...base, celular: '' }).success, false);
  assert.equal(pedidoOnlineSchema.safeParse({ ...base, celular: 'abc123á' }).success, false);
});

test('pedidoOnlineSchema rechaza textos por límite de longitud', () => {
  assert.equal(
    pedidoOnlineSchema.safeParse({ ...base, nombre: 'a'.repeat(121) }).success,
    false
  );
  assert.equal(
    pedidoOnlineSchema.safeParse({ ...base, notas: 'n'.repeat(501) }).success,
    false
  );
});

test('cambioEstadoPedidoSchema solo acepta estados de avance del ciclo', () => {
  assert.equal(cambioEstadoPedidoSchema.safeParse({ id: 1, nuevoEstado: 'EMPACADO' }).success, true);
  assert.equal(cambioEstadoPedidoSchema.safeParse({ id: 1, nuevoEstado: 'EN_CAMINO' }).success, true);
  assert.equal(cambioEstadoPedidoSchema.safeParse({ id: 1, nuevoEstado: 'ENTREGADO' }).success, true);
  assert.equal(cambioEstadoPedidoSchema.safeParse({ id: 1, nuevoEstado: 'PENDIENTE' }).success, false);
  assert.equal(cambioEstadoPedidoSchema.safeParse({ id: 1, nuevoEstado: 'CANCELADO' }).success, false);
  assert.equal(cambioEstadoPedidoSchema.safeParse({ id: 0, nuevoEstado: 'EMPACADO' }).success, false);
});

test('cancelarPedidoSchema exige id positivo', () => {
  assert.equal(cancelarPedidoSchema.safeParse({ id: 1 }).success, true);
  assert.equal(cancelarPedidoSchema.safeParse({ id: 0 }).success, false);
  assert.equal(cancelarPedidoSchema.safeParse({ id: -1 }).success, false);
});
