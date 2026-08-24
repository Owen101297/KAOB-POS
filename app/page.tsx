import type { Metadata } from "next";
import { obtenerDatosDashboard } from "@/lib/actions/dashboard";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard General | POS System",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await obtenerDatosDashboard();
  return <DashboardClient initialData={data} />;
}
