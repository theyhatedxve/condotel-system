import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { DatabaseErrorFilter } from './security/database-error.filter';

// Create Nest with raw webhook bodies, configure API/CORS/validation/error handling, and
// listen on the configured port.
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // PayMongo signatures require the original body bytes, not re-serialized JSON.
    rawBody: true,
  });

  // Keep every endpoint under /api and sanitize unexpected database errors.
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new DatabaseErrorFilter());

  // Permit the configured local frontend to make authenticated browser requests.
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  // Transform validated DTO input and reject fields the API does not accept.
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
