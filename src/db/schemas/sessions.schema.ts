import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users.schema';

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: integer('expires_at').notNull(),
});

export type Session = typeof sessions.$inferSelect;
