import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { user } from './user'

export const subscription = pgTable('subscription', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  planType: text('planType').notNull(), // 'FREE' | 'PRO'
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'CANCELLED' | 'EXPIRED'
  currentPeriodEnd: timestamp('currentPeriodEnd'),
  billingKey: text('billingKey'), // Toss Payments billing key
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  user: one(user, {
    fields: [subscription.userId],
    references: [user.id],
  }),
}))
