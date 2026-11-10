import { test, expect } from '@playwright/test';
import { leerEstado } from './helpers';

// ───────────────────────── E2E: pagos en checkout (spec 002) ─────────────────
// Contraentrega no requiere llaves de pasarela: valida la ruta completa de
// pedido directo + página de estado. Las pasarelas (Wompi/Bold) solo se
// prueban cuando hay llaves de test en staging (skip+ marca condicional).

test.describe.serial('Pagos tienda: checkout directo y retorno', () => {
  let referencia: string | undefined;

  test('contraentrega: checkout directo crea pedido y muestra estado en proceso', async ({ page }) => {
    const st = leerEstado();
    if (!st.nombreProducto) test.skip(true, 'Dato E2E de producto no disponible');

    await page.goto('/tienda');
    await page.getByText(st.nombreProducto ?? '', { exact: false }).first().click();
    const modalDetalle = page.locator('button[aria-label="Cerrar modal"]');
    await expect(modalDetalle).toBeVisible({ timeout: 20000 });

    await page.getByRole('button', { name: /Añadir a la bolsa/ }).first().click();
    await expect(page.getByText('¡Añadido a la bolsa!')).toBeVisible();
    await page.getByRole('button', { name: 'Ver bolsa de compras' }).click();

    await page.getByRole('button', { name: 'Proceder al Checkout' }).click();
    await page.getByPlaceholder('Ej. Carlos Mendoza').fill('Cliente Pago E2E');
    await page.getByPlaceholder('Ej. 310 123 4567').fill('300 000 0000');
    await page.getByPlaceholder('Ej. Medellín').fill('Bogotá');
    await page.getByPlaceholder('Ej. Calle 10 # 40-20').fill('Calle de Prueba 123');
    await page.getByPlaceholder(/Apto 301/).fill('Entrega contraentrega E2E');

    await page.getByRole('button', { name: 'Continuar al pago' }).click();
    await page.getByRole('button', { name: /Pago contraentrega/ }).click();
    await page.getByRole('button', { name: /Confirmar pedido/ }).click();

    // Redirección a /tienda/pago/<referencia>
    await expect(page).toHaveURL(/\/tienda\/pago\//, { timeout: 30000 });
    const url = page.url();
    referencia = url.split('/tienda/pago/')[1]?.split('?')[0];
    expect(referencia ?? '', 'Referencia del pedido').toMatch(/^PED-/);

    await expect(page.getByText(/Esperando tu pago|Pago en proceso/)).toBeVisible();
    await expect(page.getByText('Pago contraentrega')).toBeVisible();
  });

  test('el pedido queda visible en /ventas-online con badge del método', async ({ page }) => {
    if (!referencia) test.skip(true, 'Requiere el test previo de contraentrega');
    // La página protegida exige sesión Basic (playwright config la envía).
    await page.goto('/ventas-online');
    await expect(page.getByText(referencia!)).toBeVisible({ timeout: 30000 });
    await expect(page.locator(`:has-text("${referencia}")`).first()).toContainText('CONTRAENTREGA');
  });
});
