import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Permitir serialización de BigInt en respuestas JSON
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:5173',
  });
  app.setGlobalPrefix('api');
  await app.listen(3001);
}
bootstrap();
