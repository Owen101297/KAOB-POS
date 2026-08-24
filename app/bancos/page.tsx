import { listarCuentasBancarias } from "@/lib/actions/bancos";
import BancosClient from "./BancosClient";

export const metadata = {
  title: "Bancos y Cuentas | KAOB POS",
};

export default async function BancosPage() {
  const cuentas = await listarCuentasBancarias();

  return <BancosClient cuentas={cuentas} />;
}
