-- AlterEnum
ALTER TYPE "metodo_pago" ADD VALUE 'CREDITO';

-- CreateTable
CREATE TABLE "creditos_cliente" (
    "id" SERIAL NOT NULL,
    "consecutivo" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "ventaId" INTEGER,
    "montoTotal" INTEGER NOT NULL,
    "saldoPendiente" INTEGER NOT NULL,
    "diasCredito" INTEGER NOT NULL DEFAULT 30,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creditos_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abonos_credito" (
    "id" SERIAL NOT NULL,
    "creditoId" INTEGER NOT NULL,
    "monto" INTEGER NOT NULL,
    "metodo" "metodo_pago" NOT NULL DEFAULT 'EFECTIVO',
    "referencia" TEXT,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abonos_credito_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creditos_cliente_consecutivo_key" ON "creditos_cliente"("consecutivo");

-- CreateIndex
CREATE UNIQUE INDEX "creditos_cliente_ventaId_key" ON "creditos_cliente"("ventaId");

-- CreateIndex
CREATE INDEX "creditos_cliente_clienteId_idx" ON "creditos_cliente"("clienteId");

-- CreateIndex
CREATE INDEX "creditos_cliente_estado_idx" ON "creditos_cliente"("estado");

-- CreateIndex
CREATE INDEX "creditos_cliente_fechaVencimiento_idx" ON "creditos_cliente"("fechaVencimiento");

-- CreateIndex
CREATE INDEX "abonos_credito_creditoId_idx" ON "abonos_credito"("creditoId");

-- AddForeignKey
ALTER TABLE "creditos_cliente" ADD CONSTRAINT "creditos_cliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditos_cliente" ADD CONSTRAINT "creditos_cliente_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "ventas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonos_credito" ADD CONSTRAINT "abonos_credito_creditoId_fkey" FOREIGN KEY ("creditoId") REFERENCES "creditos_cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
