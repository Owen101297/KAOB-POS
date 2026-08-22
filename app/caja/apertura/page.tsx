import type { Metadata } from "next";
import CajaClient from "./CajaClient";

export const metadata: Metadata = { title: "Apertura de caja | POS System" };

export default function Page() {
  return <CajaClient />;
}