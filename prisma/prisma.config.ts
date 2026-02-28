// prisma.config.ts
import 'dotenv/config'; // to load environment variables from .env file
import { defineConfig, env } from '@prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  // If you are using Prisma Migrate, specify the path to your migrations
  // migrations: {
  //   path: 'prisma/migrations',
  // },
  datasource: {
    url: env('DATABASE_URL') || 'mysql://root:eve9397@localhost:3306/cadena24_wms', // Move the URL here
  },
});
