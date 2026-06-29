const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ingredientesRequeridos = [
    { nombre: 'Cebolla', tipo: 'vegetal' },
    { nombre: 'Cilantro', tipo: 'hierba' },
    { nombre: 'Limón', tipo: 'fruta' },
    { nombre: 'Ají', tipo: 'salsa' },
    { nombre: 'Tomate', tipo: 'vegetal' },
  ];

  // 1. Asegurarnos de que los ingredientes existan en la tabla Ingrediente
  const ingredientesIds = {};
  for (const req of ingredientesRequeridos) {
    let ing = await prisma.ingrediente.findFirst({ where: { nombre: req.nombre } });
    if (!ing) {
      ing = await prisma.ingrediente.create({ data: req });
    }
    ingredientesIds[req.nombre] = ing.id;
  }

  // 2. Obtener todos los platos
  const platos = await prisma.plato.findMany();

  // 3. Agregar los ingredientes a todos los platos
  for (const plato of platos) {
    for (const req of ingredientesRequeridos) {
      const ingredienteId = ingredientesIds[req.nombre];
      // Check if this plato already has this ingrediente
      const existing = await prisma.platoIngrediente.findFirst({
        where: { platoId: plato.id, ingredienteId: ingredienteId }
      });

      if (!existing) {
        await prisma.platoIngrediente.create({
          data: {
            platoId: plato.id,
            ingredienteId: ingredienteId,
            esRemovible: req.nombre !== 'Limón' // Limón es fijo según la imagen
          }
        });
      } else {
        // Asegurarnos de que el Limón sea fijo y los demás removibles
        await prisma.platoIngrediente.update({
          where: { id: existing.id },
          data: { esRemovible: req.nombre !== 'Limón' }
        });
      }
    }
  }

  console.log('✅ Ingredientes agregados a todos los platos exitosamente.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
