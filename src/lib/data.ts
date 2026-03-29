import { NextResponse } from "next/server";

// Simple in-memory store using globalThis
const G = globalThis as any;

function init() {
  if (!G._u) {
    G._u = []; // users
    G._s = [ // stations
      { id: 1, name: "PSPCS - SM Mall", company: "KLEOXM 111", ownerId: 0, owner: "KLEOXM 111", lat: 14.5995, lng: 120.9842, addr: "SM Mall of Asia, Pasay", active: true, battery: 85, visits: 142, tc: 2, ip: 1, uv: 1, out: 2 },
      { id: 2, name: "PSPCS - BGC", company: "KLEOXM 111", ownerId: 0, owner: "KLEOXM 111", lat: 14.5537, lng: 121.0509, addr: "BGC High Street, Taguig", active: true, battery: 92, visits: 89, tc: 1, ip: 2, uv: 1, out: 1 },
      { id: 3, name: "PSPCS - Quiapo", company: "KLEOXM 111", ownerId: 0, owner: "KLEOXM 111", lat: 14.5981, lng: 120.9837, addr: "Quiapo Church, Manila", active: false, battery: 15, visits: 234, tc: 2, ip: 1, uv: 2, out: 3 },
      { id: 4, name: "PSPCS - Cubao", company: "KLEOXM 111", ownerId: 0, owner: "KLEOXM 111", lat: 14.6188, lng: 121.0509, addr: "Gateway Mall, Cubao", active: true, battery: 78, visits: 67, tc: 1, ip: 1, uv: 1, out: 1 },
      { id: 5, name: "PSPCS - Makati", company: "KLEOXM 111", ownerId: 0, owner: "KLEOXM 111", lat: 14.5547, lng: 121.0244, addr: "Ayala Center, Makati", active: true, battery: 95, visits: 198, tc: 2, ip: 2, uv: 1, out: 2 },
    ];
    G._o = []; // orders
    G._uid = 100; G._sid = 100; G._oid = 100;
  }
}

export function getStore() { init(); return { users: G._u, stations: G._s, orders: G._o, uid: () => G._uid++, sid: () => G._sid++, oid: () => G._oid++ }; }
