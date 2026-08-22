import ExcelJS from "exceljs";
import { COLUMNAS_EXCEL, type ColumnaExcelKey } from "./plantilla";

export interface FilaParseada {
  numeroFila: number;
  referencia: string;
  nombre: string;
  categoria: string;
  marca: string;
  genero: string;
  material: string;
  calidad: string;
  temporada: string;
  costo: number;
  precio: number;
  color: string;
  talla: string;
  grupoTalla: string;
  bodega: string;
  stock: number;
  minimo: number;
}

export interface ResultadoParseo {
  filas: FilaParseada[];
  errores: { fila: number; mensaje: string }[];
}

const REFERENCIA_RE = /^[a-zA-Z0-9_-]+$/;
const GENEROS_VALIDOS = new Set(["dama", "caballero", "nino", "unisex"]);
const CALIDADES_VALIDAS = new Set(["premium", "alta", "estandar", "economica"]);

function celdaTexto(valor: ExcelJS.CellValue): string {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "object" && "text" in (valor as object)) {
    return String((valor as { text: unknown }).text ?? "").trim();
  }
  return String(valor).trim();
}

function celdaEntero(valor: ExcelJS.CellValue): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = Number(valor);
  return Number.isFinite(n) ? Math.round(n) : null;
}

/**
 * Lee y valida estructuralmente el archivo. Devuelve las filas normalizadas
 * y errores por número de fila (sin tocar la base de datos).
 */
export async function parsearExcel(datos: Buffer): Promise<ResultadoParseo> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(datos as unknown as ExcelJS.Buffer);

  const ws = wb.worksheets[0];
  if (!ws) throw new Error("El archivo no tiene hojas.");

  // Encabezados de la primera fila → índice de columna
  const colIndex = new Map<string, number>();
  ws.getRow(1).eachCell((cell, col) => {
    colIndex.set(celdaTexto(cell.value).toLowerCase(), col);
  });

  const faltantes = COLUMNAS_EXCEL.filter((c) => !colIndex.has(c.header.toLowerCase()));
  if (faltantes.length > 0) {
    throw new Error(
      `Faltan columnas en el archivo: ${faltantes.map((c) => c.header).join(", ")}. Descarga la plantilla.`
    );
  }

  const errores: { fila: number; mensaje: string }[] = [];
  const filas: FilaParseada[] = [];
  const clavesVistas = new Set<string>();

  ws.eachRow((row, numeroFila) => {
    if (numeroFila === 1) return;

    function celda(key: ColumnaExcelKey): ExcelJS.CellValue {
      const def = COLUMNAS_EXCEL.find((c) => c.key === key)!;
      return row.getCell(colIndex.get(def.header.toLowerCase())!).value;
    }

    const referencia = celdaTexto(celda("referencia")).toUpperCase();
    if (!referencia) return; // fila vacía
    if (referencia === "EJEMPLO") return; // fila de ejemplo de la plantilla

    const nombre = celdaTexto(celda("nombre"));
    const categoria = celdaTexto(celda("categoria"));
    const color = celdaTexto(celda("color"));
    const talla = celdaTexto(celda("talla"));
    const grupoTalla = celdaTexto(celda("grupoTalla"));
    const bodega = celdaTexto(celda("bodega"));
    const genero = celdaTexto(celda("genero"));
    const calidad = celdaTexto(celda("calidad"));
    const costo = celdaEntero(celda("costo")) ?? 0;
    const precio = celdaEntero(celda("precio")) ?? 0;
    const stock = celdaEntero(celda("stock")) ?? 0;
    const minimo = celdaEntero(celda("minimo")) ?? 0;

    function error(mensaje: string) {
      errores.push({ fila: numeroFila, mensaje });
    }

    if (!nombre) return error("Falta el nombre del producto.");
    if (nombre.length > 120) return error("Nombre demasiado largo (máx 120).");
    if (!REFERENCIA_RE.test(referencia))
      return error(`Referencia "${referencia}" inválida: solo letras, números y guiones.`);
    if (!categoria) return error(`[${referencia}] Falta la categoría.`);
    if (!color) return error(`[${referencia}] Falta el color.`);
    if (!talla) return error(`[${referencia}] Falta la talla.`);
    if (!grupoTalla) return error(`[${referencia}] Falta el grupo de talla.`);
    if (!bodega) return error(`[${referencia}] Falta la bodega.`);
    if (genero && !GENEROS_VALIDOS.has(sinAcentos(genero)))
      return error(`[${referencia}] Género "${genero}" inválido (Dama/Caballero/Niño/Unisex).`);
    if (calidad && !CALIDADES_VALIDAS.has(sinAcentos(calidad)))
      return error(`[${referencia}] Calidad "${calidad}" inválida (Premium/Alta/Estandar/Economica).`);
    if (costo < 0 || precio < 0 || stock < 0 || minimo < 0)
      return error(`[${referencia}] Ningún valor numérico puede ser negativo.`);

    const clave = `${referencia}|${color.toUpperCase()}|${talla.toUpperCase()}|${bodega.toUpperCase()}`;
    if (clavesVistas.has(clave))
      return error(`[${referencia}] Combinación color/talla/bodega duplicada en el archivo.`);
    clavesVistas.add(clave);

    filas.push({
      numeroFila,
      referencia,
      nombre,
      categoria,
      marca: celdaTexto(celda("marca")),
      genero: normalizarGenero(genero),
      material: celdaTexto(celda("material")),
      calidad: normalizarCalidad(calidad),
      temporada: celdaTexto(celda("temporada")),
      costo,
      precio,
      color,
      talla,
      grupoTalla,
      bodega,
      stock,
      minimo,
    });
  });

  if (filas.length === 0 && errores.length === 0) {
    errores.push({ fila: 1, mensaje: "No se encontraron datos para importar." });
  }
  return { filas, errores };
}

function sinAcentos(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function normalizarGenero(v: string): string {
  if (!v) return "";
  switch (sinAcentos(v)) {
    case "dama": return "DAMA";
    case "caballero": return "CABALLERO";
    case "nino": return "NINO";
    case "unisex": return "UNISEX";
    default: return v.toUpperCase();
  }
}

function normalizarCalidad(v: string): string {
  if (!v) return "";
  switch (sinAcentos(v)) {
    case "premium": return "PREMIUM";
    case "alta": return "ALTA";
    case "estandar": return "ESTANDAR";
    case "economica": return "ECONOMICA";
    default: return v.toUpperCase();
  }
}
