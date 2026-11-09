/**
 * CLI Puesta a cero de datos — KAOB-POS
 * Contrato: specs/001-ventas-online-real/contracts/purga.md
 *
 * Uso:
 *   npm run purga -- --nivel=transaccional [--simular]
 *   npm run purga -- --nivel=cero [--simular]
 *   npm run purga -- --nivel=cero --entorno=produccion   (doble confirmación)
 *
 * Reglas (NO NEGOCIABLES):
 *   - Nunca borra sin confirmación escrita ("PURGAR").
 *   - Nunca toca Configuracion ni Bodega (ni en cero total).
 *   - Aborta con 0 filas si falla cualquier guard secreto/entorno.
 *   - Nunca imprime la cadena DATABASE_URL.
 */
import { PrismaClient } from "@prisma/client";
import * as readline from "node:readline";
import { pathToFileURL } from "node:url";

const EXITOS = { OK: 0, CONFIRMACION: 1, ARGS: 2, CONEXION: 3, PRODUCCION: 4, DB: 5 } as const;

type Nivel = "transaccional" | "cero";

export interface ConfigPurga {
  nivel: Nivel;
  simular: boolean;
  entornoProduccion: boolean;
  errorArgs: string | null;
}

export function analizarArgs(args: string[]): ConfigPurga {
  let nivel: Nivel | null = null;
  let simular = false;
  let entornoProduccion = false;

  for (const arg of args) {
    if (arg === "--simular") simular = true;
    else if (arg === "--entorno=produccion") entornoProduccion = true;
    else if (arg.startsWith("--nivel=")) {
      const v = arg.slice("--nivel=".length);
      if (v === "transaccional" || v === "cero") nivel = v;
      else {
        return {
          nivel: "transaccional",
          simular,
          entornoProduccion,
          errorArgs: `Nivel inválido: "${v}" (usa transaccional o cero)`,
        };
      }
    } else {
      return {
        nivel: "transaccional",
        simular,
        entornoProduccion,
        errorArgs: `Argumento no reconocido: ${arg}`,
      };
    }
  }

  if (nivel === null) {
    return { nivel: "transaccional", simular, entornoProduccion, errorArgs: "Falta --nivel=transaccional|cero" };
  }
  return { nivel, simular, entornoProduccion, errorArgs: null };
}

/** Guard de entorno: solo se considera "staging" si la URL lo indica; sin 'staging'
 *  en la cadena, se exige --entorno=produccion (defensa contra desenfoque de entorno,
 *  DB locales incluidas). */
export function requiereFlagProduccion(databaseUrl: string): boolean {
  return !/staging/i.test(databaseUrl);
}

// ───────────────────────── LISTA DE BORRADO (hoja → raíz) ─────────────────────────
// Orden derivado del grafo FK de prisma/schema.prisma (specs/…/data-model.md).

interface Paso {
  modelo: keyof PrismaClient & string;
  etiqueta: string;
  nivel: Nivel;
  where?: Record<string, unknown>;
}

