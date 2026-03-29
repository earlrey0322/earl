-- PSPCS Database Schema for Supabase
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/sql

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone_brand TEXT,
  contact_number TEXT,
  address TEXT,
  worklife_answer TEXT,
  is_subscribed BOOLEAN DEFAULT false,
  subscription_plan TEXT,
  subscription_expiry TIMESTAMPTZ,
  gcash_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Charging stations table
CREATE TABLE IF NOT EXISTS charging_stations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  company_name TEXT NOT NULL DEFAULT 'KLEOXM 111',
  brand TEXT NOT NULL DEFAULT 'PSPCS',
  owner_id BIGINT REFERENCES users(id),
  owner_name TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  location TEXT DEFAULT '',
  contact_number TEXT,
  is_active BOOLEAN DEFAULT true,
  solar_watts DOUBLE PRECISION DEFAULT 50,
  battery_level DOUBLE PRECISION DEFAULT 100,
  total_visits INTEGER DEFAULT 0,
  revenue DOUBLE PRECISION DEFAULT 0,
  cable_type_c INTEGER DEFAULT 0,
  cable_iphone INTEGER DEFAULT 0,
  cable_universal INTEGER DEFAULT 0,
  outlets INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Charging history table
CREATE TABLE IF NOT EXISTS charging_history (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT REFERENCES users(id),
  user_email TEXT,
  station_id BIGINT REFERENCES charging_stations(id),
  station_name TEXT,
  phone_brand TEXT NOT NULL,
  start_battery INTEGER NOT NULL,
  target_battery INTEGER DEFAULT 100,
  cost_pesos DOUBLE PRECISION NOT NULL,
  duration_minutes INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT REFERENCES users(id),
  buyer_name TEXT NOT NULL,
  buyer_email TEXT,
  buyer_phone TEXT NOT NULL,
  buyer_address TEXT NOT NULL,
  product TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  total_price DOUBLE PRECISION NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE charging_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE charging_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all operations for authenticated users (simplified)
CREATE POLICY "Allow all for authenticated" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON charging_stations FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON charging_history FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON notifications FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON orders FOR ALL USING (true);

-- Insert sample stations
INSERT INTO charging_stations (name, company_name, owner_id, owner_name, latitude, longitude, address, location, is_active, battery_level, total_visits, cable_type_c, cable_iphone, cable_universal, outlets)
VALUES
  ('PSPCS - SM Mall', 'KLEOXM 111', 0, 'KLEOXM 111', 14.5995, 120.9842, 'SM Mall of Asia, Pasay', 'Pasay City', true, 85, 142, 2, 1, 1, 2),
  ('PSPCS - BGC', 'KLEOXM 111', 0, 'KLEOXM 111', 14.5537, 121.0509, 'BGC High Street, Taguig', 'Taguig City', true, 92, 89, 1, 2, 1, 1),
  ('PSPCS - Quiapo', 'KLEOXM 111', 0, 'KLEOXM 111', 14.5981, 120.9837, 'Quiapo Church, Manila', 'Manila', false, 15, 234, 2, 1, 2, 3),
  ('PSPCS - Cubao', 'KLEOXM 111', 0, 'KLEOXM 111', 14.6188, 121.0509, 'Gateway Mall, Cubao', 'Quezon City', true, 78, 67, 1, 1, 1, 1),
  ('PSPCS - Makati', 'KLEOXM 111', 0, 'KLEOXM 111', 14.5547, 121.0244, 'Ayala Center, Makati', 'Makati City', true, 95, 198, 2, 2, 1, 2);
