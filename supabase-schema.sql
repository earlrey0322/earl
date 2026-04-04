-- Copy-paste this into Supabase SQL Editor and click RUN
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql

CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone_brand TEXT,
  contact_number TEXT,
  address TEXT,
  is_subscribed BOOLEAN DEFAULT false,
  subscription_plan TEXT,
  subscription_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE subscription_requests (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  plan TEXT NOT NULL,
  reference_number TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE monthly_payments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  reference_number TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  paid_for_month TEXT NOT NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE charging_stations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  company_name TEXT NOT NULL DEFAULT 'KLEOXM 111',
  brand TEXT NOT NULL DEFAULT 'PSPCS',
  owner_id BIGINT,
  owner_name TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  location TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  solar_watts DOUBLE PRECISION DEFAULT 50,
  battery_level DOUBLE PRECISION DEFAULT 100,
  total_visits INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  view_revenue DOUBLE PRECISION DEFAULT 0,
  revenue DOUBLE PRECISION DEFAULT 0,
  cable_type_c INTEGER DEFAULT 0,
  cable_iphone INTEGER DEFAULT 0,
  cable_universal INTEGER DEFAULT 0,
  outlets INTEGER DEFAULT 1,
  fb_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notifications (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE redemptions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  redemption_type TEXT NOT NULL, -- 'free_station' or 'gcash'
  amount DOUBLE PRECISION NOT NULL,
  -- For free station redemption
  contact_name TEXT,
  contact_number TEXT,
  delivery_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'delivered'
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE station_views (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT NOT NULL,
  station_id BIGINT NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, station_id, viewed_at)
);

-- Allow all access (for this app)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE charging_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE station_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON users FOR ALL USING (true);
CREATE POLICY "Allow all" ON charging_stations FOR ALL USING (true);
CREATE POLICY "Allow all" ON notifications FOR ALL USING (true);
CREATE POLICY "Allow all" ON subscription_requests FOR ALL USING (true);
CREATE POLICY "Allow all" ON monthly_payments FOR ALL USING (true);
CREATE POLICY "Allow all" ON redemptions FOR ALL USING (true);
CREATE POLICY "Allow all" ON station_views FOR ALL USING (true);
CREATE POLICY "Allow all" ON station_views FOR ALL USING (true);

-- Sample stations
INSERT INTO charging_stations (name, company_name, owner_id, owner_name, latitude, longitude, address, location, is_active, battery_level, total_visits, cable_type_c, cable_iphone, cable_universal, outlets)
VALUES
  ('PSPCS - SM Mall', 'KLEOXM 111', 0, 'KLEOXM 111', 14.5995, 120.9842, 'SM Mall of Asia, Pasay', 'Pasay City', true, 85, 142, 2, 1, 1, 2),
  ('PSPCS - BGC', 'KLEOXM 111', 0, 'KLEOXM 111', 14.5537, 121.0509, 'BGC High Street, Taguig', 'Taguig City', true, 92, 89, 1, 2, 1, 1),
  ('PSPCS - Quiapo', 'KLEOXM 111', 0, 'KLEOXM 111', 14.5981, 120.9837, 'Quiapo Church, Manila', 'Manila', false, 15, 234, 2, 1, 2, 3),
  ('PSPCS - Cubao', 'KLEOXM 111', 0, 'KLEOXM 111', 14.6188, 121.0509, 'Gateway Mall, Cubao', 'Quezon City', true, 78, 67, 1, 1, 1, 1),
  ('PSPCS - Makati', 'KLEOXM 111', 0, 'KLEOXM 111', 14.5547, 121.0244, 'Ayala Center, Makati', 'Makati City', true, 95, 198, 2, 2, 1, 2);
