import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

let cliente: S3Client | null = null;

function obtenerCliente(): S3Client {
  if (cliente) return cliente;
  cliente = new S3Client({
    region: process.env.BUCKET_REGION || "auto",
    endpoint: process.env.BUCKET_ENDPOINT,
    credentials: {
      accessKeyId: process.env.BUCKET_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.BUCKET_SECRET_ACCESS_KEY || "",
    },
  });
  return cliente;
}

const BUCKET = () => process.env.BUCKET_NAME || "";

export function storageConfigurado(): boolean {
  return Boolean(
    process.env.BUCKET_NAME &&
      process.env.BUCKET_ACCESS_KEY_ID &&
      process.env.BUCKET_SECRET_ACCESS_KEY &&
      process.env.BUCKET_ENDPOINT
  );
}

export async function subirObjeto(key: string, cuerpo: Buffer, contentType: string): Promise<void> {
  await obtenerCliente().send(
    new PutObjectCommand({
      Bucket: BUCKET(),
      Key: key,
      Body: cuerpo,
      ContentType: contentType,
    })
  );
}

export async function eliminarObjeto(key: string): Promise<void> {
  await obtenerCliente().send(new DeleteObjectCommand({ Bucket: BUCKET(), Key: key }));
}

export async function leerObjeto(key: string): Promise<{ cuerpo: Uint8Array; contentType: string } | null> {
  try {
    const resultado = await obtenerCliente().send(new GetObjectCommand({ Bucket: BUCKET(), Key: key }));
    const cuerpo = await resultado.Body?.transformToByteArray();
    if (!cuerpo) return null;
    return { cuerpo, contentType: resultado.ContentType || "application/octet-stream" };
  } catch {
    return null;
  }
}

/** URL estable que sirve la imagen a través del proxy interno (el bucket es privado) */
export function urlImagen(key: string): string {
  return `/api/media/${key}`;
}
