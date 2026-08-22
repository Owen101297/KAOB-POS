import type { Metadata } from "next";
import { listarVendedores } from "@/lib/actions/contactos";
import VendedoresClient from "./VendedoresClient";

export const metadata: Metadata = { title: "Vendedores | POS System" };

export default async function Page() {
  const vendedores = await listarVendedores(false);
  return <VendedoresClient vendedores={vendedores} />;
}