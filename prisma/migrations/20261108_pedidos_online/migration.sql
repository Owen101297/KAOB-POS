-- Migration: 20261108_pedidos_online
-- Feature: specs/001-ventas-online-real (Pedido + PedidoItem)
--
-- IMPORTANTE (deriva de migraciones detectada en research.md):
-- El historial en prisma/migrations/ termina en la Fase 10; los cambios BNPL
-- de la Fase 15 (enum metodo_pago ADDI/SISTECREDITO, ventas_pagos.desembolsado,
-- tabla desembolsos_plataforma) NO están en esta carpeta. Por decisión del
-- plan, esta migración NO reintenta recrearlos: incluye únicamente los
-- objetos 100% nuevos del feature (sin colisión incluso en BDs deribadas
-- por db push). La conciliación del historial BNPL queda documentada como
-- tarea aparte antes de cualquier deploy a producción.

-- CreateEnum
CREATE TYPE "estado_pedido" AS ENUM ('PENDIENTE', 'EMPACADO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "pedidos" (
    "id" SERIAL NOT NULL,
    "referencia" TEXT NOT NULL,
    "nombreContacto" TEXT NOT NULL,
    "telefonoContacto" TEXT NOT NULL,
    "ciudad" TEXT,
    "direccion" TEXT,
    "notas" TEXT,
    "total" INTEGER NOT NULL DEFAULT 0,
    "estado" "estado_pedido" NOT NULL DEFAULT 'PENDIENTE',
    "estadoPor" TEXT,
    "estadoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_items" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "varianteId" INTEGER NOT NULL,
    "referencia" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tallaValor" TEXT NOT NULL,
    "colorNombre" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,

    CONSTRAINT "pedidos_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_referencia_key" ON "pedidos"("referencia");

-- CreateIndex
CREATE INDEX "pedidos_estado_idx" ON "pedidos"("estado");

-- CreateIndex
CREATE INDEX "pedidos_createdAt_idx" ON "pedidos"("createdAt");

-- CreateIndex
CREATE INDEX "pedidos_telefonoContacto_idx" ON "pedidos"("telefonoContacto");

-- AddForeignKey
ALTER TABLE "pedidos_items" ADD CONSTRAINT "pedidos_items_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_items" ADD CONSTRAINT "pedidos_items_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "variantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
