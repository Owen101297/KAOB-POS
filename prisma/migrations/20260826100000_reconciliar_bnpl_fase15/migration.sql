-- Migration: 20260826100000_reconciliar_bnpl_fase15
-- Reconcilia la deriva de la Fase 15 (BNPL): en producción la BD ya tenía estos
-- objetos (aplicados por db push histórico), pero el historial de migraciones en
-- repo terminaba en Fase 10. Los renders de staging/otros entornos que partean del
-- historial carecen de ellos y el código (schema.prisma) falla al crear pagos.
--
-- Para que el historial sea completo y `migrate deploy` sea seguro también en
-- BDs que ya los tengan, esta migración es defensiva con
-- ALTER TABLE ... IF NOT EXISTS donde PostgreSQL lo permite; en el caso de la
-- tabla nueva y el enum se evita el error si ya existen.

-- Columnas BNPL en ventas_pagos
ALTER TABLE "ventas_pagos" ADD COLUMN IF NOT EXISTS "desembolsado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ventas_pagos" ADD COLUMN IF NOT EXISTS "desembolsoId" INTEGER;

-- Tabla desembolsos_plataforma (crea solo si no existe)
CREATE TABLE IF NOT EXISTS "desembolsos_plataforma" (
    "id" SERIAL NOT NULL,
    "consecutivo" INTEGER NOT NULL,
    "plataforma" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montoBruto" INTEGER NOT NULL,
    "comision" INTEGER NOT NULL DEFAULT 0,
    "retenciones" INTEGER NOT NULL DEFAULT 0,
    "montoNeto" INTEGER NOT NULL,
    "cuentaBancariaId" INTEGER,
    "referenciaBancaria" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'LIQUIDADO',
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "desembolsos_plataforma_pkey" PRIMARY KEY ("id")
);

-- Índices (evitando duplicar los que ya existían en producción)
CREATE UNIQUE INDEX IF NOT EXISTS "desembolsos_plataforma_consecutivo_key" ON "desembolsos_plataforma"("consecutivo");
CREATE INDEX IF NOT EXISTS "desembolsos_plataforma_plataforma_idx" ON "desembolsos_plataforma"("plataforma");
CREATE INDEX IF NOT EXISTS "desembolsos_plataforma_fecha_idx" ON "desembolsos_plataforma"("fecha");
CREATE INDEX IF NOT EXISTS "desembolsos_plataforma_estado_idx" ON "desembolsos_plataforma"("estado");
CREATE INDEX IF NOT EXISTS "ventas_pagos_metodo_idx" ON "ventas_pagos"("metodo");
CREATE INDEX IF NOT EXISTS "ventas_pagos_desembolsado_idx" ON "ventas_pagos"("desembolsado");

-- FKs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ventas_pagos_desembolsoId_fkey') THEN
        ALTER TABLE "ventas_pagos" ADD CONSTRAINT "ventas_pagos_desembolsoId_fkey" FOREIGN KEY ("desembolsoId") REFERENCES "desembolsos_plataforma"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'desembolsos_plataforma_cuentaBancariaId_fkey') THEN
        ALTER TABLE "desembolsos_plataforma" ADD CONSTRAINT "desembolsos_plataforma_cuentaBancariaId_fkey" FOREIGN KEY ("cuentaBancariaId") REFERENCES "cuentas_bancarias"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Valores BNPL del enum metodo_pago (ALTER TYPE ... ADD VALUE no admite IF NOT
-- EXISTS en PostgreSQL ni corre dentro de una transacción; el bloque DO con
-- control de duplicado emula la idempotencia fuera de la transacción de la
-- migración por ser ejecutada con `migrate deploy`. Nota: si tu entorno ya los
-- tiene, la sentencia queda vacía.)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='metodo_pago' AND e.enumlabel='ADDI') THEN
        ALTER TYPE "metodo_pago" ADD VALUE 'ADDI';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='metodo_pago' AND e.enumlabel='SISTECREDITO') THEN
        ALTER TYPE "metodo_pago" ADD VALUE 'SISTECREDITO';
    END IF;
END $$;
