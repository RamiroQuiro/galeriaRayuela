import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schemas/index.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './sqlite.db',
  },
});
