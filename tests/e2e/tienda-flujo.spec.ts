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
    // El pedido se guarda primero en BD (PED-...) y luego se abre el chat.
    await expect.poll(() => popup.url(), { timeout: 20000 }).toContain('whatsapp.com');
    const url = decodeURIComponent(popup.url().replace(/\+/g, ' '));
    expect(url, 'Debe abrir WhatsApp con el texto del pedido').toContain('whatsapp.com/send');
    expect(url).toMatch(/phone=\d{10,}/);
    expect(url).toContain('Cliente Prueba E2E');
    expect(url).toContain(st.nombreProducto ?? '');
    expect(url).toContain('TOTAL A PAGAR');
    expect(url).toMatch(/45\.000/);
    // El pedido quedó registrado en BD con su referencia PED incluida en el mensaje.
    expect(url).toMatch(/Referencia: PED-\d{8}-\d+/);
    await popup.close().catch(() => {});
  });

  test('/ventas-online lista el pedido real (BD) y lo pasa a Empacado', async ({ page }) => {
    await page.goto('/ventas-online');
    await expect(page.getByText('Ventas Online & Pedidos Web')).toBeVisible();
    // La demo PED-1001..1003 fue reemplazada: solo pedidos reales de la BD.
    await expect(page.getByText(/PED-100\d/)).toHaveCount(0);
    await expect(page.getByText(/PED-\d{8}-\d+/).first()).toBeVisible({ timeout: 20000 });

    const tarjeta = page.locator('.rounded-2xl', { hasText: 'Cliente Prueba E2E' }).first();
    await expect(tarjeta).toBeVisible();
    await expect(tarjeta.getByText('Pendiente', { exact: true })).toBeVisible();

    await tarjeta.getByRole('button', { name: 'Empacar' }).click();
    await expect(tarjeta.getByText('Empacado', { exact: true })).toBeVisible({ timeout: 20000 });
    await expect(tarjeta.getByText(/Cambio por Administrador/)).toBeVisible();
  });
});
