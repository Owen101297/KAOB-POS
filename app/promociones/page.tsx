import { listarPromociones, type PromocionLista } from "@/lib/actions/fidelizacion";
import PromocionesClient from "./PromocionesClient";

export const dynamic = "force-dynamic";

export default async function PromocionesPage() {
  const promociones = await listarPromociones();

  return <PromocionesClient promocionesIniciales={promociones as unknown as PromocionLista[]} />;
}
