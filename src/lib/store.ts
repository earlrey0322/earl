import bcrypt from "bcryptjs";

interface User {
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
  subscriptionExpiry: Date | null;
  gcashNumber: string | null;
  createdAt: Date;
}

interface Station {
  id: number;
  name: string;
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
  totalSessions: number;
  createdAt: Date;
}

interface Session {
  id: number;
  userId: number;
  stationId: number;
  phoneBrand: string;
  startBattery: number;
  targetBattery: number;
  costPesos: number;
  durationMinutes: number;
  status: string;
  createdAt: Date;
}

interface Notification {
  id: number;
  recipientEmail: string;
  subject: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

class InMemoryStore {
  users: User[] = [];
  stations: Station[] = [];
  sessions: Session[] = [];
  notifications: Notification[] = [];
  private nextId = 1;

  private getId() {
    return this.nextId++;
  }

  constructor() {
    this.seedStations();
  }

  private seedStations() {
    const samples = [
      { name: "PSPCS Station - SM Mall", lat: 14.5995, lng: 120.9842, addr: "SM Mall of Asia, Pasay City", active: true, battery: 85, sessions: 142 },
      { name: "PSPCS Station - BGC", lat: 14.5537, lng: 121.0509, addr: "BGC High Street, Taguig City", active: true, battery: 92, sessions: 89 },
      { name: "PSPCS Station - Quiapo", lat: 14.5981, lng: 120.9837, addr: "Quiapo Church Area, Manila", active: false, battery: 15, sessions: 234 },
      { name: "PSPCS Station - Cubao", lat: 14.6188, lng: 121.0509, addr: "Gateway Mall, Cubao, Quezon City", active: true, battery: 78, sessions: 67 },
      { name: "PSPCS Station - Makati", lat: 14.5547, lng: 121.0244, addr: "Ayala Center, Makati City", active: true, battery: 95, sessions: 198 },
      { name: "SolarCharge Station - Ortigas", lat: 14.5866, lng: 121.0635, addr: "SM Megamall, Ortigas Center", active: true, battery: 70, sessions: 56, brand: "SolarCharge" },
      { name: "EcoCharge Station - Alabang", lat: 14.4198, lng: 121.0311, addr: "Festival Mall, Alabang, Muntinlupa", active: true, battery: 88, sessions: 45, brand: "EcoCharge" },
    ];
    for (const s of samples) {
      this.stations.push({
        id: this.getId(),
        name: s.name,
        brand: (s as Record<string, unknown>).brand as string || "PSPCS",
        ownerId: null,
        ownerName: "KLEOXM 111",
        latitude: s.lat,
        longitude: s.lng,
        address: s.addr,
        contactNumber: "09469086926",
        isActive: s.active,
        solarWatts: 50,
        batteryLevel: s.battery,
        outputVoltage: "3.6VDC",
        totalSessions: s.sessions,
        createdAt: new Date(),
      });
    }
  }

  // User methods
  async createUser(data: { email: string; password: string; fullName: string; role: string; phoneBrand?: string; contactNumber?: string; address?: string; worklifeAnswer?: string }) {
    if (this.users.find((u) => u.email === data.email)) {
      throw new Error("Email already registered");
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user: User = {
      id: this.getId(),
      email: data.email,
      password: hashedPassword,
      fullName: data.fullName,
      role: data.role,
      phoneBrand: data.phoneBrand || null,
      phoneBattery: null,
      contactNumber: data.contactNumber || null,
      address: data.address || null,
      worklifeAnswer: data.worklifeAnswer || null,
      isSubscribed: false,
      subscriptionExpiry: null,
      gcashNumber: null,
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  findUserByEmail(email: string) {
    return this.users.find((u) => u.email === email) || null;
  }

  findUserById(id: number) {
    return this.users.find((u) => u.id === id) || null;
  }

  async verifyPassword(plain: string, hashed: string) {
    return bcrypt.compare(plain, hashed);
  }

  updateUser(id: number, data: Partial<User>) {
    const user = this.users.find((u) => u.id === id);
    if (user) Object.assign(user, data);
    return user;
  }

  getUsersByRole(role: string) {
    return this.users.filter((u) => u.role === role);
  }

  getAllUsers() {
    return [...this.users];
  }

  // Station methods
  getAllStations() {
    return [...this.stations];
  }

  addStation(data: Omit<Station, "id" | "createdAt">) {
    const station: Station = { ...data, id: this.getId(), createdAt: new Date() };
    this.stations.push(station);
    return station;
  }

  updateStation(id: number, data: Partial<Station>) {
    const station = this.stations.find((s) => s.id === id);
    if (station) Object.assign(station, data);
    return station;
  }

  // Session methods
  getSessionsByUser(userId: number) {
    return this.sessions.filter((s) => s.userId === userId);
  }

  addSession(data: Omit<Session, "id" | "createdAt">) {
    const session: Session = { ...data, id: this.getId(), createdAt: new Date() };
    this.sessions.push(session);
    // Update station session count
    const station = this.stations.find((s) => s.id === data.stationId);
    if (station) station.totalSessions++;
    return session;
  }

  // Notification methods
  addNotification(data: Omit<Notification, "id" | "createdAt">) {
    const notif: Notification = { ...data, id: this.getId(), createdAt: new Date() };
    this.notifications.push(notif);
    return notif;
  }

  getNotificationsByEmail(email: string) {
    return this.notifications.filter((n) => n.recipientEmail === email);
  }
}

export const store = new InMemoryStore();
