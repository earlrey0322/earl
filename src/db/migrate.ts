import { runMigrations } from "@kilocode/app-builder-db";
import { db } from "./index";

if (!process.env.DB_URL || !process.env.DB_TOKEN) {
  console.warn("DB_URL and DB_TOKEN not set, skipping migrations");
} else {
  await runMigrations(db, {}, { migrationsFolder: "./src/db/migrations" });
}
