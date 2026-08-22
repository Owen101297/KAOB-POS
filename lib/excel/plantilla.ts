import ExcelJS from "exceljs";

/** Tabla única plana: 1 fila = variante × bodega. Formato canónico de intercambio. */
export const COLUMNAS_EXCEL = [
  { key: "referencia", header: "Referencia", width: 14 },
  { key: "nombre", header: "Producto", width: 30 },
  { key: "categoria", header: "Categoria", width: 18 },
  { key: "marca", header: "Marca", width: 16 },
  { key: "genero", header: "Genero", width: 12 },
  { key: "material", header: "Material", width: 16 },
  { key: "calidad", header: "Calidad", width: 12 },
  { key: "temporada", header: "Temporada", width: 14 },
  { key: "costo", header: "Costo", width: 12 },
  { key: "precio", header: "Precio", width: 12 },
  { key: "color", header: "Color", width: 14 },
  { key: "talla", header: "Talla", width: 8 },
  { key: "grupoTalla", header: "GrupoTalla", width: 16 },
  { key: "bodega", header: "Bodega", width: 16 },
  { key: "stock", header: "Stock", width: 8 },
  { key: "minimo", header: "Minimo", width: 8 },
] as const;

export type ColumnaExcelKey = (typeof COLUMNAS_EXCEL)[number]["key"];

export type FilaExcel = Record<ColumnaExcelKey, string | number>;

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF0F172A" },
};

function estiloHeader(cell: ExcelJS.Cell) {
  cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  cell.fill = HEADER_FILL;
  cell.alignment = { vertical: "middle", horizontal: "center" };
}

/** Hoja "Inventario" con encabezados congelados */
export function crearHojaInventario(wb: ExcelJS.Workbook): ExcelJS.Worksheet {
  const ws = wb.addWorksheet("Inventario", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  ws.columns = COLUMNAS_EXCEL.map((c) => ({ key: c.key, header: c.header, width: c.width }));
  COLUMNAS_EXCEL.forEach((c) => estiloHeader(ws.getRow(1).getCell(c.key)));
  ws.getRow(1).height = 20;
  return ws;
}

/** Libro nuevo con encabezados + una fila de ejemplo que el importador ignora */
export async function generarPlantilla(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "POS System";
  const ws = crearHojaInventario(wb);
  ws.addRow({
    referencia: "EJEMPLO",
    nombre: "(borra esta fila antes de importar)",
    categoria: "Camisetas",
    marca: "MiMarca",
    genero: "Unisex",
    material: "Algodon",
    calidad: "Estandar",
    temporada: "Verano",
    costo: 15000,
    precio: 35000,
    color: "Negro",
    talla: "M",
    grupoTalla: "Ropa",
    bodega: "Principal",
    stock: 10,
    minimo: 2,
  });
  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}
