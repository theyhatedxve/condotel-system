import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Point Prisma commands at the existing schema, migration history, and configured database.
export default defineConfig({
  schema: 'prisma/schema.prisma',

  migrations: {
    path: 'prisma/migrations',
  },

  datasource: {
    url: env('DATABASE_URL'),
  },
});
