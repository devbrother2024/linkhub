import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { session } from './session'
import { account } from './account'
import { subscription } from './subscription'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  // 사용자 정의 필드: 플랜 정보
  planType: text('planType').notNull().default('FREE'), // 'FREE' | 'PRO'
  planExpiresAt: timestamp('planExpiresAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  subscriptions: many(subscription),
}))
