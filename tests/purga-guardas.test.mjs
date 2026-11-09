import test from 'node:test';
import assert from 'node:assert/strict';
import { analizarArgs, requiereFlagProduccion } from '../scripts/purga-datos.ts';

// Contratos: specs/001-ventas-online-real/contracts/purga.md

test('analizarArgs exige --nivel y lo valida', () => {
  assert.equal(analizarArgs([]).errorArgs !== null, true);
  assert.equal(analizarArgs(['--nivel=completo']).errorArgs !== null, true);
  const ok = analizarArgs(['--nivel=cero']);
  assert.equal(ok.errorArgs, null);
  assert.equal(ok.nivel, 'cero');
  assert.equal(ok.simular, false);
});

test('analizarArgs reconoce --simular y --entorno=produccion', () => {
  const ok = analizarArgs(['--nivel=transaccional', '--simular', '--entorno=produccion']);
  assert.equal(ok.errorArgs, null);
  assert.equal(ok.simular, true);
  assert.equal(ok.entornoProduccion, true);
});

test('analizarArgs rechaza argumentos desconocidos', () => {
  assert.equal(analizarArgs(['--nivel=cero', '--fuerza']).errorArgs !== null, true);
});

test('requiereFlagProduccion: sin "staging" en la url exige flag explícito', () => {
  assert.equal(requiereFlagProduccion('postgresql://u:p@host:5432/postgres'), true);
  assert.equal(requiereFlagProduccion('postgresql://u:p@host:5432/kaob_staging_db'), false);
  assert.equal(requiereFlagProduccion('postgresql://u:p@STAGING-DB:5432/db'), false);
});

test('el script como CLI aborta con código 2 sin --nivel y no toca BD', async () => {
  // Validación de extremo a extremo de la interfaz: la CLI se invoca con el
  // propio runner de pruebas como entry, así que el guard "no impide" el import.
  const { execFileSync } = await import('node:child_process');
  try {
    execFileSync('node', ['--experimental-strip-types', 'scripts/purga-datos.ts'], {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
      env: { ...process.env, PURGA_TEST_RUNNER: '1' },
    });
    assert.fail('La CLI debía abortar sin --nivel');
  } catch (err) {
    assert.equal(String(err.stderr ?? '').includes('Falta --nivel'), true, 'Debe informar el uso correcto');
    assert.equal(err.status, 2, 'Exit code 2 (fallo de argumentos, sin tocar BD)');
  }
});
