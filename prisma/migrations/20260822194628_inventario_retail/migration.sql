-- CreateEnum
CREATE TYPE "genero" AS ENUM ('DAMA', 'CABALLERO', 'NINO', 'UNISEX');

-- CreateEnum
CREATE TYPE "calidad" AS ENUM ('PREMIUM', 'ALTA', 'ESTANDAR', 'ECONOMICA');

-- CreateEnum
CREATE TYPE "tipo_movimiento" AS ENUM ('INICIAL', 'AJUSTE_ENTRADA', 'AJUSTE_SALIDA', 'TRASLADO_SALIDA', 'TRASLADO_ENTRADA', 'COMPRA', 'DEVOLUCION');

-- CreateTable
CREATE TABLE "bodegas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bodegas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marcas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "padreId" INTEGER,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupos_talla" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "grupos_talla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tallas" (
    "id" SERIAL NOT NULL,
    "grupoId" INTEGER NOT NULL,
    "valor" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tallas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colores" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "hex" TEXT,

    CONSTRAINT "colores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" SERIAL NOT NULL,
    "referencia" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoriaId" INTEGER NOT NULL,
    "marcaId" INTEGER,
    "genero" "genero",
    "material" TEXT,
    "calidad" "calidad",
    "temporada" TEXT,
    "costo" INTEGER NOT NULL DEFAULT 0,
    "precioBase" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variantes" (
    "id" SERIAL NOT NULL,
    "productoId" INTEGER NOT NULL,
    "colorId" INTEGER NOT NULL,
    "tallaId" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "precioOverride" INTEGER,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "variantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_bodega" (
    "id" SERIAL NOT NULL,
    "varianteId" INTEGER NOT NULL,
    "bodegaId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "minimo" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "stock_bodega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" SERIAL NOT NULL,
    "varianteId" INTEGER NOT NULL,
    "tipo" "tipo_movimiento" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "bodegaOrigenId" INTEGER,
    "bodegaDestinoId" INTEGER,
    "costoUnitario" INTEGER,
    "nota" TEXT,
    "trasladoId" INTEGER,
    "refDocumento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traslados" (
    "id" SERIAL NOT NULL,
    "bodegaOrigenId" INTEGER NOT NULL,
    "bodegaDestinoId" INTEGER NOT NULL,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "traslados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traslados_detalle" (
    "id" SERIAL NOT NULL,
    "trasladoId" INTEGER NOT NULL,
    "varianteId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "traslados_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bodegas_nombre_key" ON "bodegas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "marcas_nombre_key" ON "marcas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "grupos_talla_nombre_key" ON "grupos_talla"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tallas_grupoId_valor_key" ON "tallas"("grupoId", "valor");

-- CreateIndex
CREATE UNIQUE INDEX "colores_nombre_key" ON "colores"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "productos_referencia_key" ON "productos"("referencia");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_sku_key" ON "variantes"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_productoId_colorId_tallaId_key" ON "variantes"("productoId", "colorId", "tallaId");

-- CreateIndex
CREATE INDEX "stock_bodega_bodegaId_idx" ON "stock_bodega"("bodegaId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_bodega_varianteId_bodegaId_key" ON "stock_bodega"("varianteId", "bodegaId");

-- CreateIndex
CREATE INDEX "movimientos_inventario_varianteId_idx" ON "movimientos_inventario"("varianteId");

-- CreateIndex
CREATE INDEX "movimientos_inventario_createdAt_idx" ON "movimientos_inventario"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "traslados_detalle_trasladoId_varianteId_key" ON "traslados_detalle"("trasladoId", "varianteId");

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_padreId_fkey" FOREIGN KEY ("padreId") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tallas" ADD CONSTRAINT "tallas_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "grupos_talla"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "marcas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantes" ADD CONSTRAINT "variantes_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantes" ADD CONSTRAINT "variantes_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "colores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantes" ADD CONSTRAINT "variantes_tallaId_fkey" FOREIGN KEY ("tallaId") REFERENCES "tallas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_bodega" ADD CONSTRAINT "stock_bodega_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "variantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_bodega" ADD CONSTRAINT "stock_bodega_bodegaId_fkey" FOREIGN KEY ("bodegaId") REFERENCES "bodegas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "variantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_bodegaOrigenId_fkey" FOREIGN KEY ("bodegaOrigenId") REFERENCES "bodegas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_bodegaDestinoId_fkey" FOREIGN KEY ("bodegaDestinoId") REFERENCES "bodegas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_trasladoId_fkey" FOREIGN KEY ("trasladoId") REFERENCES "traslados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traslados" ADD CONSTRAINT "traslados_bodegaOrigenId_fkey" FOREIGN KEY ("bodegaOrigenId") REFERENCES "bodegas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traslados" ADD CONSTRAINT "traslados_bodegaDestinoId_fkey" FOREIGN KEY ("bodegaDestinoId") REFERENCES "bodegas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traslados_detalle" ADD CONSTRAINT "traslados_detalle_trasladoId_fkey" FOREIGN KEY ("trasladoId") REFERENCES "traslados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traslados_detalle" ADD CONSTRAINT "traslados_detalle_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "variantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
