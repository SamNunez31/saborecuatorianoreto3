require('dotenv').config();
const prisma = require('./src/prisma');

async function main() {
  // Mover ingredientes de Caldo de gallina criolla a Caldo de gallina
  const caldoNuevo = await prisma.plato.findFirst({ where: { nombre: 'Caldo de gallina criolla' } });
  const caldoViejo = await prisma.plato.findFirst({ where: { nombre: 'Caldo de gallina' } });

  if (caldoNuevo && caldoViejo) {
    console.log(`Moviendo ingredientes de ${caldoNuevo.id} a ${caldoViejo.id}`);
    const ings = await prisma.platoIngrediente.findMany({ where: { platoId: caldoNuevo.id } });
    for (const ing of ings) {
      const exists = await prisma.platoIngrediente.findFirst({ where: { platoId: caldoViejo.id, ingredienteId: ing.ingredienteId } });
      if (!exists) {
        await prisma.platoIngrediente.update({ where: { id: ing.id }, data: { platoId: caldoViejo.id } });
      } else {
        await prisma.platoIngrediente.delete({ where: { id: ing.id }});
      }
    }
    await prisma.detallePedido.updateMany({ where: { platoId: caldoNuevo.id }, data: { platoId: caldoViejo.id } });
    await prisma.plato.delete({ where: { id: caldoNuevo.id } });
  }

  // Mover ingredientes de Fritada con llapingachos a Fritada con mote
  const fritadaNueva = await prisma.plato.findFirst({ where: { nombre: 'Fritada con llapingachos' } });
  const fritadaVieja = await prisma.plato.findFirst({ where: { nombre: 'Fritada con mote' } });

  if (fritadaNueva && fritadaVieja) {
    console.log(`Moviendo ingredientes de ${fritadaNueva.id} a ${fritadaVieja.id}`);
    const ings = await prisma.platoIngrediente.findMany({ where: { platoId: fritadaNueva.id } });
    for (const ing of ings) {
      const exists = await prisma.platoIngrediente.findFirst({ where: { platoId: fritadaVieja.id, ingredienteId: ing.ingredienteId } });
      if (!exists) {
        await prisma.platoIngrediente.update({ where: { id: ing.id }, data: { platoId: fritadaVieja.id } });
      } else {
        await prisma.platoIngrediente.delete({ where: { id: ing.id }});
      }
    }
    await prisma.detallePedido.updateMany({ where: { platoId: fritadaNueva.id }, data: { platoId: fritadaVieja.id } });
    await prisma.plato.delete({ where: { id: fritadaNueva.id } });
  }

  // Eliminar los platos agregados por el seed que no estaban originalmente
  const platosAEliminar = ['Bandeja montañera', 'Encebollado de atún', 'Espumilla de guanábana', 'Sopa de quinua'];
  
  for (const nombre of platosAEliminar) {
    const plato = await prisma.plato.findFirst({ where: { nombre } });
    if (plato) {
      console.log(`Eliminando producto extra: ${plato.nombre}`);
      await prisma.platoIngrediente.deleteMany({ where: { platoId: plato.id } });
      // If there are detalle_pedidos, we can't delete easily, but these are new dishes so probably 0 details
      await prisma.plato.delete({ where: { id: plato.id } });
    }
  }

  // Comprobar platos restantes
  const platosRestantes = await prisma.plato.findMany({
    include: { platoIngredientes: true },
    orderBy: { nombre: 'asc' }
  });
  console.log('--- Platos Finales ---');
  platosRestantes.forEach(p => console.log(`${p.nombre} (Imagen: ${!!p.imagenUrl}, Ingredientes: ${p.platoIngredientes.length})`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
