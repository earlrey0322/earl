import Database from "better-sqlite3";
import { join } from "path";

const DB_PATH = join(process.cwd(), "pspcs.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  _db = new Database(DB_PATH);

  // Enable WAL mode for better performance
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  // Create tables if they don't exist
  _db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone_brand TEXT,
      contact_number TEXT,
      address TEXT,
      is_subscribed INTEGER DEFAULT 0,
      subscription_plan TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS charging_stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company_name TEXT NOT NULL DEFAULT 'KLEOXM 111',
      brand TEXT NOT NULL DEFAULT 'PSPCS',
      owner_id INTEGER,
      owner_name TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      address TEXT NOT NULL,
      location TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      solar_watts REAL DEFAULT 50,
      battery_level REAL DEFAULT 100,
      total_visits INTEGER DEFAULT 0,
      revenue REAL DEFAULT 0,
      cable_type_c INTEGER DEFAULT 0,
      cable_iphone INTEGER DEFAULT 0,
      cable_universal INTEGER DEFAULT 0,
      outlets INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS charging_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_email TEXT,
      station_id INTEGER,
      station_name TEXT,
      phone_brand TEXT NOT NULL,
      start_battery INTEGER NOT NULL,
      target_battery INTEGER DEFAULT 100,
      cost_pesos REAL NOT NULL,
      duration_minutes INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (station_id) REFERENCES charging_stations(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Insert sample stations if table is empty
  const count = _db.prepare("SELECT COUNT(*) as count FROM charging_stations").get() as any;
  if (count.count === 0) {
    const insert = _db.prepare(`
      INSERT INTO charging_stations (name, company_name, owner_id, owner_name, latitude, longitude, address, location, is_active, battery_level, total_visits, cable_type_c, cable_iphone, cable_universal, outlets)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const stations = [
      ["PSPCS - SM Mall", "KLEOXM 111", 0, "KLEOXM 111", 14.5995, 120.9842, "SM Mall of Asia, Pasay", "Pasay City", 1, 85, 142, 2, 1, 1, 2],
      ["PSPCS - BGC", "KLEOXM 111", 0, "KLEOXM 111", 14.5537, 121.0509, "BGC High Street, Taguig", "Taguig City", 1, 92, 89, 1, 2, 1, 1],
      ["PSPCS - Quiapo", "KLEOXM 111", 0, "KLEOXM 111", 14.5981, 120.9837, "Quiapo Church, Manila", "Manila", 0, 15, 234, 2, 1, 2, 3],
      ["PSPCS - Cubao", "KLEOXM 111", 0, "KLEOXM 111", 14.6188, 121.0509, "Gateway Mall, Cubao", "Quezon City", 1, 78, 67, 1, 1, 1, 1],
      ["PSPCS - Makati", "KLEOXM 111", 0, "KLEOXM 111", 14.5547, 121.0244, "Ayala Center, Makati", "Makati City", 1, 95, 198, 2, 2, 1, 2],
    ];

    const insertMany = _db.transaction((stations: any[]) => {
      for (const s of stations) {
        insert.run(...s);
      }
    });

    insertMany(stations);
  }

  return _db;
}
