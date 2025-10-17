CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  total_units INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS apartments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  floor INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(building_id, unit_number)
);

CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  visit_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'repair-needed', 'replacement-needed', 'no-access')),
  notes TEXT,
  tasks_completed TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, apartment_id)
);

CREATE INDEX IF NOT EXISTS idx_visits_apartment ON visits(apartment_id);
CREATE INDEX IF NOT EXISTS idx_visits_worker ON visits(worker_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_apartment ON active_sessions(apartment_id);
CREATE INDEX IF NOT EXISTS idx_sessions_worker ON active_sessions(worker_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON active_sessions(status);

ALTER PUBLICATION supabase_realtime ADD TABLE visits;
ALTER PUBLICATION supabase_realtime ADD TABLE active_sessions;

INSERT INTO workers (id, name, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'John Smith', 'john@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'Sarah Johnson', 'sarah@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'Mike Davis', 'mike@example.com'),
  ('44444444-4444-4444-4444-444444444444', 'Emily Brown', 'emily@example.com'),
  ('55555555-5555-5555-5555-555555555555', 'David Wilson', 'david@example.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO buildings (id, name, address, total_units) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Maple Heights', '123 Maple Street', 24),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Oak Towers', '456 Oak Avenue', 36),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Pine Plaza', '789 Pine Road', 18),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Elm Gardens', '321 Elm Boulevard', 30),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Cedar Court', '654 Cedar Lane', 20),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Birch Building', '987 Birch Street', 28),
  ('gggggggg-gggg-gggg-gggg-gggggggggggg', 'Willow West', '147 Willow Way', 32),
  ('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'Spruce Square', '258 Spruce Drive', 22),
  ('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'Ash Apartments', '369 Ash Circle', 26),
  ('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 'Redwood Residences', '741 Redwood Path', 40),
  ('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', 'Cypress Center', '852 Cypress Court', 24),
  ('llllllll-llll-llll-llll-llllllllllll', 'Magnolia Manor', '963 Magnolia Drive', 16)
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  building RECORD;
  unit_num INTEGER;
  floor_num INTEGER;
BEGIN
  FOR building IN SELECT id, total_units FROM buildings LOOP
    FOR unit_num IN 1..building.total_units LOOP
      floor_num := ((unit_num - 1) / 4) + 1;
      
      INSERT INTO apartments (building_id, unit_number, floor)
      VALUES (building.id, unit_num::TEXT, floor_num)
      ON CONFLICT (building_id, unit_number) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;