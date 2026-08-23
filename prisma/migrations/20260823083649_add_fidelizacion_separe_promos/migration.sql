-- CreateTable
CREATE TABLE "planes_separe" (
    "id" SERIAL NOT NULL,
    "consecutivo" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "bodegaId" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "saldoPendiente" INTEGER NOT NULL,
    "fechaLimite" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planes_separe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planes_separe_items" (
    "id" SERIAL NOT NULL,
    "planSepareId" INTEGER NOT NULL,
    "varianteId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,

    CONSTRAINT "planes_separe_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abonos_plan_separe" (
    "id" SERIAL NOT NULL,
    "planSepareId" INTEGER NOT NULL,
    "monto" INTEGER NOT NULL,
    "metodo" "metodo_pago" NOT NULL DEFAULT 'EFECTIVO',
    "referencia" TEXT,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abonos_plan_separe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_puntos" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "puntos" INTEGER NOT NULL,
    "saldoResultante" INTEGER NOT NULL,
    "referencia" TEXT,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_puntos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promociones" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "montoMinimo" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promociones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_cards" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "montoInicial" INTEGER NOT NULL,
    "saldoActual" INTEGER NOT NULL,
    "clienteId" INTEGER,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    "fechaVencimiento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gift_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "planes_separe_consecutivo_key" ON "planes_separe"("consecutivo");

-- CreateIndex
CREATE INDEX "planes_separe_clienteId_idx" ON "planes_separe"("clienteId");

-- CreateIndex
CREATE INDEX "planes_separe_estado_idx" ON "planes_separe"("estado");

-- CreateIndex
CREATE INDEX "abonos_plan_separe_planSepareId_idx" ON "abonos_plan_separe"("planSepareId");

-- CreateIndex
CREATE INDEX "movimientos_puntos_clienteId_idx" ON "movimientos_puntos"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "promociones_nombre_key" ON "promociones"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "gift_cards_codigo_key" ON "gift_cards"("codigo");

-- CreateIndex
CREATE INDEX "gift_cards_codigo_idx" ON "gift_cards"("codigo");

-- AddForeignKey
ALTER TABLE "planes_separe" ADD CONSTRAINT "planes_separe_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes_separe" ADD CONSTRAINT "planes_separe_bodegaId_fkey" FOREIGN KEY ("bodegaId") REFERENCES "bodegas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes_separe_items" ADD CONSTRAINT "planes_separe_items_planSepareId_fkey" FOREIGN KEY ("planSepareId") REFERENCES "planes_separe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes_separe_items" ADD CONSTRAINT "planes_separe_items_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "variantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonos_plan_separe" ADD CONSTRAINT "abonos_plan_separe_planSepareId_fkey" FOREIGN KEY ("planSepareId") REFERENCES "planes_separe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_puntos" ADD CONSTRAINT "movimientos_puntos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
