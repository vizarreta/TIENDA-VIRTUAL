-- Repair the original demo content without changing prices, stock or custom products.
BEGIN;
UPDATE products SET description = 'Calzado deportivo rojo con cordones y suela blanca.', image = '/images/products/deportivos.jpg' WHERE name = 'Zapatos Deportivos' AND image LIKE 'https://picsum.photos/%';
UPDATE products SET description = 'Camiseta blanca de manga corta, cuello redondo y diseño liso.', image = '/images/products/camiseta.jpg' WHERE name = 'Camiseta Premium' AND image LIKE 'https://picsum.photos/%';
UPDATE products SET description = 'Mochila azul oscuro con asa superior, cierre de cremallera y bolsillo frontal.', image = '/images/products/mochila.jpg' WHERE name = 'Mochila Urbana' AND image LIKE 'https://picsum.photos/%';
UPDATE products SET description = 'Audífonos de diadema negros con almohadillas y diseño sobre la oreja.', image = '/images/products/audifonos.jpg' WHERE name = 'Audífonos Bluetooth' AND image LIKE 'https://picsum.photos/%';
UPDATE products SET description = 'Reloj analógico con esfera clara, subesferas y correa marrón.', image = '/images/products/reloj.jpg' WHERE name = 'Reloj Clásico' AND image LIKE 'https://picsum.photos/%';
UPDATE products SET description = 'Gafas de sol con lentes redondas oscuras y montura metálica fina.', image = '/images/products/gafas.jpg' WHERE name = 'Gafas de Sol' AND image LIKE 'https://picsum.photos/%';
UPDATE products SET description = 'Zapatillas de color granate con cordones, franja lateral y suela blanca.', image = '/images/products/casual.jpg' WHERE name = 'Zapatillas Casual' AND image LIKE 'https://picsum.photos/%';
UPDATE products SET description = 'Gorra blanca con visera curva, diseño liso y paneles de malla.', image = '/images/products/gorra.jpg' WHERE name = 'Gorra Snapback' AND image LIKE 'https://picsum.photos/%';
COMMIT;
