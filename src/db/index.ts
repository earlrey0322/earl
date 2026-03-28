import { createDatabase } from "@kilocode/app-builder-db";
import * as schema from "./schema";

// Lazy database initialization to avoid build-time errors
let _db: ReturnType<typeof createDatabase> | null = null;

export function getDb() {
  if (!_db) {
    _db = createDatabase(schema);
  }
  return _db;
}

// Proxy to allow lazy access via `db` import
export const db = new Proxy({} as ReturnType<typeof createDatabase>, {
  get(_target, prop) {
    const database = getDb();
    return Reflect.get(database, prop);
  },
});
