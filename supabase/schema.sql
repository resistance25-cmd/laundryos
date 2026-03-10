-- ============================================================
-- LaundryOS — Full Supabase Schema
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- ZONES
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Indore',
  is_active BOOLEAN DEFAULT true,
  slot_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USERS (customers only)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  avatar_url TEXT,
  zone_id UUID REFERENCES zones(id),
  city TEXT DEFAULT 'Indore',
  address TEXT,
  latitude FLOAT,
  longitude FLOAT,
  wallet_balance NUMERIC(10,2) DEFAULT 0,
  referral_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  referred_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADMINS
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RIDERS
CREATE TABLE IF NOT EXISTS riders (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  avatar_url TEXT,
  zone_id UUID REFERENCES zones(id),
  vehicle_type TEXT,
  vehicle_number TEXT,
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  current_latitude FLOAT,
  current_longitude FLOAT,
  total_deliveries INT DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 5.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LAUNDRY PARTNERS
CREATE TABLE IF NOT EXISTS laundry_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_name TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  zone_id UUID REFERENCES zones(id),
  is_active BOOLEAN DEFAULT true,
  daily_capacity INT DEFAULT 200,
  current_load INT DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 5.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBSCRIPTION PLANS
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  wash_credits INT DEFAULT 0,
  press_credits INT DEFAULT 0,
  dry_clean_credits INT DEFAULT 0,
  free_pickup BOOLEAN DEFAULT false,
  validity_days INT DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  wash_credits_remaining INT DEFAULT 0,
  press_credits_remaining INT DEFAULT 0,
  dry_clean_credits_remaining INT DEFAULT 0,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active',
  payment_id TEXT,
  amount_paid NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADDRESSES
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT,
  line1 TEXT NOT NULL,
  line2 TEXT,
  landmark TEXT,
  area TEXT,
  zone_id UUID REFERENCES zones(id),
  city TEXT DEFAULT 'Indore',
  pincode TEXT,
  latitude FLOAT,
  longitude FLOAT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PICKUP SLOTS
CREATE TABLE IF NOT EXISTS pickup_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  zone_id UUID REFERENCES zones(id),
  max_bookings_per_slot INT DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DELIVERY SLOTS
CREATE TABLE IF NOT EXISTS delivery_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL DEFAULT 'LOS-' || upper(substr(md5(random()::text), 1, 8)),
  user_id UUID NOT NULL REFERENCES users(id),
  address_id UUID REFERENCES addresses(id),
  zone_id UUID REFERENCES zones(id),
  city TEXT DEFAULT 'Indore',

  laundry_partner_id UUID REFERENCES laundry_partners(id),
  rider_id UUID REFERENCES riders(id),
  delivery_rider_id UUID REFERENCES riders(id),

  pickup_date DATE NOT NULL,
  pickup_slot_id UUID REFERENCES pickup_slots(id),
  delivery_date DATE,
  delivery_slot_id UUID REFERENCES delivery_slots(id),

  order_type TEXT NOT NULL,
  subscription_id UUID REFERENCES user_subscriptions(id),

  status TEXT DEFAULT 'placed',

  subtotal NUMERIC(10,2) DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  delivery_charge NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  payment_id TEXT,
  payment_method TEXT,

  special_instructions TEXT,
  pickup_proof_url TEXT,
  delivery_proof_url TEXT,
  pickup_confirmed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  item_name TEXT,
  quantity INT DEFAULT 1,
  unit_price NUMERIC(10,2) DEFAULT 0,
  total_price NUMERIC(10,2) DEFAULT 0,
  tag_id TEXT UNIQUE,
  special_notes TEXT,
  before_photo_url TEXT,
  after_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDER STATUS HISTORY
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_by UUID,
  changed_by_role TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  subscription_id UUID REFERENCES user_subscriptions(id),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending',
  method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREDIT LEDGER
CREATE TABLE IF NOT EXISTS credit_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  subscription_id UUID REFERENCES user_subscriptions(id),
  order_id UUID REFERENCES orders(id),
  credit_type TEXT NOT NULL,
  change INT NOT NULL,
  balance_after INT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  rider_id UUID REFERENCES riders(id),
  admin_id UUID REFERENCES admins(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT,
  order_id UUID REFERENCES orders(id),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PUSH SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  rider_id UUID REFERENCES riders(id),
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRICING CONFIG
CREATE TABLE IF NOT EXISTS pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_type TEXT NOT NULL,
  item_name TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(service_type, item_name)
);

-- SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  conversation JSONB DEFAULT '[]',
  attachments TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'role' = 'admin' THEN
    INSERT INTO public.admins (id, name, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      NEW.email
    ) ON CONFLICT (id) DO NOTHING;

  ELSIF NEW.raw_user_meta_data->>'role' = 'rider' THEN
    INSERT INTO public.riders (id, name, phone, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', ''),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      NEW.email
    ) ON CONFLICT (id) DO NOTHING;

  ELSE
    INSERT INTO public.users (id, name, phone, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      NEW.email
    ) ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update orders.updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-log order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, status, changed_by_role)
    VALUES (NEW.id, NEW.status, 'system');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_status_history ON orders;
