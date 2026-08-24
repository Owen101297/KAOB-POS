import { listarCuentasBancarias, listarMovimientosBancarios } from "@/lib/actions/bancos";
import MovimientosClient from "./MovimientosClient";

export const metadata = {
  title: "Movimientos Bancarios | KAOB POS",
};

export default async function MovimientosPage() {
  const [movimientos, cuentas] = await Promise.all([
    listarMovimientosBancarios({ take: 200 }),
    listarCuentasBancarias(),
  ]);

  return <MovimientosClient movimientos={movimientos} cuentas={cuentas} />;
}
