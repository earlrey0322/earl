import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(),
  phoneBrand: text("phone_brand"),
  contactNumber: text("contact_number"),
  address: text("address"),
  worklifeAnswer: text("worklife_answer"),
  isSubscribed: integer("is_subscribed", { mode: "boolean" }).default(false),
  subscriptionPlan: text("subscription_plan"),
  subscriptionExpiry: integer("subscription_expiry", { mode: "timestamp" }),
  gcashNumber: text("gcash_number"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const chargingStations = sqliteTable("charging_stations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  companyName: text("company_name").notNull().default("KLEOXM 111"),
  brand: text("brand").notNull().default("PSPCS"),
  ownerId: integer("owner_id").references(() => users.id),
  ownerName: text("owner_name"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  address: text("address").notNull(),
  contactNumber: text("contact_number"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  solarWatts: real("solar_watts").default(50),
  batteryLevel: real("battery_level").default(100),
  outputVoltage: text("output_voltage").default("3.6VDC"),
  totalVisits: integer("total_visits").default(0),
  revenue: real("revenue").default(0),
  cableTypeC: integer("cable_type_c").default(0),
  cableIPhone: integer("cable_iphone").default(0),
  cableUniversal: integer("cable_universal").default(0),
  outlets: integer("outlets").default(1),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const chargingHistory = sqliteTable("charging_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  userEmail: text("user_email"),
  stationId: integer("station_id").references(() => chargingStations.id),
  stationName: text("station_name"),
  phoneBrand: text("phone_brand").notNull(),
  startBattery: integer("start_battery").notNull(),
  targetBattery: integer("target_battery").default(100),
  costPesos: real("cost_pesos").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recipientEmail: text("recipient_email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  buyerName: text("buyer_name").notNull(),
  buyerEmail: text("buyer_email"),
  buyerPhone: text("buyer_phone").notNull(),
  buyerAddress: text("buyer_address").notNull(),
  product: text("product").notNull(),
  quantity: integer("quantity").default(1),
  totalPrice: real("total_price").notNull(),
  status: text("status").default("pending"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
