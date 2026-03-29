import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const DATA_FILE = join(process.cwd(), "data-store.json");

const G = globalThis as any;

function loadData() {
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to load data:", e);
  }
  return null;
}

function saveData(data: any) {
  try {
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save data:", e);
  }
}

function init() {
  if (G._dataLoaded) return;
  G._dataLoaded = true;

  const saved = loadData();
  if (saved) {
    G._u = saved.users || [];
    G._s = saved.stations || [];
    G._o = saved.orders || [];
    G._notifs = saved.notifications || [];
    G._uid = saved.uid || 100;
    G._sid = saved.sid || 100;
    G._oid = saved.oid || 100;
    return;
  }

  G._u = [];
  G._s = [
    { id: 1, name: "PSPCS - SM Mall", company: "KLEOXM 111", ownerId: 0, owner: "KLEOXM 111", lat: 14.5995, lng: 120.9842, location: "Pasay City", addr: "SM Mall of Asia, Pasay", active: true, battery: 85, visits: 142, tc: 2, ip: 1, uv: 1, out: 2 },
    { id: 2, name: "PSPCS - BGC", company: "KLEOXM 111", ownerId: 0, owner: "KLEOXM 111", lat: 14.5537, lng: 121.0509, location: "Taguig City", addr: "BGC High Street, Taguig", active: true, battery: 92, visits: 89, tc: 1, ip: 2, uv: 1, out: 1 },
    { id: 3, name: "PSPCS - Quiapo", company: "KLEOXM 111", ownerId: 0, owner: "KLEOXM 111", lat: 14.5981, lng: 120.9837, location: "Manila", addr: "Quiapo Church, Manila", active: false, battery: 15, visits: 234, tc: 2, ip: 1, uv: 2, out: 3 },
    { id: 4, name: "PSPCS - Cubao", company: "KLEOXM 111", ownerId: 0, owner: "KLEOXM 111", lat: 14.6188, lng: 121.0509, location: "Quezon City", addr: "Gateway Mall, Cubao", active: true, battery: 78, visits: 67, tc: 1, ip: 1, uv: 1, out: 1 },
    { id: 5, name: "PSPCS - Makati", company: "KLEOXM 111", ownerId: 0, owner: "KLEOXM 111", lat: 14.5547, lng: 121.0244, location: "Makati City", addr: "Ayala Center, Makati", active: true, battery: 95, visits: 198, tc: 2, ip: 2, uv: 1, out: 2 },
  ];
  G._o = [];
  G._notifs = [];
  G._uid = 100;
  G._sid = 100;
  G._oid = 100;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function debouncedSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveData({
      users: G._u || [],
      stations: G._s || [],
      orders: G._o || [],
      notifications: G._notifs || [],
      uid: G._uid || 100,
      sid: G._sid || 100,
      oid: G._oid || 100,
    });
  }, 1000);
}

export function persistData() {
  debouncedSave();
}

export function getStore() {
  init();
  return {
    users: G._u,
    stations: G._s,
    orders: G._o,
    notifications: G._notifs,
    uid: () => { const id = G._uid++; debouncedSave(); return id; },
    sid: () => { const id = G._sid++; debouncedSave(); return id; },
    oid: () => { const id = G._oid++; debouncedSave(); return id; },
  };
}
