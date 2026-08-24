import {
  listarConciliaciones,
  listarCuentasBancarias,
  listarMovimientosBancarios,
} from "@/lib/actions/bancos";
import ConciliacionesClient from "./ConciliacionesClient";

export const metadata = {
  title: "Conciliaciones Bancarias | KAOB POS",
};

export default async function ConciliacionesPage() {
  const [conciliaciones, cuentas, movimientosPendientes] = await Promise.all([
    listarConciliaciones(),
    listarCuentasBancarias(),
    listarMovimientosBancarios({ conciliado: false, take: 300 }),
  ]);

  return (
    <ConciliacionesClient
      conciliaciones={conciliaciones}
      cuentas={cuentas}
      movimientosPendientes={movimientosPendientes}
    />
  );
}
