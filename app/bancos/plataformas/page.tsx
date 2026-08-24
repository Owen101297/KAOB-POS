import { obtenerResumenPlataformas } from "@/lib/actions/plataformas";
import { listarCuentasBancarias } from "@/lib/actions/bancos";
import PlataformasClient from "./PlataformasClient";

export const metadata = {
  title: "Plataformas de Crédito (Addi / Sistecrédito) | KAOB POS",
};

export default async function PlataformasPage() {
  const [resumen, cuentas] = await Promise.all([
    obtenerResumenPlataformas(),
    listarCuentasBancarias({ soloActivas: true }),
  ]);

  return <PlataformasClient resumen={resumen} cuentas={cuentas} />;
}
