import { listarSesionesCaja } from "@/lib/actions/caja";
import CierresCajaClient, { type SesionCajaItem } from "./CierresCajaClient";

export const dynamic = "force-dynamic";

export default async function CierresPage() {
  const sesiones = await listarSesionesCaja({ estado: "CERRADA" });

  return (
    <CierresCajaClient sesionesIniciales={sesiones as unknown as SesionCajaItem[]} />
  );
}
