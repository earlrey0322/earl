import bcrypt from "bcryptjs";

export interface User {
  id: number;
  email: string;
  password: string;
  fullName: string;
  role: string;
  phoneBrand: string | null;
  phoneBattery: number | null;
  contactNumber: string | null;
  address: string | null;
  worklifeAnswer: string | null;
  isSubscribed: boolean;
  subscriptionPlan: string | null;
  subscriptionExpiry: Date | null;
  gcashNumber: string | null;
  createdAt: Date;
}

export interface Station {
  id: number;
  name: string;
  companyName: string;
  brand: string;
  ownerId: number | null;
  ownerName: string | null;
  latitude: number;
  longitude: number;
  address: string;
  contactNumber: string | null;
  isActive: boolean;
  solarWatts: number;
  batteryLevel: number;
  outputVoltage: string;
  totalVisits: number;
  revenue: number;
  cableTypeC: number;
  cableIPhone: number;
  cableUniversal: number;
  outlets: number;
  createdAt: Date;
}

export interface ChargingHistory {
  id: number;
  userId: number;
  userEmail: string;
  stationId: number;
  stationName: string;
  phoneBrand: string;
  startBattery: number;
  targetBattery: number;
  costPesos: number;
  durationMinutes: number;
  createdAt: Date;
}

export interface Notification {
  id: number;
  recipientEmail: string;
  subject: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

export const SUBSCRIPTION_PLANS = [
  { id: "1day", label: "1 Day", days: 1, price: 15 },
  { id: "1week", label: "1 Week", days: 7, price: 50 },
  { id: "1month", label: "1 Month", days: 30, price: 120 },
  { id: "1year", label: "1 Year", days: 365, price: 300 },
];

class InMemoryStore {
  users: User[] = [];
  stations: Station[] = [];
  chargingHistory: ChargingHistory[] = [];
  notifications: Notification[] = [];
  subscriptionRevenue: number = 0;
  private nextId = 1;

  private getId() { return this.nextId++; }

  constructor() { this.seedData(); }

  private seedData() {
    const samples = [
      { name: "PSPCS Station - SM Mall", company: "KLEOXM 111", lat: 14.5995, lng: 120.9842, addr: "SM Mall of Asia, Pasay City", active: true, battery: 85, visits: 142, cTypeC: 2, cIPhone: 1, cUniv: 1, outlets: 2 },
      { name: "PSPCS Station - BGC", company: "KLEOXM 111", lat: 14.5537, lng: 121.0509, addr: "BGC High Street, Taguig City", active: true, battery: 92, visits: 89, cTypeC: 1, cIPhone: 2, cUniv: 1, outlets: 1 },
      { name: "PSPCS Station - Quiapo", company: "KLEOXM 111", lat: 14.5981, lng: 120.9837, addr: "Quiapo Church Area, Manila", active: false, battery: 15, visits: 234, cTypeC: 2, cIPhone: 1, cUniv: 2, outlets: 3 },
      { name: "PSPCS Station - Cubao", company: "KLEOXM 111", lat: 14.6188, lng: 121.0509, addr: "Gateway Mall, Cubao, QC", active: true, battery: 78, visits: 67, cTypeC: 1, cIPhone: 1, cUniv: 1, outlets: 1 },
      { name: "PSPCS Station - Makati", company: "KLEOXM 111", lat: 14.5547, lng: 121.0244, addr: "Ayala Center, Makati City", active: true, battery: 95, visits: 198, cTypeC: 2, cIPhone: 2, cUniv: 1, outlets: 2 },
      { name: "SolarCharge - Ortigas", company: "SolarCharge Co.", lat: 14.5866, lng: 121.0635, addr: "SM Megamall, Ortigas Center", active: true, battery: 70, visits: 56, cTypeC: 1, cIPhone: 1, cUniv: 2, outlets: 1 },
      { name: "EcoCharge - Alabang", company: "EcoCharge Inc.", lat: 14.4198, lng: 121.0311, addr: "Festival Mall, Alabang", active: true, battery: 88, visits: 45, cTypeC: 2, cIPhone: 1, cUniv: 1, outlets: 2 },
    ];
    for (const s of samples) {
      this.stations.push({
        id: this.getId(), name: s.name, companyName: s.company, brand: "PSPCS",
        ownerId: null, ownerName: "KLEOXM 111", latitude: s.lat, longitude: s.lng,
        address: s.addr, contactNumber: "09469086926", isActive: s.active,
        solarWatts: 50, batteryLevel: s.battery, outputVoltage: "3.6VDC",
        totalVisits: s.visits, revenue: Math.floor(s.visits * 5), cableTypeC: s.cTypeC, cableIPhone: s.cIPhone,
        cableUniversal: s.cUniv, outlets: s.outlets, createdAt: new Date(),
      });
    }
  }