const pasos = (db: PrismaClient): Paso[] => [
  // A. Transaccional
  { modelo: "abonoCredito", etiqueta: "Abonos de crédito", nivel: "transaccional" },
  { modelo: "creditoCliente", etiqueta: "Créditos de cartera", nivel: "transaccional" },
  { modelo: "abonoPlanSepare", etiqueta: "Abonos plan separe", nivel: "transaccional" },
  { modelo: "planSepareItem", etiqueta: "Items plan separe", nivel: "transaccional" },
  { modelo: "planSepare", etiqueta: "Planes separe", nivel: "transaccional" },
  { modelo: "movimientoPuntos", etiqueta: "Movimientos de puntos", nivel: "transaccional" },
  { modelo: "giftCard", etiqueta: "Gift cards", nivel: "transaccional" },
  { modelo: "promocion", etiqueta: "Promociones", nivel: "transaccional" },
  { modelo: "pagoVenta", etiqueta: "Pagos de venta", nivel: "transaccional" },
  { modelo: "ventaItem", etiqueta: "Items de venta", nivel: "transaccional" },
  { modelo: "venta", etiqueta: "Ventas", nivel: "transaccional" },
  { modelo: "movimientoCaja", etiqueta: "Movimientos de caja", nivel: "transaccional" },
  { modelo: "sesionCaja", etiqueta: "Sesiones de caja", nivel: "transaccional" },
  { modelo: "compraItem", etiqueta: "Items de compra", nivel: "transaccional" },
  { modelo: "pagoCompra", etiqueta: "Pagos de compra", nivel: "transaccional" },
  { modelo: "compra", etiqueta: "Compras", nivel: "transaccional" },
  { modelo: "ordenCompraDetalle", etiqueta: "Detalle órdenes de compra", nivel: "transaccional" },
  { modelo: "ordenCompra", etiqueta: "Órdenes de compra", nivel: "transaccional" },
  { modelo: "movimientoBancario", etiqueta: "Movimientos bancarios", nivel: "transaccional" },
  { modelo: "conciliacionBancaria", etiqueta: "Conciliaciones bancarias", nivel: "transaccional" },
  { modelo: "desembolsoPlataforma", etiqueta: "Desembolsos de plataforma", nivel: "transaccional" },
  { modelo: "cuentaBancaria", etiqueta: "Cuentas bancarias", nivel: "transaccional" },
  { modelo: "gasto", etiqueta: "Gastos", nivel: "transaccional" },
  { modelo: "auditoria", etiqueta: "Auditoría", nivel: "transaccional" },
  { modelo: "trasladoDetalle", etiqueta: "Detalle traslados", nivel: "transaccional" },
  { modelo: "traslado", etiqueta: "Traslados", nivel: "transaccional" },
  { modelo: "movimientoInventario", etiqueta: "Movimientos de inventario", nivel: "transaccional" },
  // Pedidos online del POS
  { modelo: "pedidoItem", etiqueta: "Items de pedidos online", nivel: "transaccional" },
  { modelo: "pedido", etiqueta: "Pedidos online", nivel: "transaccional" },

  // B. Residuos E2E del catálogo (ambos niveles, solo registros marcados)
  { modelo: "producto", etiqueta: "Productos residuales E2E (E2EE*)", nivel: "transaccional", where: { nombre: { startsWith: "E2EE" } } },
  { modelo: "color", etiqueta: "Colores E2E (INK-*) sin variantes", nivel: "transaccional", where: { nombre: { startsWith: "INK-" }, variante: { none: {} } } },
  { modelo: "categoria", etiqueta: "Categorías E2E (E2ECAT-*) sin productos", nivel: "transaccional", where: { nombre: { startsWith: "E2ECAT-" }, producto: { none: {} } } },
  { modelo: "grupoTalla", etiqueta: "Grupos de talla E2E (E2EGT-*) sin tallas", nivel: "transaccional", where: { nombre: { startsWith: "E2EGT-" }, talla: { none: {} } } },

  // C. Solo nivel cero: catálogo + contactos (bodega/configuración SE CONSERVAN)
  { modelo: "stockBodega", etiqueta: "Stock en bodega", nivel: "cero" },
  { modelo: "variante", etiqueta: "Variantes", nivel: "cero" },
  { modelo: "producto", etiqueta: "productos", nivel: "cero" },
  { modelo: "talla", etiqueta: "Tallas", nivel: "cero" },
  { modelo: "grupoTalla", etiqueta: "Grupos de talla", nivel: "cero" },
  { modelo: "categoria", etiqueta: "Categorías", nivel: "cero" },
  { modelo: "color", etiqueta: "Colores", nivel: "cero" },
  { modelo: "marca", etiqueta: "Marcas", nivel: "cero" },
  { modelo: "cliente", etiqueta: "clientes", nivel: "cero" },
  { modelo: "proveedor", etiqueta: "Proveedores", nivel: "cero" },
  { modelo: "vendedor", etiqueta: "Vendedores", nivel: "cero" },
  { modelo: "domiciliario", etiqueta: "Domiciliarios", nivel: "cero" },
];

function pedir(texto: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(texto, (resp) => {
      rl.close();
      resolve(resp);
    });
  });
}

