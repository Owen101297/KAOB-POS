import { listarVentas, type VentaLista } from "@/lib/actions/ventas";
import CotizacionesClient from "./CotizacionesClient";

export const dynamic = "force-dynamic";

export default async function CotizacionesPage() {
  const cotizaciones = await listarVentas({ tipo: "COTIZACION" });

  return (
    <CotizacionesClient cotizacionesIniciales={cotizaciones as unknown as VentaLista[]} />
  );
}
