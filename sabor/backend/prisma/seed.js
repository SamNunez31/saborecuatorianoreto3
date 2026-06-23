require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Roles
  await prisma.role.upsert({ where:{nombre:'admin'},   update:{}, create:{nombre:'admin'} });
  await prisma.role.upsert({ where:{nombre:'cajero'},  update:{}, create:{nombre:'cajero'} });
  await prisma.role.upsert({ where:{nombre:'cliente'}, update:{}, create:{nombre:'cliente'} });
  console.log('✓ Roles');

  // Formas de pago
  for (const tipo of ['Efectivo','Tarjeta de crédito','Tarjeta de débito','Transferencia bancaria']) {
    await prisma.formaPago.upsert({ where:{tipo}, update:{}, create:{tipo} });
  }
  console.log('✓ Formas de pago');

  // Categorías
  for (const nombre of ['Entradas','Sopas','Platos fuertes','Postres','Bebidas']) {
    await prisma.categoriaPlato.upsert({ where:{nombre}, update:{}, create:{nombre} });
  }
  console.log('✓ Categorías');

  // Platos
  const cats = Object.fromEntries((await prisma.categoriaPlato.findMany()).map(c=>[c.nombre,c.id]));
  const platos = [
    { nombre:'Ceviche de camarón',      categoriaId:cats['Entradas'],       precio:8.50,  descripcion:'Camarones frescos en limón con cebolla y cilantro' },
    { nombre:'Empanadas de viento',      categoriaId:cats['Entradas'],       precio:3.00,  descripcion:'Empanadas fritas rellenas de queso, 3 unidades'      },
    { nombre:'Sopa de quinua',           categoriaId:cats['Sopas'],          precio:5.50,  descripcion:'Sopa andina con quinua, papas y hierbas'             },
    { nombre:'Caldo de gallina criolla', categoriaId:cats['Sopas'],          precio:7.00,  descripcion:'Caldo casero con gallina de campo'                   },
    { nombre:'Seco de pollo',            categoriaId:cats['Platos fuertes'], precio:9.50,  descripcion:'Pollo en cerveza con arroz, menestra y maduro'        },
    { nombre:'Fritada con llapingachos', categoriaId:cats['Platos fuertes'], precio:10.00, descripcion:'Cerdo frito con tortillas de papa y encurtido'        },
    { nombre:'Bandeja montañera',        categoriaId:cats['Platos fuertes'], precio:11.50, descripcion:'Seco, arroz, menestra, tajadas y chorizo'             },
    { nombre:'Encebollado de atún',      categoriaId:cats['Platos fuertes'], precio:8.00,  descripcion:'Sopa de yuca con atún fresco'                        },
    { nombre:'Tres leches',              categoriaId:cats['Postres'],        precio:4.00,  descripcion:'Bizcocho bañado en tres tipos de leche'               },
    { nombre:'Espumilla de guanábana',   categoriaId:cats['Postres'],        precio:3.50,  descripcion:'Merengue artesanal con pulpa de guanábana'            },
    { nombre:'Jugo de naranjilla',       categoriaId:cats['Bebidas'],        precio:2.50,  descripcion:'Jugo natural de naranjilla'                           },
    { nombre:'Colada morada',            categoriaId:cats['Bebidas'],        precio:3.00,  descripcion:'Bebida tradicional con mora y especias'               },
  ];
  await prisma.plato.createMany({ data: platos, skipDuplicates: true });
  console.log('✓ Platos');

  // Admin
  const adminRol = await prisma.role.findUnique({ where:{nombre:'admin'} });
  const adminHash = await bcrypt.hash('admin123', 10);
  await prisma.usuario.upsert({
    where:{email:'admin@sabor.ec'}, update:{},
    create:{
      nombre:'Administrador', email:'admin@sabor.ec',
      passwordHash:adminHash, rolId:adminRol.id,
      cliente:{ create:{ nombre:'Administrador', apellido:'Sistema' } }
    }
  });

  // Cliente de prueba
  const clienteRol = await prisma.role.findUnique({ where:{nombre:'cliente'} });
  const clienteHash = await bcrypt.hash('cliente123', 10);
  await prisma.usuario.upsert({
    where:{email:'cliente@prueba.ec'}, update:{},
    create:{
      nombre:'María', email:'cliente@prueba.ec',
      passwordHash:clienteHash, rolId:clienteRol.id,
      cliente:{ create:{ nombre:'María', apellido:'González', telefono:'0999123456', direccion:'Av. Colón N12-34, Quito' } }
    }
  });

  console.log('✓ Usuarios creados');
  console.log('\n✅ Seed completado');
  console.log('   admin@sabor.ec     / admin123');
  console.log('   cliente@prueba.ec  / cliente123');
}

main().catch(e=>{console.error(e);process.exit(1);}).finally(()=>prisma.$disconnect());
