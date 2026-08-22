import type { Metadata } from "next";
import VentaClient from "./VentaClient";

export const metadata: Metadata = { title: "Nueva venta | POS System" };

export default function Page() {
  return <VentaClient />;
}