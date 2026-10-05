import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkConnection() {
  try {
    console.log('Conectando a Supabase PostgreSQL...');

    // Intentamos consultar las categorías (deberían haber 4 según el seed)
    const categories = await prisma.category.findMany();
    console.log(`✅ ¡Conexión exitosa! Se encontraron ${categories.length} categorías.`);

    // Intentamos consultar los productos (deberían haber 8 según el seed)
    const products = await prisma.product.findMany();
    console.log(`✅ Se encontraron ${products.length} productos en la base de datos.`);

    console.log('La integración NestJS + Supabase está funcionando perfectamente.');
  } catch (error) {
    console.error('❌ Error al conectar con Supabase:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConnection();
