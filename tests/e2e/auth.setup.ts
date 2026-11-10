import { test as setup } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// ───────────────────────── Setup: sesión de POS para E2E ─────────────────────
// Desde la feature de login (cookie firmada), las páginas protegidas exigen
// sesión; el Basic Auth ya no basta. Este setup inicia sesión una vez por
// corrida con las credenciales de .env.e2e y guarda la cookie para todos los
// tests del proyecto principal.

const AUTH_FILE = path.join(__dirname, '.auth', 'staging.json');
fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

setup('iniciar sesión POS', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder('usuario@ejemplo.co').fill(process.env.KAOB_E2E_AUTH_USER || '');
  await page.getByPlaceholder('••••••••••••').fill(process.env.KAOB_E2E_AUTH_PASSWORD || '');
  await page.getByRole('button', { name: /Entrar al POS/ }).click();

  // Poll de la pathname (varía la forma de waitForURL entre versiones).
  const yaFuera = await page
    .waitForURL((u) => !(u instanceof URL) || !u.pathname.startsWith('/login'), { timeout: 30000 })
    .catch(() => null);
  if (!yaFuera) {
    await page
      .waitForFunction(() => !window.location.pathname.startsWith('/login'), null, { timeout: 5000 })
      .catch(() => null);
    if (new URL(page.url()).pathname.startsWith('/login')) {
      throw new Error('No se pudo iniciar la sesión de POS para la suite E2E.');
    }
  }

  await page.context().storageState({ path: AUTH_FILE });
});
