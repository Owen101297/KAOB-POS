import { listarGastos } from "@/lib/actions/gastos";
import { listarCuentasBancarias } from "@/lib/actions/bancos";
import { listarBodegas } from "@/lib/actions/catalogos";
import GastosClient from "./GastosClient";

export const metadata = {
  title: "Gastos Operativos | KAOB POS",
};

export default async function GastosPage() {
  const [gastos, cuentas, bodegas] = await Promise.all([
    listarGastos(),
    listarCuentasBancarias({ soloActivas: true }),
    listarBodegas(true),
  ]);

  return <GastosClient gastos={gastos} cuentas={cuentas} bodegas={bodegas} />;
}
