import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { link } from './link'

export const linkEvent = pgTable(
  'linkEvent',
  {
    id: text('id').primaryKey(),
    linkId: text('linkId')
      .notNull()
      .references(() => link.id, { onDelete: 'cascade' }),
    eventType: text('eventType').notNull().default('CLICK'), // 'CLICK'
    origin: text('origin'), // Referer or origin
    userAgent: text('userAgent'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => ({
    linkIdIdx: index('idx_link_events_link_id').on(table.linkId),
    createdAtIdx: index('idx_link_events_created_at').on(table.createdAt),
  }),
)

export const linkEventRelations = relations(linkEvent, ({ one }) => ({
  link: one(link, {
    fields: [linkEvent.linkId],
    references: [link.id],
  }),
}))
