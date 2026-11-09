import { test, expect } from '@playwright/test';
import { uniq, leerEstado, guardarEstado } from './helpers';

// Ciclo completo del pedido online:
//   tienda → pedido PED en /ventas-online → Empacado → En camino → Entregado,
//   más cancelación con Dialog y trazabilidad de cambios (FR-003..FR-006).
// Requiere el bootstrap de catálogo del POS (consume ./pos-flujo-completo vía
// estado compartido; ejecutar la suite completa siempre en orden serial).

test.describe.serial('Ventas online: pedido real → ciclo de despacho completo', () => {
  const sufijo = uniq();
  const cliente = `E2ECLI-${sufijo}`;
  const clienteCancel = `E2ECANT-${sufijo}`;

  const tarjetaCliente = (page: import('@playwright/test').Page, nombre: string) =>
    page.locator('.rounded-2xl', { hasText: nombre }).first();

  test('checkout de tienda crea el pedido y abre WhatsApp con referencia PED', async ({ page }) => {
    const st = leerEstado();
    await page.goto('/tienda');
    await page.getByText(st.nombreProducto ?? '', { exact: false }).first().click();
    const modalDetalle = page.locator('button[aria-label="Cerrar modal"]');
    await expect(modalDetalle).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /Añadir a la bolsa/ }).click();
    await expect(page.getByText('¡Añadido a la bolsa!')).toBeVisible();
    await expect(modalDetalle).toHaveCount(0, { timeout: 10000 });

    await page.getByRole('button', { name: 'Ver bolsa de compras' }).click();
    await expect(page.getByText('Tu Bolsa de Compras')).toBeVisible();
    await page.getByRole('button', { name: 'Proceder al Checkout' }).click();
    await page.getByPlaceholder('Ej. Carlos Mendoza').fill(cliente);
    await page.getByPlaceholder('Ej. 310 123 4567').fill('300 123 4567');
    await page.getByPlaceholder('Ej. Medellín').fill('Medellín');
    await page.getByPlaceholder('Ej. Calle 10 # 40-20').fill('Cra 99 # 88-77');
    await page.getByPlaceholder(/Apto 301/).fill('Despacho ciclo E2E');

    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 30000 }),
      page.getByRole('button', { name: 'Finalizar Pedido por WhatsApp' }).click(),
    ]);
    await expect.poll(() => popup.url(), { timeout: 20000 }).toContain('whatsapp.com');
    const url = decodeURIComponent(popup.url().replace(/\+/g, ' '));
    expect(url).toMatch(/PED-\d{8}-\d+/);
    const ref = (url.match(/PED-\d{8}-\d+/) as string[])[0];
    guardarEstado({ pedidoRef: ref });
    await popup.close().catch(() => {});
  });

  test('/ventas-online expone el pedido real con acciones de Pendiente', async ({ page }) => {
    const st = leerEstado();
    await page.goto('/ventas-online');
    const tarjeta = page.locator('.rounded-2xl', { hasText: st.pedidoRef ?? '' }).first();
    await expect(tarjeta).toBeVisible({ timeout: 20000 });
    await expect(tarjeta.getByText('Pendiente', { exact: true })).toBeVisible();
    await expect(tarjeta.getByText(cliente)).toBeVisible();
    await expect(tarjeta.getByRole('button', { name: 'Empacar' })).toBeVisible();
  });

  test('avance válido a Empacado deja traza de cambio y bloquea salto a Entregado', async ({ page }) => {
    const st = leerEstado();
    await page.goto('/ventas-online');
    const tarjeta = page.locator('.rounded-2xl', { hasText: st.pedidoRef ?? '' }).first();
    await tarjeta.getByRole('button', { name: 'Empacar' }).click();
    await expect(tarjeta.getByText('Empacado', { exact: true })).toBeVisible({ timeout: 20000 });
    await expect(tarjeta.getByText(/Cambio por Administrador/)).toBeVisible();
    // Sin salto directo: estando Empacado solo se ofrece Despachar (siguiente paso)
    await expect(tarjeta.getByRole('button', { name: /Entregado/ })).toHaveCount(0);
  });

  test('ciclo completo: Despachar → En camino → Entregado (estado final sin acciones)', async ({ page }) => {
    const st = leerEstado();
    await page.goto('/ventas-online');
    const tarjeta = page.locator('.rounded-2xl', { hasText: st.pedidoRef ?? '' }).first();
    await tarjeta.getByRole('button', { name: 'Despachar' }).click();
    await expect(tarjeta.getByText('En camino', { exact: true })).toBeVisible({ timeout: 20000 });

    await tarjeta.getByRole('button', { name: /Entregado/ }).click();
    await expect(tarjeta.getByText('Entregado', { exact: true })).toBeVisible({ timeout: 20000 });
    await expect(tarjeta.getByRole('button', { name: 'Cancelar' })).toHaveCount(0);
    await expect(tarjeta.getByRole('button', { name: 'Empacar' })).toHaveCount(0);
  });

  test('pedido no entregado se cancela con Dialog y rastro', async ({ page }) => {
    const st = leerEstado();
    // Crear un segundo pedido (mismo producto, otro cliente) para cancelarlo.
    await page.goto('/tienda');
    await page.getByText(st.nombreProducto ?? '', { exact: false }).first().click();
    await expect(page.locator('button[aria-label="Cerrar modal"]')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /Añadir a la bolsa/ }).click();
    await page.getByRole('button', { name: 'Ver bolsa de compras' }).click();
    await page.getByRole('button', { name: 'Proceder al Checkout' }).click();
    await page.getByPlaceholder('Ej. Carlos Mendoza').fill(clienteCancel);
    await page.getByPlaceholder('Ej. 310 123 4567').fill('300 987 6543');
    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 30000 }),
      page.getByRole('button', { name: 'Finalizar Pedido por WhatsApp' }).click(),
    ]);
    // Para este test el WhatsApp es intrascendente: se decide en el panel.
    await expect.poll(() => popup.url(), { timeout: 20000 }).toContain('whatsapp.com');
    await popup.close().catch(() => {});

    await page.goto('/ventas-online');
    const tarjeta = page.locator('.rounded-2xl', { hasText: clienteCancel }).first();
    await expect(tarjeta).toBeVisible({ timeout: 20000 });
    await tarjeta.getByRole('button', { name: 'Cancelar' }).click();

    const dialogo = page.getByRole('dialog');
    await expect(dialogo).toBeVisible();
    await expect(dialogo.getByText(/rastro para auditoría/)).toBeVisible();
    await page.getByRole('button', { name: 'Cancelar pedido' }).click();

    await expect(tarjeta.getByText('Cancelado', { exact: true })).toBeVisible({ timeout: 20000 });
    await expect(tarjeta.getByRole('button', { name: 'Empacar' })).toHaveCount(0);
  });
});
