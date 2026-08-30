import { int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { uniqueIndex } from "drizzle-orm/mysql-core";

/**
 * Push notification schema.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */

export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: varchar("endpoint", { length: 768 }).notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ endpointUnique: uniqueIndex("push_subscriptions_endpoint_unique").on(table.endpoint) }));

export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  enabled: int("enabled").default(0).notNull(),
  competitionSlugs: text("competitionSlugs").notNull(),
  teamIds: text("teamIds").notNull(),
  eventTypes: text("eventTypes").notNull(),
  quietHoursEnabled: int("quietHoursEnabled").default(0).notNull(),
  quietHoursStart: varchar("quietHoursStart", { length: 5 }).notNull(),
  quietHoursEnd: varchar("quietHoursEnd", { length: 5 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ userUnique: uniqueIndex("notification_preferences_user_unique").on(table.userId) }));

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = typeof notificationPreferences.$inferInsert;