import { obtenerConfiguracion } from "@/lib/actions/configuracion";
import ConfiguracionClient from "./ConfiguracionClient";

export const metadata = {
  title: "Configuración | KAOB POS",
};

export default async function ConfiguracionPage() {
  const config = await obtenerConfiguracion();

  return <ConfiguracionClient config={config} />;
}
