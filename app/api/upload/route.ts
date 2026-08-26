import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { subirObjeto, storageConfigurado } from "@/lib/storage";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const TAMANO_MAXIMO = 8 * 1024 * 1024; // 8MB

function extensionDe(tipo: string): string {
  switch (tipo) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  if (!storageConfigurado()) {
    return NextResponse.json(
      { ok: false, error: "El almacenamiento de fotos no está configurado en este entorno (faltan variables BUCKET_*)." },
      { status: 500 }
    );
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    const productoIdRaw = form.get("productoId");
    const colorIdRaw = form.get("colorId");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No se recibió ningún archivo." }, { status: 400 });
    }
    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      return NextResponse.json({ ok: false, error: "Formato no admitido. Usa JPG, PNG, WEBP o GIF." }, { status: 400 });
    }
    if (file.size > TAMANO_MAXIMO) {
      return NextResponse.json({ ok: false, error: "La imagen supera el tamaño máximo de 8MB." }, { status: 400 });
    }

    const productoId = Number(productoIdRaw);
    if (!productoId || Number.isNaN(productoId)) {
      return NextResponse.json({ ok: false, error: "productoId inválido." }, { status: 400 });
    }
    const colorId = colorIdRaw ? Number(colorIdRaw) : null;

    const producto = await db.producto.findUnique({ where: { id: productoId } });
    if (!producto) {
      return NextResponse.json({ ok: false, error: "El producto no existe." }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sufijo = Math.random().toString(36).slice(2, 8);
    const key = `productos/${productoId}/${Date.now()}-${sufijo}.${extensionDe(file.type)}`;

    await subirObjeto(key, buffer, file.type);

    const totalActual = await db.productoImagen.count({ where: { productoId } });

    const imagen = await db.productoImagen.create({
      data: {
        productoId,
        colorId: colorId && !Number.isNaN(colorId) ? colorId : null,
        key,
        orden: totalActual,
        esPrincipal: totalActual === 0,
      },
    });

    revalidatePath("/productos");
    revalidatePath("/tienda");

    return NextResponse.json({ ok: true, data: imagen });
  } catch (e) {
    console.error("Error subiendo imagen:", e);
    return NextResponse.json({ ok: false, error: "No se pudo subir la imagen." }, { status: 500 });
  }
}
