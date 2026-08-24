import { listarAuditoria, obtenerEstadisticasAuditoria } from "@/lib/actions/auditoria";
import AuditoriaClient from "./AuditoriaClient";

export const metadata = {
  title: "Auditoría de Operaciones | KAOB POS",
};

export default async function AuditoriaPage() {
  const [data, stats] = await Promise.all([
    listarAuditoria({ take: 200 }),
    obtenerEstadisticasAuditoria(),
  ]);

  return <AuditoriaClient initialData={data} stats={stats} />;
}
