import { config } from 'dotenv';
import { resolve } from 'path';

// Load the root .env file
config({ path: resolve(__dirname, '.env') });

import { defineConfig, env } from '@prisma/config';

export default defineConfig({
  schema: 'apps/backend/prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
