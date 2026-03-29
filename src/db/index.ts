import { createDatabase } from "@kilocode/app-builder-db";
import * as schema from "./schema";

let _db: ReturnType<typeof createDatabase> | null = null;
let _dbFailed = false;

export function getDb() {
  if (_dbFailed) throw new Error("Database unavailable");
  if (_db) return _db;
  if (!process.env.DB_URL || !process.env.DB_TOKEN) {
    _dbFailed = true;
    throw new Error("Database unavailable: DB_URL and DB_TOKEN not set");
  }
  try {
    _db = createDatabase(schema);
    return _db;
  } catch (e) {
    _dbFailed = true;
    throw e;
  }
}

export const db = new Proxy({} as ReturnType<typeof createDatabase>, {
  get(_target, prop) {
    const database = getDb();
    const val = Reflect.get(database, prop);
    if (typeof val === "function") return val.bind(database);
    return val;
  },
});
