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

  // ── Ingredientes ────────────────────────────────────────
  const ingredientesData = [
    { nombre: 'Cebolla',      tipo: 'vegetal' },
    { nombre: 'Cilantro',     tipo: 'hierba' },
    { nombre: 'Limón',        tipo: 'cítrico' },
    { nombre: 'Ají',          tipo: 'condimento' },
    { nombre: 'Tomate',       tipo: 'vegetal' },
    { nombre: 'Queso',        tipo: 'lácteo' },
    { nombre: 'Arroz',        tipo: 'cereal' },
    { nombre: 'Maduro',       tipo: 'fruta' },
    { nombre: 'Menestra',     tipo: 'legumbre' },
    { nombre: 'Papa',         tipo: 'tubérculo' },
    { nombre: 'Yuca',         tipo: 'tubérculo' },
    { nombre: 'Chorizo',      tipo: 'cárnico' },
    { nombre: 'Encurtido',    tipo: 'acompañamiento' },
    { nombre: 'Canela',       tipo: 'especia' },
    { nombre: 'Azúcar',       tipo: 'endulzante' },
  ];

  for (const ing of ingredientesData) {
    const exists = await prisma.ingrediente.findFirst({ where: { nombre: ing.nombre } });
    if (!exists) await prisma.ingrediente.create({ data: ing });
  }

  const ingredientes = Object.fromEntries(
    (await prisma.ingrediente.findMany()).map(i => [i.nombre, i.id])
  );
  console.log('✓ Ingredientes');

  // ── PlatoIngredientes (relación plato ↔ ingrediente) ───
  const platosDb = Object.fromEntries(
    (await prisma.plato.findMany()).map(p => [p.nombre, p.id])
  );

  const platoIngredientesData = [
    // Ceviche de camarón
    { platoId: platosDb['Ceviche de camarón'], ingredienteId: ingredientes['Cebolla'],  esRemovible: true  },
    { platoId: platosDb['Ceviche de camarón'], ingredienteId: ingredientes['Cilantro'], esRemovible: true  },
    { platoId: platosDb['Ceviche de camarón'], ingredienteId: ingredientes['Limón'],    esRemovible: false },
    { platoId: platosDb['Ceviche de camarón'], ingredienteId: ingredientes['Ají'],      esRemovible: true  },
    { platoId: platosDb['Ceviche de camarón'], ingredienteId: ingredientes['Tomate'],   esRemovible: true  },

    // Empanadas de viento
    { platoId: platosDb['Empanadas de viento'], ingredienteId: ingredientes['Queso'],   esRemovible: false },
    { platoId: platosDb['Empanadas de viento'], ingredienteId: ingredientes['Azúcar'],  esRemovible: true  },

    // Sopa de quinua
    { platoId: platosDb['Sopa de quinua'], ingredienteId: ingredientes['Papa'],     esRemovible: true  },
    { platoId: platosDb['Sopa de quinua'], ingredienteId: ingredientes['Cilantro'], esRemovible: true  },
    { platoId: platosDb['Sopa de quinua'], ingredienteId: ingredientes['Queso'],    esRemovible: true  },

    // Caldo de gallina criolla
    { platoId: platosDb['Caldo de gallina criolla'], ingredienteId: ingredientes['Papa'],     esRemovible: true  },
    { platoId: platosDb['Caldo de gallina criolla'], ingredienteId: ingredientes['Cilantro'], esRemovible: true  },
    { platoId: platosDb['Caldo de gallina criolla'], ingredienteId: ingredientes['Cebolla'],  esRemovible: true  },
    { platoId: platosDb['Caldo de gallina criolla'], ingredienteId: ingredientes['Arroz'],    esRemovible: true  },

    // Seco de pollo
    { platoId: platosDb['Seco de pollo'], ingredienteId: ingredientes['Arroz'],    esRemovible: false },
    { platoId: platosDb['Seco de pollo'], ingredienteId: ingredientes['Menestra'], esRemovible: true  },
    { platoId: platosDb['Seco de pollo'], ingredienteId: ingredientes['Maduro'],   esRemovible: true  },
    { platoId: platosDb['Seco de pollo'], ingredienteId: ingredientes['Ají'],      esRemovible: true  },

    // Fritada con llapingachos
    { platoId: platosDb['Fritada con llapingachos'], ingredienteId: ingredientes['Papa'],      esRemovible: false },
    { platoId: platosDb['Fritada con llapingachos'], ingredienteId: ingredientes['Encurtido'], esRemovible: true  },
    { platoId: platosDb['Fritada con llapingachos'], ingredienteId: ingredientes['Maduro'],    esRemovible: true  },
    { platoId: platosDb['Fritada con llapingachos'], ingredienteId: ingredientes['Ají'],       esRemovible: true  },

    // Bandeja montañera
    { platoId: platosDb['Bandeja montañera'], ingredienteId: ingredientes['Arroz'],    esRemovible: false },
    { platoId: platosDb['Bandeja montañera'], ingredienteId: ingredientes['Menestra'], esRemovible: true  },
    { platoId: platosDb['Bandeja montañera'], ingredienteId: ingredientes['Maduro'],   esRemovible: true  },
    { platoId: platosDb['Bandeja montañera'], ingredienteId: ingredientes['Chorizo'],  esRemovible: true  },

    // Encebollado de atún
    { platoId: platosDb['Encebollado de atún'], ingredienteId: ingredientes['Yuca'],    esRemovible: false },
    { platoId: platosDb['Encebollado de atún'], ingredienteId: ingredientes['Cebolla'], esRemovible: true  },
    { platoId: platosDb['Encebollado de atún'], ingredienteId: ingredientes['Cilantro'],esRemovible: true  },
    { platoId: platosDb['Encebollado de atún'], ingredienteId: ingredientes['Ají'],     esRemovible: true  },

    // Tres leches
    { platoId: platosDb['Tres leches'], ingredienteId: ingredientes['Canela'],  esRemovible: true  },

    // Espumilla de guanábana
    { platoId: platosDb['Espumilla de guanábana'], ingredienteId: ingredientes['Azúcar'],  esRemovible: false },
    { platoId: platosDb['Espumilla de guanábana'], ingredienteId: ingredientes['Canela'],  esRemovible: true  },

    // Jugo de naranjilla
    { platoId: platosDb['Jugo de naranjilla'], ingredienteId: ingredientes['Azúcar'],  esRemovible: true  },

    // Colada morada
    { platoId: platosDb['Colada morada'], ingredienteId: ingredientes['Canela'],  esRemovible: false },
    { platoId: platosDb['Colada morada'], ingredienteId: ingredientes['Azúcar'],  esRemovible: true  },
  ];

  // Limpiar relaciones antiguas y crear nuevas
  await prisma.platoIngrediente.deleteMany({});
  await prisma.platoIngrediente.createMany({ data: platoIngredientesData, skipDuplicates: true });
  console.log('✓ PlatoIngredientes');

  // Admin
  const adminRol = await prisma.role.findUnique({ where:{nombre:'admin'} });
  const adminHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.usuario.upsert({
    where:{email:'admin@sabor.ec'},
    update:{ nombre:'Administrador', rolId:adminRol.id },
    create:{
      nombre:'Administrador', email:'admin@sabor.ec',
      passwordHash:adminHash, rolId:adminRol.id,
      cliente:{ create:{ nombre:'Administrador', apellido:'Sistema' } }
    },
    include: { cliente: true }
  });
  if (!adminUser.cliente) {
    await prisma.cliente.create({ data: { usuarioId: adminUser.id, nombre: 'Administrador', apellido: 'Sistema' } });
  }

  // Cliente de prueba
  const clienteRol = await prisma.role.findUnique({ where:{nombre:'cliente'} });
  const clienteHash = await bcrypt.hash('cliente123', 10);
  const clienteUser = await prisma.usuario.upsert({
    where:{email:'cliente@prueba.ec'},
    update:{ nombre:'María', rolId:clienteRol.id },
    create:{
      nombre:'María', email:'cliente@prueba.ec',
      passwordHash:clienteHash, rolId:clienteRol.id,
      cliente:{ create:{ nombre:'María', apellido:'González', telefono:'0999123456', direccion:'Av. Colón N12-34, Quito' } }
    },
    include: { cliente: true }
  });
  if (!clienteUser.cliente) {
    await prisma.cliente.create({
      data: {
        usuarioId: clienteUser.id,
        nombre: 'María',
        apellido: 'González',
        telefono: '0999123456',
        direccion: 'Av. Colón N12-34, Quito'
      }
    });
  }

  console.log('✓ Usuarios creados');

  // Mesas
  const mesas = [
    { numero: 1, capacidad: 2, estado: 'disponible', descripcion: 'Mesa para parejas junto a la ventana' },
    { numero: 2, capacidad: 4, estado: 'disponible', descripcion: 'Mesa familiar central' },
    { numero: 3, capacidad: 4, estado: 'disponible', descripcion: 'Mesa familiar junto al bar' },
    { numero: 4, capacidad: 6, estado: 'disponible', descripcion: 'Mesa grande terraza' },
    { numero: 5, capacidad: 2, estado: 'disponible', descripcion: 'Mesa pequeña terraza' }
  ];
  for (const m of mesas) {
    await prisma.mesa.upsert({
      where: { numero: m.numero },
      update: {},
      create: m
    });
  }
  console.log('✓ Mesas');

  console.log('\n✅ Seed completado');
  console.log('   admin@sabor.ec     / admin123');
  console.log('   cliente@prueba.ec  / cliente123');
}

main().catch(e=>{console.error(e);process.exit(1);}).finally(()=>prisma.$disconnect());