CREATE TRIGGER orders_status_history
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Users: RLS disabled, controlled by grants
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
GRANT ALL ON users TO authenticated;
GRANT SELECT ON users TO anon;

-- Addresses: own only
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_addresses" ON addresses
  FOR ALL USING (auth.uid() = user_id);

-- Orders: users see only their own
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_orders" ON orders
  FOR ALL USING (auth.uid() = user_id);

-- Riders see only assigned orders
CREATE POLICY "riders_assigned_orders" ON orders
  FOR SELECT USING (
    auth.uid() = rider_id OR auth.uid() = delivery_rider_id
  );

-- User subscriptions: own only
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_subscriptions" ON user_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Credit ledger: own only
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_credits" ON credit_ledger
  FOR SELECT USING (auth.uid() = user_id);

-- Notifications: own only
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_notifications" ON notifications
  FOR ALL USING (
    auth.uid() = user_id OR
    auth.uid() = rider_id OR
    auth.uid() = admin_id
  );

-- Order items: users see items for their orders
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_order_items" ON order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Order status history: users see history for their orders
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_order_history" ON order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_history.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Support tickets: own only
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_support_tickets" ON support_tickets
  FOR ALL USING (auth.uid() = user_id);

-- Public read: zones, pickup_slots, delivery_slots, subscription_plans, pricing
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_zones" ON zones FOR SELECT USING (true);

ALTER TABLE pickup_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_pickup_slots" ON pickup_slots FOR SELECT USING (true);

ALTER TABLE delivery_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_delivery_slots" ON delivery_slots FOR SELECT USING (true);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_plans" ON subscription_plans FOR SELECT USING (true);

ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_pricing" ON pricing FOR SELECT USING (true);

-- Push subscriptions: own only
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_push_subscriptions" ON push_subscriptions
  FOR ALL USING (
    auth.uid() = user_id OR auth.uid() = rider_id
  );

-- ============================================================
-- SEED DATA
-- ============================================================

-- Zones
INSERT INTO zones (name, city) VALUES
  ('Vijay Nagar', 'Indore'),
  ('Scheme 54', 'Indore'),
  ('Palasia', 'Indore'),
  ('Nipania', 'Indore'),
  ('AB Road', 'Indore')
ON CONFLICT DO NOTHING;

-- Pickup Slots
INSERT INTO pickup_slots (label, start_time, end_time) VALUES
  ('8 AM – 10 AM', '08:00', '10:00'),
  ('10 AM – 12 PM', '10:00', '12:00'),
  ('12 PM – 2 PM',  '12:00', '14:00')
ON CONFLICT DO NOTHING;

-- Delivery Slots
INSERT INTO delivery_slots (label, start_time, end_time) VALUES
  ('6 PM – 8 PM',  '18:00', '20:00'),
  ('8 PM – 10 PM', '20:00', '22:00')
ON CONFLICT DO NOTHING;

-- Subscription Plans
INSERT INTO subscription_plans (name, price, wash_credits, press_credits, dry_clean_credits, free_pickup, validity_days, sort_order) VALUES
  ('Basic',    699,  2, 2, 0, false, 30, 1),
  ('Standard', 999,  3, 3, 1, false, 30, 2),
  ('Premium',  1499, 5, 5, 2, true,  30, 3)
ON CONFLICT DO NOTHING;

-- Pricing
INSERT INTO pricing (service_type, item_name, unit_price) VALUES
  ('wash_fold',   'Shirt',   30),
  ('wash_fold',   'Trouser', 40),
  ('wash_fold',   'Saree',   60),
  ('steam_press', 'Shirt',   15),
  ('steam_press', 'Trouser', 20),
  ('dry_clean',   'Jacket',  150),
  ('dry_clean',   'Suit',    300)
ON CONFLICT (service_type, item_name) DO UPDATE SET unit_price = EXCLUDED.unit_price;

-- ============================================================
-- FIRST ADMIN BOOTSTRAP (run separately after creating auth user)
-- ============================================================
-- Replace the UUID and email below with your actual values after
-- creating the user in Supabase Auth dashboard.
--
-- INSERT INTO admins (id, name, email, is_super_admin)
-- VALUES ('[your-auth-user-uuid]', 'Admin Name', 'admin@laundreos.in', true);
