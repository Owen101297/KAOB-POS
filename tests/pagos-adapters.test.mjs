// ───────────────────────── Tests: adapters de pagos (spec 002) ─────────────────
// Verifica: firma de integridad Wompi (fórmula oficial), validación de checksum
// de eventos transaction.updated, comparación en tiempo constante y mapeos de
// estados Wompi/Bold → estados internos.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const { firmaIntegridadWompi, validarChecksumWompi, comparacionSegura } =
  await import('../lib/pagos/firmas.ts');
const { mapearEstadoWompi, mapearEstadoBold } = await import('../lib/pagos/estados.ts');

const sha = (s) => createHash('sha256').update(s).digest('hex');

// ── Firma de integridad: SHA256(ref + cents + currency + secret) ──
test('firmaIntegridadWompi sigue la fórmula oficial de concatenación', () => {
  const esperado = sha(`PED-20261109-1${5000000}COP${'secreto-integridad-test'}`);
  const firma = firmaIntegridadWompi({
    referencia: 'PED-20261109-1',
    montoCents: 5000000,
    moneda: 'COP',
    secreto: 'secreto-integridad-test',
  });
  assert.equal(firma, esperado);
});

// ── Checksum de eventos: properties + timestamp + secreto ──
test('validarChecksumWompi acepta un evento legítimo y rechaza uno alterado', () => {
  const secreto = 'prod_events_test';
  const timestamp = 1530291411;
  const evento = {
    event: 'transaction.updated',
    data: {
      transaction: {
        id: '1234-1610641025-49201',
        status: 'APPROVED',
        amount_in_cents: 4490000,
      },
    },
    signature: {
      properties: ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'],
      checksum: '',
    },
    timestamp,
  };

  // Fórmula independiente según la documentación de Wompi.
  evento.signature.checksum = sha(
    '1234-1610641025-49201APPROVED44900001530291411' + secreto
  ).toUpperCase();

  const ok = validarChecksumWompi(evento, secreto);
  assert.equal(ok.valido, true);
  assert.equal(ok.data?.transaction?.id, '1234-1610641025-49201');

  // Alterar el monto → la firma ya no corresponde.
  evento.data.transaction.amount_in_cents = 1;
  const alterado = validarChecksumWompi(evento, secreto);
  assert.equal(alterado.valido, false);
});

test('validarChecksumWompi tolera camelCase (API nueva) y eventos malformados', () => {
  const secreto = 's';
  const concatenado = 'tx-1DECLINED2000020000' + secreto; // id+status+amount+timestamp+secret
  const evento = {
    event: 'transaction.updated',
    data: { transaction: { id: 'tx-1', status: 'DECLINED', amountInCents: 20000 } },
    signature: { properties: ['transaction.id', 'transaction.status', 'transaction.amountInCents'], checksum: sha(concatenado).toUpperCase() },
    timestamp: 20000,
  };
  assert.equal(validarChecksumWompi(evento, secreto).valido, true);

  assert.equal(validarChecksumWompi(null, secreto).valido, false);
  assert.equal(validarChecksumWompi({ data: {} }, secreto).valido, false);
});

// ── Comparación segura (bytes exactos; las llamadas normalizan primero) ──
test('comparacionSegura es exacta en bytes y rechaza longitudes distintas', () => {
  assert.equal(comparacionSegura('ABC', 'ABC'), true);
  assert.equal(comparacionSegura('ABC', 'abc'), false);
  assert.equal(comparacionSegura('ABC', 'abcd'), false);
  assert.equal(comparacionSegura('ABC', 'XYZ'), false);
});

// ── Mapeos de estado ──
test('mapearEstadoWompi cubre los estados documentados', () => {
  assert.equal(mapearEstadoWompi('APPROVED'), 'APROBADO');
  assert.equal(mapearEstadoWompi('DECLINED'), 'RECHAZADO');
  assert.equal(mapearEstadoWompi('VOIDED'), 'CANCELADO');
  assert.equal(mapearEstadoWompi('ERROR'), 'RECHAZADO');
  assert.equal(mapearEstadoWompi('PENDING'), 'PENDIENTE');
  assert.equal(mapearEstadoWompi('desconocido'), 'PENDIENTE');
  assert.equal(mapearEstadoWompi(undefined), 'PENDIENTE');
});

test('mapearEstadoBold cubre los estados de Payment Links', () => {
  assert.equal(mapearEstadoBold('ACTIVE'), 'PENDIENTE');
  assert.equal(mapearEstadoBold('PROCESSING'), 'EN_TRANSITO');
  assert.equal(mapearEstadoBold('PAID'), 'APROBADO');
  assert.equal(mapearEstadoBold('REJECTED'), 'RECHAZADO');
  assert.equal(mapearEstadoBold('CANCELLED'), 'CANCELADO');
  assert.equal(mapearEstadoBold('EXPIRED'), 'RECHAZADO');
  assert.equal(mapearEstadoBold(undefined), 'PENDIENTE');
});
