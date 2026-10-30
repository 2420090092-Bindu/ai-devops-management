import { pgTable, text, jsonb } from 'drizzle-orm/pg-core'
import type { Incident, Log, Notice } from '../src/shared/models'
export const incidents = pgTable('incidents', {
  id: text().primaryKey(),
  data: jsonb().$type<Incident>().notNull(),
})
export const logs = pgTable('logs', {
  id: text().primaryKey(),
  data: jsonb().$type<Log>().notNull(),
})
export const notifications = pgTable('notifications', {
  id: text().primaryKey(),
  data: jsonb().$type<Notice>().notNull(),
})
export const metadata = pgTable('metadata', { id: text().primaryKey() })
