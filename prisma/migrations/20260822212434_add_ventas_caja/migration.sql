-- CreateEnum
CREATE TYPE "tipo_venta" AS ENUM ('VENTA', 'REMISION', 'COTIZACION');

-- CreateEnum
CREATE TYPE "estado_venta" AS ENUM ('COMPLETADA', 'PENDIENTE', 'ANULADA');

-- CreateEnum
CREATE TYPE "metodo_pago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'PUNTOS', 'OTRO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "tipo_movimiento" ADD VALUE 'VENTA';
ALTER TYPE "tipo_movimiento" ADD VALUE 'DEVOLUCION_CLIENTE';

-- CreateTable
CREATE TABLE "ventas" (
    "id" SERIAL NOT NULL,
    "consecutivo" INTEGER NOT NULL,
    "tipo" "tipo_venta" NOT NULL,
    "estado" "estado_venta" NOT NULL DEFAULT 'PENDIENTE',
    "clienteId" INTEGER,
    "vendedorId" INTEGER,
    "domiciliarioId" INTEGER,
    "bodegaId" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "descuento" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas_items" (
    "id" SERIAL NOT NULL,
    "ventaId" INTEGER NOT NULL,
    "varianteId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" INTEGER NOT NULL,
    "costoUnitario" INTEGER NOT NULL,
    "descuento" INTEGER NOT NULL DEFAULT 0,
    "subtotal" INTEGER NOT NULL,

    CONSTRAINT "ventas_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas_pagos" (
    "id" SERIAL NOT NULL,
    "ventaId" INTEGER NOT NULL,
    "metodo" "metodo_pago" NOT NULL,
    "monto" INTEGER NOT NULL,
    "referencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventas_pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones_caja" (
    "id" SERIAL NOT NULL,
    "baseInicial" INTEGER NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTA',
    "bodegaId" INTEGER,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "sesiones_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_caja" (
    "id" SERIAL NOT NULL,
    "sesionId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,
    "referencia" TEXT,
    "ventaId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_caja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ventas_consecutivo_key" ON "ventas"("consecutivo");

-- CreateIndex
CREATE INDEX "ventas_createdAt_idx" ON "ventas"("createdAt");

-- CreateIndex
CREATE INDEX "ventas_clienteId_idx" ON "ventas"("clienteId");

-- CreateIndex
CREATE INDEX "ventas_estado_idx" ON "ventas"("estado");

-- CreateIndex
CREATE INDEX "movimientos_caja_sesionId_idx" ON "movimientos_caja"("sesionId");

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "vendedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_domiciliarioId_fkey" FOREIGN KEY ("domiciliarioId") REFERENCES "domiciliarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_bodegaId_fkey" FOREIGN KEY ("bodegaId") REFERENCES "bodegas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_items" ADD CONSTRAINT "ventas_items_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_items" ADD CONSTRAINT "ventas_items_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "variantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_pagos" ADD CONSTRAINT "ventas_pagos_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_caja" ADD CONSTRAINT "sesiones_caja_bodegaId_fkey" FOREIGN KEY ("bodegaId") REFERENCES "bodegas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "sesiones_caja"("id") ON DELETE CASCADE ON UPDATE CASCADE;
