import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { createValidationPipe } from './validation';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';

// Permitir serialización de BigInt en respuestas JSON
(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function () {
  return Number(this);
};

async function bootstrap() {
  const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'FRONTEND_ORIGIN'];
  for (const key of requiredEnv) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Tienda Virtual API')
    .setDescription('Documentación de la API REST para la Tienda Virtual')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('products', 'Gestión de productos')
    .addTag('cart', 'Carrito de compras')
    .addTag('orders', 'Gestión de pedidos')
    .addTag('billing', 'Facturación')
    .addTag('reviews', 'Reseñas de productos')
    .addTag('users', 'Gestión de usuarios')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(Number(process.env.PORT || 3001));
}
bootstrap();
