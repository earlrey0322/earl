import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const USERS_FILE = join(DATA_DIR, "users.json");
const STATIONS_FILE = join(DATA_DIR, "stations.json");
const HISTORY_FILE = join(DATA_DIR, "history.json");
const NOTIFS_FILE = join(DATA_DIR, "notifications.json");

function ensureDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJSON<T>(file: string, defaultValue: T): T {
  try {
    if (existsSync(file)) {
      const raw = readFileSync(file, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error(`Error reading ${file}:`, e);
  }
  return defaultValue;
}

function writeJSON(file: string, data: any) {
  try {
    ensureDir();
    writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error(`Error writing ${file}:`, e);
  }
}

// Initialize data
function init() {
  ensureDir();

  // Initialize stations if empty
  const stations = readJSON<any[]>(STATIONS_FILE, []);
  if (stations.length === 0) {
    const sampleStations = [
      { id: 1, name: "PSPCS - SM Mall", company_name: "KLEOXM 111", brand: "PSPCS", owner_id: 0, owner_name: "KLEOXM 111", latitude: 14.5995, longitude: 120.9842, address: "SM Mall of Asia, Pasay", location: "Pasay City", is_active: true, solar_watts: 50, battery_level: 85, total_visits: 142, revenue: 0, cable_type_c: 2, cable_iphone: 1, cable_universal: 1, outlets: 2 },
      { id: 2, name: "PSPCS - BGC", company_name: "KLEOXM 111", brand: "PSPCS", owner_id: 0, owner_name: "KLEOXM 111", latitude: 14.5537, longitude: 121.0509, address: "BGC High Street, Taguig", location: "Taguig City", is_active: true, solar_watts: 50, battery_level: 92, total_visits: 89, revenue: 0, cable_type_c: 1, cable_iphone: 2, cable_universal: 1, outlets: 1 },
      { id: 3, name: "PSPCS - Quiapo", company_name: "KLEOXM 111", brand: "PSPCS", owner_id: 0, owner_name: "KLEOXM 111", latitude: 14.5981, longitude: 120.9837, address: "Quiapo Church, Manila", location: "Manila", is_active: false, solar_watts: 50, battery_level: 15, total_visits: 234, revenue: 0, cable_type_c: 2, cable_iphone: 1, cable_universal: 2, outlets: 3 },
      { id: 4, name: "PSPCS - Cubao", company_name: "KLEOXM 111", brand: "PSPCS", owner_id: 0, owner_name: "KLEOXM 111", latitude: 14.6188, longitude: 121.0509, address: "Gateway Mall, Cubao", location: "Quezon City", is_active: true, solar_watts: 50, battery_level: 78, total_visits: 67, revenue: 0, cable_type_c: 1, cable_iphone: 1, cable_universal: 1, outlets: 1 },
      { id: 5, name: "PSPCS - Makati", company_name: "KLEOXM 111", brand: "PSPCS", owner_id: 0, owner_name: "KLEOXM 111", latitude: 14.5547, longitude: 121.0244, address: "Ayala Center, Makati", location: "Makati City", is_active: true, solar_watts: 50, battery_level: 95, total_visits: 198, revenue: 0, cable_type_c: 2, cable_iphone: 2, cable_universal: 1, outlets: 2 },
    ];
    writeJSON(STATIONS_FILE, sampleStations);
  }

  // Initialize empty arrays if files don't exist
  readJSON<any[]>(USERS_FILE, []);
  readJSON<any[]>(HISTORY_FILE, []);
  readJSON<any[]>(NOTIFS_FILE, []);
}

// Auto-init on load
init();

let _nextUserId = 0;
let _nextStationId = 0;
let _nextHistoryId = 0;
let _nextNotifId = 0;

function getNextUserId() {
  const users = readJSON<any[]>(USERS_FILE, []);
  if (_nextUserId === 0) _nextUserId = users.length > 0 ? Math.max(...users.map((u: any) => u.id)) + 1 : 1;
  return _nextUserId++;
}

function getNextStationId() {
  const stations = readJSON<any[]>(STATIONS_FILE, []);
  if (_nextStationId === 0) _nextStationId = stations.length > 0 ? Math.max(...stations.map((s: any) => s.id)) + 1 : 1;
  return _nextStationId++;
}

function getNextHistoryId() {
  const history = readJSON<any[]>(HISTORY_FILE, []);
  if (_nextHistoryId === 0) _nextHistoryId = history.length > 0 ? Math.max(...history.map((h: any) => h.id)) + 1 : 1;
  return _nextHistoryId++;
}

function getNextNotifId() {
  const notifs = readJSON<any[]>(NOTIFS_FILE, []);
  if (_nextNotifId === 0) _nextNotifId = notifs.length > 0 ? Math.max(...notifs.map((n: any) => n.id)) + 1 : 1;
  return _nextNotifId++;
}

// Users
export function getUsers() { return readJSON<any[]>(USERS_FILE, []); }
export function saveUsers(users: any[]) { writeJSON(USERS_FILE, users); }
export function findUserByEmail(email: string) { return getUsers().find((u: any) => u.email === email.trim()); }
export function findUserById(id: number) { return getUsers().find((u: any) => u.id === id); }
export function addUser(user: any) { const users = getUsers(); user.id = getNextUserId(); users.push(user); saveUsers(users); return user; }
export function updateUser(id: number, data: any) {
  const users = getUsers();
  const idx = users.findIndex((u: any) => u.id === id);
  if (idx >= 0) { Object.assign(users[idx], data); saveUsers(users); return users[idx]; }
  return null;
}
export function deleteUser(id: number) {
  const users = getUsers();
  const idx = users.findIndex((u: any) => u.id === id);
  if (idx >= 0) { users.splice(idx, 1); saveUsers(users); }
}

// Stations
export function getStations() { return readJSON<any[]>(STATIONS_FILE, []); }
export function saveStations(stations: any[]) { writeJSON(STATIONS_FILE, stations); }
export function findStationById(id: number) { return getStations().find((s: any) => s.id === id); }
export function addStation(station: any) { const stations = getStations(); station.id = getNextStationId(); stations.push(station); saveStations(stations); return station; }
export function updateStation(id: number, data: any) {
  const stations = getStations();
  const idx = stations.findIndex((s: any) => s.id === id);
  if (idx >= 0) { Object.assign(stations[idx], data); saveStations(stations); return stations[idx]; }
  return null;
}
export function deleteStation(id: number) {
  const stations = getStations();
  const idx = stations.findIndex((s: any) => s.id === id);
  if (idx >= 0) { stations.splice(idx, 1); saveStations(stations); }
}

// History
export function getHistory() { return readJSON<any[]>(HISTORY_FILE, []); }
export function saveHistory(history: any[]) { writeJSON(HISTORY_FILE, history); }
export function addHistory(item: any) { const history = getHistory(); item.id = getNextHistoryId(); history.push(item); saveHistory(history); return item; }

// Notifications
export function getNotifications() { return readJSON<any[]>(NOTIFS_FILE, []); }
export function saveNotifications(notifs: any[]) { writeJSON(NOTIFS_FILE, notifs); }
export function addNotification(notif: any) { const notifs = getNotifications(); notif.id = getNextNotifId(); notifs.push(notif); saveNotifications(notifs); return notif; }
