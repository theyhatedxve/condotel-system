import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { DatabaseErrorFilter } from './security/database-error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // PayMongo signatures require the original body bytes, not re-serialized JSON.
    rawBody: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new DatabaseErrorFilter());

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
