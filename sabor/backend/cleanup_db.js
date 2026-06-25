require('dotenv').config();
const prisma = require('./src/prisma');

async function main() {
  const platos = await prisma.plato.findMany({
    include: {
      platoIngredientes: true,
      detalles: true
    }
  });

  // Group by name
  const byName = {};
  for (const p of platos) {
    if (!byName[p.nombre]) byName[p.nombre] = [];
    byName[p.nombre].push(p);
  }

  console.log('--- Limpiando duplicados ---');
  for (const [nombre, group] of Object.entries(byName)) {
    if (group.length <= 1) continue;

    // Sort: prefer ones with image, then most ingredients, then lowest ID
    group.sort((a, b) => {
      if (!!a.imagenUrl !== !!b.imagenUrl) return a.imagenUrl ? -1 : 1;
      if (a.platoIngredientes.length !== b.platoIngredientes.length) return b.platoIngredientes.length - a.platoIngredientes.length;
      return a.id - b.id;
    });

    const primary = group[0];
    console.log(`\nProcesando "${nombre}": Manteniendo ID ${primary.id} (Imagen: ${!!primary.imagenUrl}, Ingredientes: ${primary.platoIngredientes.length})`);

    // For all other duplicates
    for (let i = 1; i < group.length; i++) {
      const dup = group[i];
      console.log(`  Duplicado encontrado: ID ${dup.id} (Imagen: ${!!dup.imagenUrl}, Ingredientes: ${dup.platoIngredientes.length}, DetallesPedido: ${dup.detalles.length})`);
      
      // Move ingredients to primary if primary has 0 ingredients and dup has some
      if (dup.platoIngredientes.length > 0 && primary.platoIngredientes.length === 0) {
        console.log(`    -> Moviendo ${dup.platoIngredientes.length} ingredientes de ${dup.id} a ${primary.id}`);
        for (const ing of dup.platoIngredientes) {
          // Check if primary already has this ingredient to avoid unique constraint issues
          const exists = await prisma.platoIngrediente.findFirst({
            where: { platoId: primary.id, ingredienteId: ing.ingredienteId }
          });
          if (!exists) {
            await prisma.platoIngrediente.update({
              where: { id: ing.id },
              data: { platoId: primary.id }
            });
          } else {
             await prisma.platoIngrediente.delete({ where: { id: ing.id }});
          }
        }
        primary.platoIngredientes = dup.platoIngredientes; // mark as having ingredients
      } else if (dup.platoIngredientes.length > 0) {
        // Just delete them to avoid foreign key errors when deleting the plato
        await prisma.platoIngrediente.deleteMany({ where: { platoId: dup.id } });
      }

      // Move detalle_pedidos to primary
      if (dup.detalles.length > 0) {
        console.log(`    -> Moviendo ${dup.detalles.length} detalle_pedidos de ${dup.id} a ${primary.id}`);
        await prisma.detallePedido.updateMany({
          where: { platoId: dup.id },
          data: { platoId: primary.id }
        });
      }

      // Delete the duplicate
      console.log(`    -> Eliminando plato ID ${dup.id}`);
      await prisma.plato.delete({ where: { id: dup.id } });
    }
  }

  // Also clean up platos with same name but slightly different casing or similar if needed.
  // Wait, looking at the list:
  // "Caldo de gallina" vs "Caldo de gallina criolla" -> let's keep both, but maybe move ingredients? 
  // Let's handle exact names first.
}

main()
  .then(() => console.log('Limpieza completada!'))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
