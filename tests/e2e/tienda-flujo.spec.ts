import { test, expect } from '@playwright/test';
import { leerEstado } from './helpers';

test.describe.serial('Tienda online → WhatsApp → despacho', () => {
  let erroresPagina: string[] = [];

  test.beforeEach(async ({ page }) => {
    erroresPagina = [];
    page.on('pageerror', (err) => erroresPagina.push(String(err)));
  });

  test('catálogo público muestra el producto del POS', async ({ page }) => {
    const st = leerEstado();
    await page.goto('/tienda');
    await expect(page.getByRole('button', { name: 'Todo', exact: true })).toBeVisible();
    await expect(page.getByText(st.nombreProducto ?? '', { exact: false }).first()).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByText(/prendas disponibles en vitrina/)).toBeVisible();
  });

  test('filtrar colección y abrir detalle no rompe hooks de React', async ({ page }) => {
    const st = leerEstado();
    await page.goto('/tienda');
    await page.getByRole('button', { name: 'Todo', exact: true }).click();
    await expect(page.getByText(/Catálogo Completo|Resultados para/)).toBeVisible();

    await page.getByText(st.nombreProducto ?? '', { exact: false }).first().click();
    const modalDetalle = page.locator('button[aria-label="Cerrar modal"]');
    await expect(modalDetalle).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/disponibles|Sin existencias/).first()).toBeVisible();
    const erroresHooks = erroresPagina.filter((e) => /hook|Hooks/i.test(e));
    expect(erroresHooks, `Errores de hooks en apertura de modal: ${erroresHooks.join(' | ')}`).toHaveLength(0);

    await modalDetalle.click();
    await expect(modalDetalle).toHaveCount(0);
  });

  test('carrito y checkout arman mensaje de WhatsApp correcto', async ({ page }) => {
    const st = leerEstado();
    await page.goto('/tienda');
    await page.getByText(st.nombreProducto ?? '', { exact: false }).first().click();
    const modalDetalle = page.locator('button[aria-label="Cerrar modal"]');
    await expect(modalDetalle).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /Añadir a la bolsa/ }).click();
    await expect(page.getByText('¡Añadido a la bolsa!')).toBeVisible();
    await expect(page.locator('button[aria-label="Cerrar modal"]')).toHaveCount(0, { timeout: 10000 });

    await page.getByRole('button', { name: 'Ver bolsa de compras' }).click();
    const drawer = page.getByText('Tu Bolsa de Compras');
    await expect(drawer).toBeVisible();
    await expect(page.getByText(st.nombreProducto ?? '').first()).toBeVisible();
    await expect(page.getByText(/Total a pagar/)).toBeVisible();

    await page.getByRole('button', { name: 'Proceder al Checkout' }).click();
    await page.getByPlaceholder('Ej. Carlos Mendoza').fill('Cliente Prueba E2E');
    await page.getByPlaceholder('Ej. 310 123 4567').fill('300 000 0000');
    await page.getByPlaceholder('Ej. Medellín').fill('Bogotá');
    await page.getByPlaceholder('Ej. Calle 10 # 40-20').fill('Calle Falsa 123');
    await page.getByPlaceholder(/Apto 301/).fill('Entrega de prueba E2E');

    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 20000 }),
      page.getByRole('button', { name: 'Finalizar Pedido por WhatsApp' }).click(),
    ]);
    const url = decodeURIComponent(popup.url().replace(/\+/g, ' '));
    expect(url, 'Debe abrir WhatsApp con el texto del pedido').toContain('whatsapp.com/send');
    expect(url).toMatch(/phone=\d{10,}/);
    expect(url).toContain('Cliente Prueba E2E');
    expect(url).toContain(st.nombreProducto ?? '');
    expect(url).toContain('TOTAL A PAGAR');
    expect(url).toMatch(/45\.000/);
    await popup.close().catch(() => {});
  });

  test('/ventas-online permite mover estados del pedido demo', async ({ page }) => {
    await page.goto('/ventas-online');
    await expect(page.getByText('Ventas Online & Pedidos Web')).toBeVisible();
    await expect(page.getByText(/PED-100\d/).first()).toBeVisible();

    const btnEmpacar = page.getByRole('button', { name: 'Empacar' }).first();
    await btnEmpacar.click();
    await expect(page.getByText(/Empacado|empacado/i).first()).toBeVisible({ timeout: 15000 });
  });
});
