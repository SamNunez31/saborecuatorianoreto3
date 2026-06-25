require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.usuario.findMany({
    include: { rol: true }
  });
  console.log('--- Users in DB ---');
  for (const user of users) {
    console.log({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      activo: user.activo,
      rol: user.rol?.nombre,
      passwordHash: user.passwordHash
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