async function main(): Promise<number> {
  const cfg = analizarArgs(process.argv.slice(2));

  if (cfg.errorArgs) {
    console.error(`❌ ${cfg.errorArgs}\n\nUso: npm run purga -- --nivel=transaccional|cero [--simular] [--entorno=produccion]`);
    return EXITOS.ARGS;
  }

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL no está definida. Exporta la conexión del entorno objetivo y reintenta.");
    return EXITOS.CONEXION;
  }

  const apuntandoProduccion = requiereFlagProduccion(process.env.DATABASE_URL);
  if (apuntandoProduccion && !cfg.entornoProduccion) {
    console.error(
      "🛑 La conexión no parece ser de staging. Para apuntar a producción debe pasar --entorno=produccion explícitamente." +
        "\n   Recuerda: la purga en producción exige autorización del propietario."
    );
    return EXITOS.PRODUCCION;
  }

  const db = new PrismaClient();

  try {
    await db.$connect();
  } catch {
    console.error("❌ No fue posible conectar a la base de datos (credenciales/host/DATABASE_URL).");
    await db.$disconnect().catch(() => undefined);
    return EXITOS.CONEXION;
  }

  const pasosNivel = pasos(db).filter((p) => p.nivel === cfg.nivel);

  try {
    // 1. Conteos ANTES de cualquier borrado (simulación implícita del impacto)
    const conteos: { paso: Paso; antes: number }[] = [];
    console.log(`\n📋 Nivel: ${cfg.nivel.toUpperCase()}${cfg.simular ? " (SIMULACIÓN)" : ""}\n`);
    for (const paso of pasosNivel) {
      const antes = await (db as any)[paso.modelo].count({ where: paso.where });
      conteos.push({ paso, antes });
      console.log(`  ${antes.toString().padStart(6)}  ${paso.etiqueta}`);
    }
    const totalLineas = conteos.reduce((a, c) => a + c.antes, 0);
    console.log(`\n  TOTAL a eliminar: ${totalLineas} registros\n`);
    console.log("  Se conservan siempre: Configuracion, Bodega, y en nivel transaccional:");
    console.log("  catálogo real + contactos." + (cfg.nivel === "cero" ? "\n  Nivel cero: catálogo y contactos TAMBIÉN se eliminan." : ""));

    if (cfg.simular) {
      console.log("\n✅ Simulación: 0 filas eliminadas.");
      await db.$disconnect();
      return EXITOS.OK;
    }

    if (totalLineas === 0) {
      console.log("\n✅ No hay registros por eliminar (base de datos ya vacía en este nivel).");
      await db.$disconnect();
      return EXITOS.OK;
    }

    // 2. Confirmación escrita
    const palabra = apuntandoProduccion ? "PURGAR-PRODUCCION" : "PURGAR";
    console.log(`\n⚠️  Esta operación NO es reversible. Escribe "${palabra}" para confirmar (o cualquier otra cosa para abortar).`);
    const resp = (await pedir("> ")).trim();
    if (resp !== palabra) {
      console.log("\n🛑 Cancelado por el operador. 0 filas eliminadas.");
      await db.$disconnect();
      return EXITOS.CONFIRMACION;
    }

    // 3. Borrado en $transaction en orden hoja → raíz
    const borrados = await db.$transaction(async (txDb) => {
      const resultados: { etiqueta: string; n: number }[] = [];
      for (const { paso, antes } of conteos) {
        if (antes === 0) {
          resultados.push({ etiqueta: paso.etiqueta, n: 0 });
          continue;
        }
        const n = await (txDb as any)[paso.modelo].deleteMany({ where: paso.where });
        resultados.push({ etiqueta: paso.etiqueta, n: n.count });
      }
      return resultados;
    });

    await db.$disconnect();

    const totalBorrados = borrados.reduce((a, r) => a + r.n, 0);
    console.log("\n✅ Purga completada. Filas eliminadas:");
    for (const { etiqueta, n } of borrados) {
      if (n > 0) console.log(`  ${n.toString().padStart(6)}  ${etiqueta}`);
    }
    console.log(`\n  TOTAL eliminado: ${totalBorrados}`);
    return EXITOS.OK;
  } catch (e) {
    console.error("\n❌ Error de base de datos durante la purga; la transacción fue revertida:\n", e instanceof Error ? e.message : e);
    await db.$disconnect().catch(() => undefined);
    return EXITOS.DB;
  }
}

// Solo ejecuta main cuando el archivo es el punto de entrada directo (permite
// importar helpers desde tests sin disparar la CLI).
const esPuntoEntrada =
  process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url;

if (esPuntoEntrada) {
  main().then((code) => process.exit(code));
}
