-- Seed departments
INSERT INTO departments (name, code, description)
SELECT seed.name, seed.code, seed.description
FROM (VALUES
  ('BCA', 'BCA', 'Bachelor of Computer Applications'),
  ('B.Com', 'BCOM', 'Bachelor of Commerce'),
  ('Viscom', 'VIS', 'Visual Communications'),
  ('B.Sc CS AI', 'CSAI', 'Computer Science & AI'),
  ('Administration', 'ADMIN', 'Administration'),
  ('Library', 'LIB', 'Library'),
  ('Accounts', 'ACCT', 'Accounts')
) AS seed(name, code, description)
WHERE NOT EXISTS (
  SELECT 1 FROM departments existing WHERE existing.code = seed.code
);

-- Seed locations
INSERT INTO locations (name, building, floor, room)
SELECT seed.name, seed.building, seed.floor, seed.room
FROM (VALUES
  ('Lab 1', 'Main', '1', 'Lab 1'),
  ('Lab 2', 'Main', '1', 'Lab 2'),
  ('Lab 3', 'Main', '2', 'Lab 3'),
  ('Server Room', 'Main', 'B', 'Server Room'),
  ('Office', 'Admin', '1', 'Office'),
  ('Library', 'Main', '1', 'Library'),
  ('Principal Room', 'Admin', '2', 'Principal Room')
) AS seed(name, building, floor, room)
WHERE NOT EXISTS (
  SELECT 1 FROM locations existing WHERE existing.name = seed.name
);

-- Seed asset categories
INSERT INTO asset_categories (name)
SELECT seed.name
FROM (VALUES
  ('Desktop PC'), ('Laptop'), ('Server'), ('Switch'), ('Router'), ('UPS'),
  ('Printer'), ('Projector'), ('Smart Board'), ('Access Point'), ('CCTV')
) AS seed(name)
WHERE NOT EXISTS (
  SELECT 1 FROM asset_categories existing WHERE existing.name = seed.name
);

-- Seed ticket categories
INSERT INTO ticket_categories (name)
SELECT seed.name
FROM (VALUES
  ('Computer'), ('Network'), ('Internet'), ('Wi-Fi'), ('Printer'),
  ('Software'), ('Windows'), ('Office'), ('Projector'), ('Smart Board'),
  ('Server'), ('Login'), ('Other')
) AS seed(name)
WHERE NOT EXISTS (
  SELECT 1 FROM ticket_categories existing WHERE existing.name = seed.name
);