  async createUser(data: { email: string; password: string; fullName: string; role: string; phoneBrand?: string; contactNumber?: string; address?: string; worklifeAnswer?: string }) {
    if (this.users.find((u) => u.email === data.email)) throw new Error("Email already registered");
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user: User = {
      id: this.getId(), email: data.email, password: hashedPassword, fullName: data.fullName,
      role: data.role, phoneBrand: data.phoneBrand || null, phoneBattery: null,
      contactNumber: data.contactNumber || null, address: data.address || null,
      worklifeAnswer: data.worklifeAnswer || null, isSubscribed: false,
      subscriptionPlan: null, subscriptionExpiry: null, gcashNumber: null, createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  findUserByEmail(email: string) { return this.users.find((u) => u.email === email) || null; }
  findUserById(id: number) { return this.users.find((u) => u.id === id) || null; }
  async verifyPassword(plain: string, hashed: string) { return bcrypt.compare(plain, hashed); }
  updateUser(id: number, data: Partial<User>) { const u = this.users.find((u) => u.id === id); if (u) Object.assign(u, data); return u; }
  deleteUser(id: number) { this.users = this.users.filter((u) => u.id !== id); }
  getUsersByRole(role: string) { return this.users.filter((u) => u.role === role); }
  getAllUsers() { return [...this.users]; }

  getAllStations() { return [...this.stations]; }
  getStationsByCompany(companyName: string) { return this.stations.filter((s) => s.companyName === companyName); }
  getStationById(id: number) { return this.stations.find((s) => s.id === id) || null; }
  addStation(data: Omit<Station, "id" | "createdAt">) {
    const station: Station = { ...data, id: this.getId(), createdAt: new Date() };
    this.stations.push(station);
    return station;
  }
  updateStation(id: number, data: Partial<Station>) { const s = this.stations.find((s) => s.id === id); if (s) Object.assign(s, data); return s; }
  incrementStationVisit(id: number) { const s = this.stations.find((s) => s.id === id); if (s) s.totalVisits++; }
  deleteStation(id: number) { this.stations = this.stations.filter((s) => s.id !== id); }

  addChargingHistory(data: Omit<ChargingHistory, "id" | "createdAt">) {
    const h: ChargingHistory = { ...data, id: this.getId(), createdAt: new Date() };
    this.chargingHistory.push(h);
    // Add revenue to station (branch owner earns from charging)
    const station = this.stations.find((s) => s.id === data.stationId);
    if (station) station.revenue = (station.revenue || 0) + data.costPesos;
    return h;
  }
  addSubscriptionRevenue(amount: number) { this.subscriptionRevenue += amount; }
  getStationRevenue(ownerId: number) { return this.stations.filter((s) => s.ownerId === ownerId).reduce((sum, s) => sum + (s.revenue || 0), 0); }
  getHistoryByUser(userId: number) { return this.chargingHistory.filter((h) => h.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); }
  getHistoryByStation(stationId: number) { return this.chargingHistory.filter((h) => h.stationId === stationId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); }
  getAllHistory() { return [...this.chargingHistory].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); }

  addNotification(data: Omit<Notification, "id" | "createdAt">) {
    const n: Notification = { ...data, id: this.getId(), createdAt: new Date() };
    this.notifications.push(n);
    return n;
  }
  getNotificationsByEmail(email: string) { return this.notifications.filter((n) => n.recipientEmail === email).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); }
}

export const store = new InMemoryStore();
