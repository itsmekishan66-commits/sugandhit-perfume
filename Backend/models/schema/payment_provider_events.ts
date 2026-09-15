import { pgTable, serial, text, jsonb, boolean, bigint } from 'drizzle-orm/pg-core';

export const paymentProviderEvents = pgTable('payment_provider_events', {
  id: serial('id').primaryKey(),
  provider: text('provider').notNull(),
  eventId: text('event_id').notNull().unique(),
  eventType: text('event_type').notNull(),
  transactionId: text('transaction_id').notNull().default(''),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
  processed: boolean('processed').notNull().default(false),
  processedAt: bigint('processed_at', { mode: 'number' }),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});