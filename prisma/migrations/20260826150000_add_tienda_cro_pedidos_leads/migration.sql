-- CreateTable
CREATE TABLE "pedidos_online" (
    "id" SERIAL NOT NULL,
    "consecutivo" INTEGER NOT NULL,
    "clienteNombre" TEXT NOT NULL,
    "clienteTelefono" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "notas" TEXT,
    "metodoFinanciacion" TEXT NOT NULL DEFAULT 'CONTADO',
    "subtotal" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_online_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_online_items" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "varianteId" INTEGER,
    "nombreProducto" TEXT NOT NULL,
    "referencia" TEXT,
    "tallaValor" TEXT NOT NULL,
    "colorNombre" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,

    CONSTRAINT "pedidos_online_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads_tienda" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "origen" TEXT NOT NULL,
    "cuponOfrecido" TEXT,
    "descuentoPct" INTEGER,
    "contactado" BOOLEAN NOT NULL DEFAULT false,
    "carritoResumen" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_tienda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_online_consecutivo_key" ON "pedidos_online"("consecutivo");

-- CreateIndex
CREATE INDEX "pedidos_online_estado_idx" ON "pedidos_online"("estado");

-- CreateIndex
CREATE INDEX "pedidos_online_createdAt_idx" ON "pedidos_online"("createdAt");

-- CreateIndex
CREATE INDEX "leads_tienda_contactado_idx" ON "leads_tienda"("contactado");

-- CreateIndex
CREATE INDEX "leads_tienda_createdAt_idx" ON "leads_tienda"("createdAt");

-- AddForeignKey
ALTER TABLE "pedidos_online_items" ADD CONSTRAINT "pedidos_online_items_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos_online"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_online_items" ADD CONSTRAINT "pedidos_online_items_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "variantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
