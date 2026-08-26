import { NextRequest, NextResponse } from "next/server";
import { leerObjeto } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { key: string[] } }) {
  const key = params.key.join("/");
  const objeto = await leerObjeto(key);
  if (!objeto) {
    return new NextResponse("No encontrado", { status: 404 });
  }

  return new NextResponse(Buffer.from(objeto.cuerpo), {
    status: 200,
    headers: {
      "Content-Type": objeto.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
