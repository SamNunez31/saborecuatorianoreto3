require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function test() {
  const email = 'admin@sabor.ec';
  const password = 'admin123';
  
  const usuario = await prisma.usuario.findUnique({
    where:{ email },
    include:{ rol:true, cliente:true }
  });
  
  console.log('Usuario encontrado:', !!usuario);
  if (usuario) {
    console.log('Activo:', usuario.activo);
    const valido = await bcrypt.compare(password, usuario.passwordHash);
    console.log('Password hash en DB:', usuario.passwordHash);
    console.log('Password ingresada válida:', valido);
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
