import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { user } from './user'
import { paymentHistory } from './payment-history'

export const subscription = pgTable('subscription', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  planType: text('planType').notNull(), // 'FREE' | 'PRO'
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'CANCELLED' | 'EXPIRED'
  currentPeriodStart: timestamp('currentPeriodStart'), // 구독 시작일
  currentPeriodEnd: timestamp('currentPeriodEnd'), // 구독 만료일
  billingKey: text('billingKey'), // Toss Payments billing key
  customerKey: text('customerKey'), // Toss Payments customer key (구매자 ID)
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const subscriptionRelations = relations(
  subscription,
  ({ one, many }) => ({
    user: one(user, {
      fields: [subscription.userId],
      references: [user.id],
    }),
    paymentHistories: many(paymentHistory),
  }),
)
