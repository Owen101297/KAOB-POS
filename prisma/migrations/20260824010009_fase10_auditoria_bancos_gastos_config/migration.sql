-- AlterTable
ALTER TABLE "configuracion" ADD COLUMN     "ciudad" TEXT DEFAULT 'Bogotá',
ADD COLUMN     "email" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "mensajeTicket" TEXT DEFAULT '¡Gracias por su compra!',
ADD COLUMN     "pieTicket" TEXT DEFAULT 'Conserve este ticket para cambios o garantías (plazo máximo 30 días).',
ADD COLUMN     "regimen" TEXT DEFAULT 'Responsable de IVA';

-- CreateTable
CREATE TABLE "auditorias" (
    "id" SERIAL NOT NULL,
    "modulo" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "descripcion" TEXT NOT NULL,
    "detalles" TEXT,
    "usuario" TEXT NOT NULL DEFAULT 'Administrador',
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas_bancarias" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'AHORROS',
    "numeroCuenta" TEXT,
    "titular" TEXT,
    "saldoActual" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT DEFAULT '#2563eb',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_bancarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_bancarios" (
    "id" SERIAL NOT NULL,
    "cuentaBancariaId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,
    "saldoResultante" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referencia" TEXT,
    "concepto" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'OTRO',
    "conciliado" BOOLEAN NOT NULL DEFAULT false,
    "conciliacionId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_bancarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conciliaciones_bancarias" (
    "id" SERIAL NOT NULL,
    "cuentaBancariaId" INTEGER NOT NULL,
    "fechaCorte" TIMESTAMP(3) NOT NULL,
    "saldoExtracto" INTEGER NOT NULL,
    "saldoLibros" INTEGER NOT NULL,
    "diferencia" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "cerradaEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conciliaciones_bancarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos" (
    "id" SERIAL NOT NULL,
    "concepto" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'VARIOS',
    "monto" INTEGER NOT NULL,
    "metodoPago" "metodo_pago" NOT NULL DEFAULT 'EFECTIVO',
    "cuentaBancariaId" INTEGER,
    "comprobante" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nota" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'REGISTRADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auditorias_modulo_idx" ON "auditorias"("modulo");

-- CreateIndex
CREATE INDEX "auditorias_accion_idx" ON "auditorias"("accion");

-- CreateIndex
CREATE INDEX "auditorias_createdAt_idx" ON "auditorias"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_bancarias_nombre_key" ON "cuentas_bancarias"("nombre");

-- CreateIndex
CREATE INDEX "movimientos_bancarios_cuentaBancariaId_idx" ON "movimientos_bancarios"("cuentaBancariaId");

-- CreateIndex
CREATE INDEX "movimientos_bancarios_fecha_idx" ON "movimientos_bancarios"("fecha");

-- CreateIndex
CREATE INDEX "movimientos_bancarios_conciliado_idx" ON "movimientos_bancarios"("conciliado");

-- CreateIndex
CREATE INDEX "conciliaciones_bancarias_cuentaBancariaId_idx" ON "conciliaciones_bancarias"("cuentaBancariaId");

-- CreateIndex
CREATE INDEX "gastos_categoria_idx" ON "gastos"("categoria");

-- CreateIndex
CREATE INDEX "gastos_fecha_idx" ON "gastos"("fecha");

-- CreateIndex
CREATE INDEX "gastos_estado_idx" ON "gastos"("estado");

-- AddForeignKey
ALTER TABLE "movimientos_bancarios" ADD CONSTRAINT "movimientos_bancarios_cuentaBancariaId_fkey" FOREIGN KEY ("cuentaBancariaId") REFERENCES "cuentas_bancarias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_bancarios" ADD CONSTRAINT "movimientos_bancarios_conciliacionId_fkey" FOREIGN KEY ("conciliacionId") REFERENCES "conciliaciones_bancarias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliaciones_bancarias" ADD CONSTRAINT "conciliaciones_bancarias_cuentaBancariaId_fkey" FOREIGN KEY ("cuentaBancariaId") REFERENCES "cuentas_bancarias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_cuentaBancariaId_fkey" FOREIGN KEY ("cuentaBancariaId") REFERENCES "cuentas_bancarias"("id") ON DELETE SET NULL ON UPDATE CASCADE;
