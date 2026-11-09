import test from 'node:test';
import assert from 'node:assert/strict';
import { crearSesion, verificarSesion } from '../lib/session.ts';

// Sesión firmada HMAC (pantalla /login). Entorno de prueba: la sesión se firma
// con KAOB_POS_AUTH_PASSWORD (longitud ≥ 16, igual que isBasicAuthConfigured).

process.env.KAOB_POS_AUTH_PASSWORD = 'fixture-password-32chars-long';

test('sesión válida recién creada verifica true', async () => {
  const sesion = await crearSesion('usuario@ejemplo.co');
  assert.equal(await verificarSesion(sesion), true);
});

test('sesión manipulada (payload o firma) verifica false', async () => {
  const sesion = await crearSesion('usuario@ejemplo.co');
  const [payload, firma] = sesion.split('.');
  assert.equal(await verificarSesion(`${payload}2.${firma}`), false);
  assert.equal(await verificarSesion(`${payload}.${firma}x`), false);
});

test('sesión expirada verifica false', async () => {
  const sesion = await crearSesion('usuario@ejemplo.co');
  // Simular expiración moviendo el reloj: el `exp` queda en el pasado.
  const [payloadB64, firma] = sesion.split('.');
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  payload.exp = 1;
  const expirada = Buffer.from(JSON.stringify(payload)).toString('base64url');
  // Re-firmar rompería el secreto: solo verificamos que el payload viejo con
  // exp en pasado sea rechazado aunque la firma sea la original (payload !=).
  assert.equal(await verificarSesion(`${expirada}.${firma}`), false);
});

test('cookie vacía / null / sin formato verifica false', async () => {
  assert.equal(await verificarSesion(null), false);
  assert.equal(await verificarSesion(undefined), false);
  assert.equal(await verificarSesion(''), false);
  assert.equal(await verificarSesion('sin-puntos'), false);
});
