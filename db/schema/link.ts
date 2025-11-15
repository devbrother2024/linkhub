import {
  pgTable,
  text,
  timestamp,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { user } from './user'

export const link = pgTable(
  'link',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    originalUrl: text('originalUrl').notNull(),
    slug: text('slug').notNull(),
    expiresAt: timestamp('expiresAt'),
    clickLimit: integer('clickLimit'),
    clickCount: integer('clickCount').notNull().default(0),
    status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_links_user_id').on(table.userId),
    slugIdx: uniqueIndex('idx_links_slug').on(table.slug),
  }),
)

export const linkRelations = relations(link, ({ one }) => ({
  user: one(user, {
    fields: [link.userId],
    references: [user.id],
  }),
}))
