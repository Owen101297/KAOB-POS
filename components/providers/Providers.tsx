"use client";

import { SessionProvider } from "next-auth/react";
import { BodegaProvider } from "@/components/providers/BodegaProvider";
import type { Bodega } from "@prisma/client";
import type { Session } from "next-auth";

export default function Providers({
  children,
  bodegas,
  session,
}: {
  children: React.ReactNode;
  bodegas: Bodega[];
  session?: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <BodegaProvider bodegas={bodegas}>{children}</BodegaProvider>
    </SessionProvider>
  );
}
