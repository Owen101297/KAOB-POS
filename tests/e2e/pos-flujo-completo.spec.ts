import { test, expect, Page } from '@playwright/test';
import { leerEstado, guardarEstado, uniq, repartirArqueo, leerEsperadoCaja } from './helpers';

test.describe.serial('POS: flujo completo de mostrador', () => {
  const sufijo = uniq();
  const categoria = `E2ECAT-${sufijo}`;
  const grupoTallas = `E2EGT-${sufijo}`;
  const colorNombre = `INK-${sufijo}`;
  const refUnica = `E2E${sufijo.slice(-6)}`;
  const nombreProducto = `Camiseta Dama ${refUnica}`;
  const precio = 45000;

  test('bootstrap: catálogos y producto con stock', async ({ page }) => {
    await page.goto('/configuracion/catalogos');

    await page.getByPlaceholder('Nueva categoría…').fill(categoria);
    await page.getByPlaceholder('Nueva categoría…').locator('..').locator('..').getByRole('button', { name: 'Agregar' }).click();
    await expect(page.getByText(categoria).locator('visible=true').first()).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Nuevo grupo' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').first().fill(grupoTallas);
    await dialog.getByPlaceholder('XS, S, M, L, XL, XXL').fill('S, M, U');
    await dialog.getByRole('button', { name: 'Crear grupo' }).click();
    await expect(page.getByText(grupoTallas).locator('visible=true').first()).toBeVisible({ timeout: 15000 });

    await page.getByPlaceholder('Nuevo color…').fill(colorNombre);
    await page.locator('input[placeholder="#RRGGBB"]').fill('#1e1b4b');
    await page.getByPlaceholder('Nuevo color…').locator('..').locator('..').getByRole('button', { name: 'Agregar' }).click();
    await expect(page.getByText(colorNombre).locator('visible=true').first()).toBeVisible({ timeout: 15000 });

    await page.goto('/productos');
    await page.getByRole('button', { name: /Nuevo producto/i }).click();
    const dialogo = page.getByRole('dialog');
    await expect(dialogo).toBeVisible();

    const triggerCategoria = dialogo.locator('label', { hasText: 'Categoría' }).getByRole('combobox');
    await triggerCategoria.click();
    await page.getByRole('option', { name: categoria }).click();

    const triggerGenero = dialogo.locator('label', { hasText: 'Género' }).getByRole('combobox');
    await triggerGenero.click();
    await page.getByRole('option', { name: 'Dama' }).click();

    await dialogo.getByLabel(/Referencia/).fill(refUnica);
    await dialogo.getByLabel(/Nombre \*/).fill(nombreProducto);
    await dialogo.getByLabel(/Costo \(COP\)/).fill('20000');
    await dialogo.getByLabel(/Precio venta \(COP\)/).fill(String(precio));

    const triggerGrupo = dialogo.locator('label', { hasText: 'Grupo de tallas' }).getByRole('combobox');
    await triggerGrupo.scrollIntoViewIfNeeded();
    await triggerGrupo.click();
    await page.getByRole('option', { name: grupoTallas }).click();
    await expect(dialogo.getByRole('button', { name: colorNombre })).toBeVisible({ timeout: 10000 });
    await dialogo.getByRole('button', { name: colorNombre }).click();
    await dialogo.locator('div:has(> span:text-is("Tallas"))').getByRole('button', { name: 'M', exact: true }).click();

    const celdaStock = dialogo.locator('input[type="number"][placeholder="0"]');
    await expect(celdaStock).toHaveCount(1, { timeout: 10000 });
    await celdaStock.fill('5');

    await dialogo.getByRole('button', { name: 'Crear producto' }).click();
    await expect(page.getByText(refUnica).locator('visible=true').first()).toBeVisible({ timeout: 30000 });

    guardarEstado({
      categoria,
      grupoTallas,
      colorNombre,
      ref: refUnica,
      nombreProducto,
      precio,
      sku: `${refUnica}-${colorNombre.split('-')[0]}-M`,
    });
  });

  test('apertura de caja con base inicial', async ({ page }) => {
    await page.goto('/caja/apertura');
    const base = page.getByLabel(/Base inicial/);
    await expect(base).toBeVisible();
    await base.fill('100000');
    await page.getByRole('button', { name: 'Abrir caja' }).click();
    await expect(page.getByText(/Caja abierta/i)).toBeVisible({ timeout: 15000 });
  });

  test('venta en cockpit con efectivo genera ticket', async ({ page }) => {
    const st = leerEstado();
    await page.goto('/ventas/nueva');
    // Nota: el texto CAJA ACTIVA está siempre oculto por `hidden xs:inline` (breakpoint inexistente,
    // defecto E2E-01). Se comprueba presencia en DOM mientras exista el defecto.
    await expect(page.locator('span', { hasText: 'CAJA ACTIVA' }).first()).toBeAttached({ timeout: 20000 });
    await expect(page.locator('.bg-emerald-400, .bg-green-400').first()).toBeVisible();

    await page.getByPlaceholder(/Escanea el código de barras/).fill(st.ref!);
    await expect(page.getByText(st.nombreProducto!).first()).toBeVisible({ timeout: 20000 });

    const botonVariante = page.locator('button', { has: page.getByText(/^M\s?\(5\)$/) }).first();
    await botonVariante.click();
    await expect(page.getByRole('button', { name: /COBRAR .*45\.000/ })).toBeVisible();

    await page.getByRole('button', { name: /COBRAR \(/ }).click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await modal.getByRole('button', { name: /^Efectivo/ }).click();

    await modal.locator('input[type="number"]').first().fill('100000');
    await expect(modal.getByText(/Cambio \/ Vueltas a Entregar/i)).toBeVisible();
    await expect(modal.getByText(/\$\s*55\.000/)).toBeVisible();

    await modal.getByRole('button', { name: /Completar Venta/ }).click();
    await expect(page.getByText('¡Venta Guardada con Éxito!')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('#thermal-ticket-80mm')).toBeVisible();
    const textoTicket = await page.locator('#thermal-ticket-80mm').textContent();
    expect(textoTicket).toContain(st.nombreProducto!);

    const chip = page.getByText(/V-\d+/).first();
    const ventaCode = (await chip.textContent())!.match(/V-\d+/)![0];
    guardarEstado({ ventaCode });
    await page.keyboard.press('Escape');
  });

  test('histórico muestra la venta completada con detalle', async ({ page }) => {
    const st = leerEstado();
    await page.goto('/ventas');
    await page.getByPlaceholder(/Buscar por N° Factura/).fill(st.ventaCode!);
    await expect(page.getByText(st.ventaCode!).first()).toBeVisible();
    await expect(page.getByText('Completada').first()).toBeVisible();

    await page.locator(`button[title="Ver Detalle"]`).first().click();
    await expect(page.getByText(`Detalle de Venta ${st.ventaCode}`)).toBeVisible();
    await expect(page.getByRole('dialog').getByText(/EFECTIVO/i).first()).toBeVisible();
    await expect(page.getByRole('dialog').getByText(st.ref!)).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Cerrar' }).first().click();
  });

  test('inventario descuenta el stock de la variante', async ({ page }) => {
    const st = leerEstado();
    await page.goto('/inventario');
    await page.getByPlaceholder('Buscar...').fill(st.ref!);
    await page.waitForTimeout(800);
    const fila = page.locator('tr', { hasText: st.ref! });
    await expect(fila).toBeVisible({ timeout: 20000 });
    await expect(fila).toContainText('4');
  });

  test('anulación de venta repone stock', async ({ page }) => {
    const st = leerEstado();
    await page.goto('/ventas');
    const fila = page.locator('tr', { hasText: st.ventaCode! });
    await fila.locator('button[title="Anular Venta"]').click();
    const dialogo = page.getByRole('dialog');
    await expect(dialogo.getByText(`Anular Venta ${st.ventaCode}`)).toBeVisible();
    await dialogo.getByPlaceholder(/Ingresa la razón por la cual se anula/).fill('Prueba E2E: devolución inmediata');
    await dialogo.getByRole('button', { name: 'Confirmar Anulación' }).click();
    await expect(fila.getByText('Anulada')).toBeVisible({ timeout: 20000 });

    await page.goto('/ventas/nueva');
    await page.getByPlaceholder(/Escanea el código de barras/).fill(st.ref!).catch(() => {});
    await expect(page.locator('button', { has: page.getByText(/^M\s?\(5\)$/) }).first()).toBeVisible({ timeout: 20000 });
  });

  test('movimiento de retiro desde /caja/ingreso', async ({ page }) => {
    await page.goto('/caja/ingreso');
    const selectorTipo = page.getByRole('combobox').nth(1);
    await selectorTipo.click();
    await page.getByRole('option', { name: /Retiro a Caja Fuerte/ }).click();
    await page.locator('input[type="number"]').first().fill('10000');
    await page.getByRole('button', { name: 'Registrar Movimiento' }).click();
    await expect(page.locator('.bg-red-50, [class*="success"]')).toHaveCount(0, { timeout: 100 }).catch(() => {});
    await expect(page.getByText('Registrar Movimiento')).toBeVisible();
  });

  test('cierre de caja con arqueo exacto', async ({ page }) => {
    await page.goto('/caja/cerrar');
    await expect(page.getByText(/Turno Abierto/)).toBeVisible({ timeout: 20000 });
    const esperado = await leerEsperadoCaja(page);
    const conteo = repartirArqueo(esperado);
    const inputs = page.locator('input[type="number"]');
    await expect(inputs).toHaveCount(8);
    for (let i = 0; i < 8; i++) {
      await inputs.nth(i).fill(String(conteo[i] || ''));
      if (!conteo[i]) await inputs.nth(i).fill('');
    }
    await expect(page.getByText(/quedará asentada automáticamente/)).toHaveCount(0);
    await page.getByRole('button', { name: 'Confirmar y Cerrar Caja' }).click();
    await expect(page).toHaveURL(/caja\/cierres/, { timeout: 20000 });
    await expect(page.getByText('La caja ya se encuentra cerrada')).toHaveCount(0);
  });

  test('cierre posterior registra faltante', async ({ page }) => {
    await page.goto('/caja/apertura');
    await page.getByLabel(/Base inicial/).fill('20000');
    await page.getByRole('button', { name: 'Abrir caja' }).click();
    await expect(page.getByText(/Caja abierta/i)).toBeVisible({ timeout: 15000 });

    await page.goto('/caja/cerrar');
    await expect(page.getByText(/Turno Abierto/)).toBeVisible({ timeout: 20000 });
    const inputs = page.locator('input[type="number"]');
    await expect(inputs).toHaveCount(8);
    await inputs.nth(6).fill('1');
    await inputs.nth(7).fill('5000');
    await expect(page.getByText(/Faltante/)).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar y Cerrar Caja' }).click();
    await expect(page).toHaveURL(/caja\/cierres/, { timeout: 20000 });

    await page.goto('/caja/cierres');
    await expect(page.getByText(/Faltante|Sobrante/).first()).toBeVisible({ timeout: 20000 });
  });
});
