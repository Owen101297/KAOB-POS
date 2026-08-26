-- CreateTable
CREATE TABLE "producto_imagenes" (
    "id" SERIAL NOT NULL,
    "productoId" INTEGER NOT NULL,
    "colorId" INTEGER,
    "key" TEXT NOT NULL,
    "alt" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "producto_imagenes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "producto_imagenes_key_key" ON "producto_imagenes"("key");

-- CreateIndex
CREATE INDEX "producto_imagenes_productoId_idx" ON "producto_imagenes"("productoId");

-- AddForeignKey
ALTER TABLE "producto_imagenes" ADD CONSTRAINT "producto_imagenes_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_imagenes" ADD CONSTRAINT "producto_imagenes_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "colores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
