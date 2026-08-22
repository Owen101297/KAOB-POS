-- CreateTable
CREATE TABLE "compras" (
    "id" SERIAL NOT NULL,
    "consecutivo" INTEGER NOT NULL,
    "numeroFactura" TEXT,
    "proveedorId" INTEGER NOT NULL,
    "bodegaId" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "impuesto" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "estado" "estado_venta" NOT NULL DEFAULT 'COMPLETADA',
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compras_items" (
    "id" SERIAL NOT NULL,
    "compraId" INTEGER NOT NULL,
    "varianteId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "costoUnitario" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,

    CONSTRAINT "compras_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compras_pagos" (
    "id" SERIAL NOT NULL,
    "compraId" INTEGER NOT NULL,
    "metodo" "metodo_pago" NOT NULL,
    "monto" INTEGER NOT NULL,
    "referencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compras_pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_compra" (
    "id" SERIAL NOT NULL,
    "consecutivo" INTEGER NOT NULL,
    "proveedorId" INTEGER NOT NULL,
    "bodegaId" INTEGER NOT NULL,
    "total" INTEGER NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_compra_detalle" (
    "id" SERIAL NOT NULL,
    "ordenId" INTEGER NOT NULL,
    "varianteId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "costoEstimado" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,

    CONSTRAINT "ordenes_compra_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "compras_consecutivo_key" ON "compras"("consecutivo");

-- CreateIndex
CREATE INDEX "compras_proveedorId_idx" ON "compras"("proveedorId");

-- CreateIndex
CREATE INDEX "compras_createdAt_idx" ON "compras"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_compra_consecutivo_key" ON "ordenes_compra"("consecutivo");

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_bodegaId_fkey" FOREIGN KEY ("bodegaId") REFERENCES "bodegas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras_items" ADD CONSTRAINT "compras_items_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "compras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras_items" ADD CONSTRAINT "compras_items_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "variantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras_pagos" ADD CONSTRAINT "compras_pagos_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "compras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_bodegaId_fkey" FOREIGN KEY ("bodegaId") REFERENCES "bodegas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra_detalle" ADD CONSTRAINT "ordenes_compra_detalle_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "ordenes_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra_detalle" ADD CONSTRAINT "ordenes_compra_detalle_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "variantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
