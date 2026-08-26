import { PrismaClient, Rol } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const email = "admin@kaob.com";
  const password = "Admin123!";
  const nombre = "Administrador";

  const existing = await db.usuario.findUnique({ where: { email } });
  if (existing) {
    console.log("Usuario admin ya existe, omitiendo seed.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.usuario.create({
    data: {
      email,
      nombre,
      passwordHash,
      rol: Rol.ADMIN,
      activo: true,
      emailVerified: new Date(),
    },
  });

  console.log(`Usuario admin creado: ${email} / ${password}`);
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
