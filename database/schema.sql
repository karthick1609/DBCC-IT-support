-- DBASC IT Support schema
-- Users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid,
  employee_id varchar(50),
  full_name varchar(255) NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  phone varchar(50),
  department_id uuid,
  role varchar(20) NOT NULL DEFAULT 'staff',
  status varchar(20) DEFAULT 'active',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  code varchar(50),
  description text,
  status varchar(20) DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Locations
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  building varchar(255),
  floor varchar(50),
  room varchar(100),
  description text,
  status varchar(20) DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Asset categories
CREATE TABLE IF NOT EXISTS asset_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Assets
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code varchar(100) UNIQUE NOT NULL,
  asset_name varchar(255) NOT NULL,
  category_id uuid REFERENCES asset_categories(id),
  brand varchar(255),
  model varchar(255),
  serial_number varchar(255) UNIQUE,
  processor varchar(255),
  ram varchar(255),
  storage varchar(255),
  operating_system varchar(255),
  purchase_date date,
  purchase_cost numeric(12,2),
  warranty_start date,
  warranty_end date,
  vendor varchar(255),
  location_id uuid REFERENCES locations(id),
  department_id uuid REFERENCES departments(id),
  assigned_user_id uuid REFERENCES users(id),
  status varchar(50) DEFAULT 'Active',
  condition varchar(50) DEFAULT 'Good',
  ip_address inet,
  mac_address macaddr,
  hostname varchar(255),
  notes text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ticket categories
CREATE TABLE IF NOT EXISTS ticket_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number varchar(50) UNIQUE NOT NULL,
  title varchar(255) NOT NULL,
  description text,
  category_id uuid REFERENCES ticket_categories(id),
  priority varchar(20) DEFAULT 'Medium',
  status varchar(50) DEFAULT 'Open',
  requester_id uuid REFERENCES users(id),
  department_id uuid REFERENCES departments(id),
  location_id uuid REFERENCES locations(id),
  asset_id uuid REFERENCES assets(id),
  assigned_to uuid REFERENCES users(id),
  resolution text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  closed_at timestamptz
);

-- Ticket comments
CREATE TABLE IF NOT EXISTS ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  message text NOT NULL,
  attachment_url text,
  created_at timestamptz DEFAULT now()
);

-- Ticket attachments
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES users(id),
  file_name varchar(255),
  file_url text,
  mime_type varchar(100),
  created_at timestamptz DEFAULT now()
);

-- Asset assignments (history)
CREATE TABLE IF NOT EXISTS asset_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES users(id),
  assigned_by uuid REFERENCES users(id),
  from_location uuid REFERENCES locations(id),
  to_location uuid REFERENCES locations(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Asset service history
CREATE TABLE IF NOT EXISTS asset_service_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  action varchar(100),
  details text,
  performed_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  type varchar(100),
  message text,
  meta jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action varchar(255) NOT NULL,
  module varchar(255),
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assets_asset_code ON assets(asset_code);
CREATE INDEX IF NOT EXISTS idx_assets_serial ON assets(serial_number);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
