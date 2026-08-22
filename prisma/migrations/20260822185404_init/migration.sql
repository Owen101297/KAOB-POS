-- CreateTable
CREATE TABLE "configuracion" (
    "id" SERIAL NOT NULL,
    "nombreTienda" TEXT NOT NULL DEFAULT 'Mi Tienda',
    "nit" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "metaDiaria" INTEGER NOT NULL DEFAULT 1000000,
    "puntosPorMonto" INTEGER NOT NULL DEFAULT 10000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("id")
);
