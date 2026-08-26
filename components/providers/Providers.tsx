"use client";

import { SessionProvider } from "next-auth/react";
import { BodegaProvider } from "@/components/providers/BodegaProvider";
import type { Bodega } from "@prisma/client";

export default function Providers({
  children,
  bodegas,
}: {
  children: React.ReactNode;
  bodegas: Bodega[];
}) {
  return (
    <SessionProvider>
      <BodegaProvider bodegas={bodegas}>{children}</BodegaProvider>
    </SessionProvider>
  );
}
