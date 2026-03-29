import bcrypt from "bcryptjs";

interface User {
  id: number; email: string; password: string; fullName: string; role: string;
  phoneBrand: string | null; contactNumber: string | null; address: string | null;
  isSubscribed: boolean; subscriptionPlan: string | null; subscriptionExpiry: number | null;
  createdAt: number;
}

interface Station {
  id: number; name: string; companyName: string;
  ownerId: number; ownerName: string;
  latitude: number; longitude: number; address: string;
  isActive: boolean; solarWatts: number; batteryLevel: number; contactNumber?: string | null;
  totalVisits: number; cableTypeC: number; cableIPhone: number; cableUniversal: number; outlets: number;
}

interface Order {
  id: number; userId: number; buyerName: string; buyerPhone: string; buyerAddress: string;
  product: string; quantity: number; totalPrice: number; status: string; createdAt: number;
}

const G = globalThis as unknown as {
  _users?: User[]; _stations?: Station[]; _orders?: Order[];
  _nuid?: number; _nsid?: number; _noid?: number;
};

function init() {
  if (!G._users) {
    G._users = [];
    G._stations = [
      { id: 1, name: "PSPCS - SM Mall", companyName: "KLEOXM 111", ownerId: 0, ownerName: "KLEOXM 111", latitude: 14.5995, longitude: 120.9842, address: "SM Mall of Asia, Pasay City", isActive: true, solarWatts: 50, batteryLevel: 85, totalVisits: 142, cableTypeC: 2, cableIPhone: 1, cableUniversal: 1, outlets: 2 },
      { id: 2, name: "PSPCS - BGC", companyName: "KLEOXM 111", ownerId: 0, ownerName: "KLEOXM 111", latitude: 14.5537, longitude: 121.0509, address: "BGC High Street, Taguig", isActive: true, solarWatts: 50, batteryLevel: 92, totalVisits: 89, cableTypeC: 1, cableIPhone: 2, cableUniversal: 1, outlets: 1 },
      { id: 3, name: "PSPCS - Quiapo", companyName: "KLEOXM 111", ownerId: 0, ownerName: "KLEOXM 111", latitude: 14.5981, longitude: 120.9837, address: "Quiapo Church, Manila", isActive: false, solarWatts: 50, batteryLevel: 15, totalVisits: 234, cableTypeC: 2, cableIPhone: 1, cableUniversal: 2, outlets: 3 },
      { id: 4, name: "PSPCS - Cubao", companyName: "KLEOXM 111", ownerId: 0, ownerName: "KLEOXM 111", latitude: 14.6188, longitude: 121.0509, address: "Gateway Mall, Cubao, QC", isActive: true, solarWatts: 50, batteryLevel: 78, totalVisits: 67, cableTypeC: 1, cableIPhone: 1, cableUniversal: 1, outlets: 1 },
      { id: 5, name: "PSPCS - Makati", companyName: "KLEOXM 111", ownerId: 0, ownerName: "KLEOXM 111", latitude: 14.5547, longitude: 121.0244, address: "Ayala Center, Makati", isActive: true, solarWatts: 50, batteryLevel: 95, totalVisits: 198, cableTypeC: 2, cableIPhone: 2, cableUniversal: 1, outlets: 2 },
    ];
    G._orders = [];
    G._nuid = 100; G._nsid = 100; G._noid = 100;
  }
}

export const store = {
  async createUser(data: { email: string; password: string; fullName: string; role: string; phoneBrand?: string; contactNumber?: string; address?: string }) {
    init();
    if (G._users!.find(u => u.email === data.email)) throw new Error("Email already registered");
    const hashed = await bcrypt.hash(data.password, 10);
    const user: User = { id: G._nuid!++, email: data.email, password: hashed, fullName: data.fullName, role: data.role, phoneBrand: data.phoneBrand || null, contactNumber: data.contactNumber || null, address: data.address || null, isSubscribed: false, subscriptionPlan: null, subscriptionExpiry: null, createdAt: Date.now() };
    G._users!.push(user);
    return user;
  },
  findUserByEmail(email: string) { init(); return G._users!.find(u => u.email === email) || null; },
  findUserById(id: number) { init(); return G._users!.find(u => u.id === id) || null; },
  async verifyPassword(plain: string, hashed: string) { return bcrypt.compare(plain, hashed); },
  updateUser(id: number, data: Partial<User>) { init(); const u = G._users!.find(u => u.id === id); if (u) Object.assign(u, data); return u; },
  deleteUser(id: number) { init(); G._users = G._users!.filter(u => u.id !== id); G._stations = G._stations!.filter(s => s.ownerId !== id); },
  getAllUsers() { init(); return [...G._users!]; },

  getAllStations() { init(); return [...G._stations!]; },
  addStation(data: Omit<Station, "id">) { init(); const s: Station = { ...data, id: G._nsid!++ }; G._stations!.push(s); return s; },
  updateStation(id: number, data: Partial<Station>) { init(); const s = G._stations!.find(s => s.id === id); if (s) Object.assign(s, data); return s; },
  deleteStation(id: number) { init(); G._stations = G._stations!.filter(s => s.id !== id); },

  getAllOrders() { init(); return [...G._orders!]; },
  addOrder(data: Omit<Order, "id" | "createdAt">) { init(); const o: Order = { ...data, id: G._noid!++, createdAt: Date.now() }; G._orders!.push(o); return o; },
  updateOrder(id: number, status: string) { init(); const o = G._orders!.find(o => o.id === id); if (o) o.status = status; },
};

export const PRODUCTS = [
  { id: "pspcs", name: "PSPCS Charging Station", price: 25000, desc: "Solar powered, 3.6VDC output, all phone types" },
  { id: "pspcs2", name: "PSPCS (2 Units)", price: 48000, desc: "Two stations bundle" },
  { id: "pspcs3", name: "PSPCS (3 Units)", price: 70000, desc: "Three stations bundle" },
];

export const PLANS = [
  { id: "1day", label: "1 Day", days: 1, price: 15 },
  { id: "1week", label: "1 Week", days: 7, price: 50 },
  { id: "1month", label: "1 Month", days: 30, price: 120 },
  { id: "1year", label: "1 Year", days: 365, price: 300 },
];
