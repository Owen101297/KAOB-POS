import ExcelJS from "exceljs";
import { db } from "@/lib/db";
import { COLUMNAS_EXCEL, crearHojaInventario, type FilaExcel } from "./plantilla";

/**
 * Exporta TODO el catálogo sin pérdida: una fila por variante × bodega activa,
 * incluso cuando no existe StockBodega (stock 0). Formato idéntico a la plantilla,
 * así importar el archivo exportado es un viaje de ida y vuelta exacto.
 */
export async function generarExportacion(): Promise<Buffer> {
  const [productos, bodegas] = await Promise.all([
    db.producto.findMany({
      orderBy: { referencia: "asc" },
      include: {
        categoria: true,
        marca: true,
        variantes: {
          where: { activa: true },
          orderBy: [{ colorId: "asc" }, { tallaId: "asc" }],
          include: {
            color: true,
            talla: { include: { grupo: true } },
            stocks: true,
          },
        },
      },
    }),
    db.bodega.findMany({ where: { activa: true }, orderBy: [{ esPrincipal: "desc" }, { nombre: "asc" }] }),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "POS System";
  const ws = crearHojaInventario(wb);

  for (const p of productos) {
    for (const v of p.variantes) {
      for (const b of bodegas) {
        const stock = v.stocks.find((s) => s.bodegaId === b.id);
        const fila: FilaExcel = {
          referencia: p.referencia,
          nombre: p.nombre,
          categoria: p.categoria?.nombre ?? "",
          marca: p.marca?.nombre ?? "",
          genero: p.genero ?? "",
          material: p.material ?? "",
          calidad: p.calidad ?? "",
          temporada: p.temporada ?? "",
          costo: p.costo,
          precio: p.precioBase,
          color: v.color.nombre,
          talla: v.talla.valor,
          grupoTalla: v.talla.grupo.nombre,
          bodega: b.nombre,
          stock: stock?.cantidad ?? 0,
          minimo: stock?.minimo ?? 0,
        };
        ws.addRow(fila);
      }
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

/** Encabezados esperados, para validar que el archivo subido sea compatible */
export const HEADERS_ESPERADOS = COLUMNAS_EXCEL.map((c) => c.header);
