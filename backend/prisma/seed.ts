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
    { name: 'Zapatos Deportivos', description: 'Calzado deportivo rojo con cordones y suela blanca.', price: 89.99, image: '/images/products/deportivos.jpg', stock: 25, category: 'Calzado' },
    { name: 'Camiseta Premium', description: 'Camiseta blanca de manga corta, cuello redondo y diseño liso.', price: 34.99, image: '/images/products/camiseta.jpg', stock: 50, category: 'Ropa' },
    { name: 'Mochila Urbana', description: 'Mochila azul oscuro con asa superior, cierre de cremallera y bolsillo frontal.', price: 59.99, image: '/images/products/mochila.jpg', stock: 30, category: 'Accesorios' },
    { name: 'Audífonos Bluetooth', description: 'Audífonos de diadema negros con almohadillas y diseño sobre la oreja.', price: 49.99, image: '/images/products/audifonos.jpg', stock: 40, category: 'Electrónica' },
    { name: 'Reloj Clásico', description: 'Reloj analógico con esfera clara, subesferas y correa marrón.', price: 129.99, image: '/images/products/reloj.jpg', stock: 15, category: 'Accesorios' },
    { name: 'Gafas de Sol', description: 'Gafas de sol con lentes redondas oscuras y montura metálica fina.', price: 44.99, image: '/images/products/gafas.jpg', stock: 35, category: 'Accesorios' },
    { name: 'Zapatillas Casual', description: 'Zapatillas de color granate con cordones, franja lateral y suela blanca.', price: 74.99, image: '/images/products/casual.jpg', stock: 20, category: 'Calzado' },
    { name: 'Gorra Snapback', description: 'Gorra blanca con visera curva, diseño liso y paneles de malla.', price: 24.99, image: '/images/products/gorra.jpg', stock: 60, category: 'Ropa' },
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

      // Repair only the original demo records; preserve merchant-edited products.
      if (existingProduct?.image?.startsWith('https://picsum.photos/')) {
        await prisma.product.update({
          where: { id: existingProduct.id },
          data: { description: p.description, image: p.image },
        });
      } else if (!existingProduct) {
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
