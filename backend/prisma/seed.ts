import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  const categories = [
    { name: 'Calzado', description: 'Zapatos, zapatillas y todo tipo de calzado' },
    { name: 'Ropa', description: 'Camisetas, gorras y prendas de vestir' },
    { name: 'Accesorios', description: 'Mochilas, relojes, gafas y más' },
    { name: 'Electrónica', description: 'Audífonos, gadgets y dispositivos electrónicos' },
  ];

  // Upsert categories
  for (const c of categories) {
    await prisma.category.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
  }

  const products = [
    { name: 'Zapatos Deportivos', description: 'Zapatos ligeros con suela antideslizante, ideales para correr y entrenar.', price: 89.99, image: 'https://picsum.photos/400/300?random=1', stock: 25, category: 'Calzado' },
    { name: 'Camiseta Premium', description: 'Camiseta de algodón 100% con diseño moderno y corte slim fit.', price: 34.99, image: 'https://picsum.photos/400/300?random=2', stock: 50, category: 'Ropa' },
    { name: 'Mochila Urbana', description: 'Mochila resistente al agua con compartimento para laptop de 15 pulgadas.', price: 59.99, image: 'https://picsum.photos/400/300?random=3', stock: 30, category: 'Accesorios' },
    { name: 'Audífonos Bluetooth', description: 'Audífonos inalámbricos con cancelación de ruido y 20 horas de batería.', price: 49.99, image: 'https://picsum.photos/400/300?random=4', stock: 40, category: 'Electrónica' },
    { name: 'Reloj Clásico', description: 'Reloj analógico con correa de cuero genuino y resistencia al agua.', price: 129.99, image: 'https://picsum.photos/400/300?random=5', stock: 15, category: 'Accesorios' },
    { name: 'Gafas de Sol', description: 'Gafas polarizadas con protección UV400 y montura ultraligera.', price: 44.99, image: 'https://picsum.photos/400/300?random=6', stock: 35, category: 'Accesorios' },
    { name: 'Zapatillas Casual', description: 'Zapatillas cómodas para uso diario con plantilla acolchada.', price: 74.99, image: 'https://picsum.photos/400/300?random=7', stock: 20, category: 'Calzado' },
    { name: 'Gorra Snapback', description: 'Gorra ajustable con bordado frontal y visera plana.', price: 24.99, image: 'https://picsum.photos/400/300?random=8', stock: 60, category: 'Ropa' },
  ];

  for (const p of products) {
    // Buscar la categoría por nombre
    const cat = await prisma.category.findUnique({
      where: { name: p.category }
    });

    if (cat) {
      // Buscar si el producto ya existe (por si ejecutamos esto múltiples veces)
      const existingProduct = await prisma.product.findFirst({
        where: { name: p.name }
      });

      if (!existingProduct) {
        await prisma.product.create({
          data: {
            name: p.name,
            description: p.description,
            price: p.price,
            image: p.image,
            stock: p.stock,
            categoryId: cat.id
          }
        });
      }
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
