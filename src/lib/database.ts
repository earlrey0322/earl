import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const USERS_FILE = join(DATA_DIR, "users.json");
const STATIONS_FILE = join(DATA_DIR, "stations.json");
const HISTORY_FILE = join(DATA_DIR, "history.json");
const NOTIFS_FILE = join(DATA_DIR, "notifications.json");

function ensureDir() {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) { console.error("ensureDir error:", e); }
}

function readJSON<T>(file: string, defaultValue: T): T {
  try {
    if (existsSync(file)) {
      const raw = readFileSync(file, "utf-8");
      if (raw.trim()) return JSON.parse(raw);
    }
  } catch (e) { console.error(`Read error ${file}:`, e); }
  return defaultValue;
}

function writeJSON(file: string, data: any) {
  try {
    ensureDir();
    writeFileSync(file, JSON.stringify(data), "utf-8");
  } catch (e) { console.error(`Write error ${file}:`, e); }
}

// Init
ensureDir();
if (readJSON<any[]>(STATIONS_FILE, []).length === 0) {
  writeJSON(STATIONS_FILE, [
    { id: 1, name: "PSPCS - SM Mall", company_name: "KLEOXM 111", brand: "PSPCS", owner_id: 0, owner_name: "KLEOXM 111", latitude: 14.5995, longitude: 120.9842, address: "SM Mall of Asia, Pasay", location: "Pasay City", is_active: true, solar_watts: 50, battery_level: 85, total_visits: 142, revenue: 0, cable_type_c: 2, cable_iphone: 1, cable_universal: 1, outlets: 2 },
    { id: 2, name: "PSPCS - BGC", company_name: "KLEOXM 111", brand: "PSPCS", owner_id: 0, owner_name: "KLEOXM 111", latitude: 14.5537, longitude: 121.0509, address: "BGC High Street, Taguig", location: "Taguig City", is_active: true, solar_watts: 50, battery_level: 92, total_visits: 89, revenue: 0, cable_type_c: 1, cable_iphone: 2, cable_universal: 1, outlets: 1 },
    { id: 3, name: "PSPCS - Quiapo", company_name: "KLEOXM 111", brand: "PSPCS", owner_id: 0, owner_name: "KLEOXM 111", latitude: 14.5981, longitude: 120.9837, address: "Quiapo Church, Manila", location: "Manila", is_active: false, solar_watts: 50, battery_level: 15, total_visits: 234, revenue: 0, cable_type_c: 2, cable_iphone: 1, cable_universal: 2, outlets: 3 },
    { id: 4, name: "PSPCS - Cubao", company_name: "KLEOXM 111", brand: "PSPCS", owner_id: 0, owner_name: "KLEOXM 111", latitude: 14.6188, longitude: 121.0509, address: "Gateway Mall, Cubao", location: "Quezon City", is_active: true, solar_watts: 50, battery_level: 78, total_visits: 67, revenue: 0, cable_type_c: 1, cable_iphone: 1, cable_universal: 1, outlets: 1 },
    { id: 5, name: "PSPCS - Makati", company_name: "KLEOXM 111", brand: "PSPCS", owner_id: 0, owner_name: "KLEOXM 111", latitude: 14.5547, longitude: 121.0244, address: "Ayala Center, Makati", location: "Makati City", is_active: true, solar_watts: 50, battery_level: 95, total_visits: 198, revenue: 0, cable_type_c: 2, cable_iphone: 2, cable_universal: 1, outlets: 2 },
  ]);
}
readJSON<any[]>(USERS_FILE, []);
readJSON<any[]>(HISTORY_FILE, []);
readJSON<any[]>(NOTIFS_FILE, []);

// ID generators
function getNextId(file: string): number {
  const items = readJSON<any[]>(file, []);
  return items.length > 0 ? Math.max(...items.map((i: any) => i.id || 0)) + 1 : 1;
}

// Users
export const getUsers = () => readJSON<any[]>(USERS_FILE, []);
export const saveUsers = (u: any[]) => writeJSON(USERS_FILE, u);
export const findUserByEmail = (email: string) => getUsers().find((u: any) => u.email === email.trim());
export const findUserById = (id: number) => getUsers().find((u: any) => u.id === id);
export const addUser = (user: any) => { const u = getUsers(); user.id = getNextId(USERS_FILE); u.push(user); saveUsers(u); return user; };
export const updateUser = (id: number, data: any) => { const u = getUsers(); const i = u.findIndex((x: any) => x.id === id); if (i >= 0) { Object.assign(u[i], data); saveUsers(u); return u[i]; } return null; };
export const deleteUser = (id: number) => { const u = getUsers(); const i = u.findIndex((x: any) => x.id === id); if (i >= 0) { u.splice(i, 1); saveUsers(u); } };

// Stations
export const getStations = () => readJSON<any[]>(STATIONS_FILE, []);
export const saveStations = (s: any[]) => writeJSON(STATIONS_FILE, s);
export const addStation = (station: any) => { const s = getStations(); station.id = getNextId(STATIONS_FILE); s.push(station); saveStations(s); return station; };
export const updateStation = (id: number, data: any) => { const s = getStations(); const i = s.findIndex((x: any) => x.id === id); if (i >= 0) { Object.assign(s[i], data); saveStations(s); return s[i]; } return null; };
export const deleteStation = (id: number) => { const s = getStations(); const i = s.findIndex((x: any) => x.id === id); if (i >= 0) { s.splice(i, 1); saveStations(s); } };

// History
export const getHistory = () => readJSON<any[]>(HISTORY_FILE, []);
export const addHistory = (item: any) => { const h = getHistory(); item.id = getNextId(HISTORY_FILE); h.push(item); writeJSON(HISTORY_FILE, h); return item; };

// Notifications
export const getNotifications = () => readJSON<any[]>(NOTIFS_FILE, []);
export const addNotification = (notif: any) => { const n = getNotifications(); notif.id = getNextId(NOTIFS_FILE); n.push(notif); writeJSON(NOTIFS_FILE, n); return notif; };
