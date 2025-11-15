import { pgTable, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { subscription } from './subscription'

export const paymentStatusEnum = pgEnum('payment_status', [
  'SUCCESS',
  'FAILED',
  'CANCELLED',
  'PENDING',
])

export const paymentHistory = pgTable('payment_history', {
  id: text('id').primaryKey(),
  subscriptionId: text('subscriptionId')
    .notNull()
    .references(() => subscription.id, { onDelete: 'cascade' }),
  orderId: text('orderId').notNull(), // Toss Payments 주문번호
  paymentKey: text('paymentKey'), // Toss Payments 결제키
  paymentMethod: text('paymentMethod').notNull(), // 'CARD' | 'TRANSFER' 등
  amount: integer('amount').notNull(), // 결제 금액 (원)
  status: paymentStatusEnum('status').notNull().default('PENDING'),
  paidAt: timestamp('paidAt'), // 실제 결제 완료 시간
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const paymentHistoryRelations = relations(paymentHistory, ({ one }) => ({
  subscription: one(subscription, {
    fields: [paymentHistory.subscriptionId],
    references: [subscription.id],
  }),
}))
