-- Migration: 20261109100000_pagos_online
-- Checkout de tienda con pagos online (spec 002): tabla pagos_online + enums.
-- Idempotente (estilo 20260826100000_reconciliar_bnpl_fase15): los entornos que
-- ya tengan los objetos (db push histórico) no fallan al ejecutar migrate deploy.

-- Enums (ALTER TYPE ... ADD VALUE no admite IF NOT EXISTS; el bloque DO emula
-- idempotencia. ALTER TYPE no corre dentro de la transacción de la migración,
-- por eso el manejo defensivo está fuera de sentencias regulares).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'proveedor_pago_online') THEN
        CREATE TYPE "proveedor_pago_online" AS ENUM ('WOMPI', 'BOLD', 'ADDI', 'SISTECREDITO', 'FIADO', 'CONTRAENTREGA');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_pago_online') THEN
        CREATE TYPE "estado_pago_online" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'EN_TRANSITO', 'CANCELADO');
    END IF;
END $$;

-- Tabla pagos_online (crea solo si no existe)
CREATE TABLE IF NOT EXISTS "pagos_online" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "proveedor" "proveedor_pago_online" NOT NULL,
    "estado" "estado_pago_online" NOT NULL DEFAULT 'PENDIENTE',
    "referenciaExterna" TEXT,
    "monto" INTEGER NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'COP',
    "emailCliente" TEXT,
    "documentoCliente" TEXT,
    "webhookEventos" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_online_pkey" PRIMARY KEY ("id")
);

-- Índices y unicidad (IF NOT EXISTS evita duplicar en BDs ya migradas a mano)
CREATE UNIQUE INDEX IF NOT EXISTS "pagos_online_pedidoId_key" ON "pagos_online"("pedidoId");
CREATE UNIQUE INDEX IF NOT EXISTS "pagos_online_referenciaExterna_key" ON "pagos_online"("referenciaExterna");
CREATE INDEX IF NOT EXISTS "pagos_online_proveedor_idx" ON "pagos_online"("proveedor");
CREATE INDEX IF NOT EXISTS "pagos_online_estado_idx" ON "pagos_online"("estado");

-- FK hacia pedidos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pagos_online_pedidoId_fkey') THEN
        ALTER TABLE "pagos_online" ADD CONSTRAINT "pagos_online_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
