import type { Metadata } from "next";
import { listarDomiciliarios } from "@/lib/actions/contactos";
import DomiciliariosClient from "./DomiciliariosClient";

export const metadata: Metadata = { title: "Domiciliarios | POS System" };

export default async function Page() {
  const domiciliarios = await listarDomiciliarios(false);
  return <DomiciliariosClient domiciliarios={domiciliarios} />;
}