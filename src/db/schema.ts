import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(), // "customer" | "branch_owner" | "company_owner"
  phoneBrand: text("phone_brand"),
  phoneBattery: integer("phone_battery"),
  contactNumber: text("contact_number"),
  address: text("address"),
  worklifeAnswer: text("worklife_answer"),
  isSubscribed: integer("is_subscribed", { mode: "boolean" }).default(false),
  subscriptionExpiry: integer("subscription_expiry", { mode: "timestamp" }),
  gcashNumber: text("gcash_number"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const chargingStations = sqliteTable("charging_stations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  brand: text("brand").notNull().default("PSPCS"),
  ownerId: integer("owner_id").references(() => users.id),
  ownerName: text("owner_name"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  address: text("address").notNull(),
  contactNumber: text("contact_number"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  solarWatts: real("solar_watts"),
  batteryLevel: real("battery_level"),
  outputVoltage: text("output_voltage").default("3.6VDC"),
  totalSessions: integer("total_sessions").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const chargingSessions = sqliteTable("charging_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  stationId: integer("station_id").references(() => chargingStations.id),
  phoneBrand: text("phone_brand").notNull(),
  startBattery: integer("start_battery").notNull(),
  targetBattery: integer("target_battery").default(100),
  costPesos: real("cost_pesos").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  status: text("status").default("active"), // "active" | "completed" | "cancelled"
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recipientEmail: text("recipient_email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // "new_account" | "subscription" | "general"
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
