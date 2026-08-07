CREATE TABLE IF NOT EXISTS institutions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255),
    email VARCHAR(100),
    phone VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    institution_id INTEGER REFERENCES institutions(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    purchase_date DATE,
    is_shared BOOLEAN DEFAULT FALSE,
    is_restricted BOOLEAN DEFAULT FALSE,
    room_number VARCHAR(50),
    contact_email VARCHAR(100),
    image_url TEXT,
    specifications TEXT,
    description TEXT,
    operating_instructions TEXT,
    safety_guidelines TEXT,
    maintenance_guide TEXT,
    hourly_rate NUMERIC(10,2) DEFAULT 45.00,
    last_calibration_date DATE,
    next_calibration_date DATE,
    calibration_status VARCHAR(50) DEFAULT 'VALID'
);

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    rejection_reason VARCHAR(255),
    total_cost NUMERIC(10,2) DEFAULT 0.00,
    is_cross_institution BOOLEAN DEFAULT FALSE,
    billing_status VARCHAR(50) DEFAULT 'PENDING'
);

CREATE TABLE IF NOT EXISTS maintenance (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
    maintenance_date DATE NOT NULL,
    description VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    next_due_date DATE,
    technician_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    cost NUMERIC(10,2) DEFAULT 0.00,
    maintenance_type VARCHAR(50) DEFAULT 'REPAIR',
    work_order_number VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS utilization (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
    usage_hours NUMERIC(10,2) NOT NULL,
    utilization_percentage NUMERIC(5,2) NOT NULL,
    recorded_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS waitlist (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    request_time TIMESTAMP NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING'
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE equipment ADD COLUMN IF NOT EXISTS operating_instructions TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS safety_guidelines TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS maintenance_guide TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2) DEFAULT 45.00;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS last_calibration_date DATE;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS next_calibration_date DATE;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS calibration_status VARCHAR(50) DEFAULT 'VALID';
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS certificate_number VARCHAR(100);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS certificate_agency VARCHAR(100);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS certificate_type VARCHAR(100);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS certificate_url TEXT;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_cost NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_cross_institution BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS billing_status VARCHAR(50) DEFAULT 'PENDING';

ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS cost NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS maintenance_type VARCHAR(50) DEFAULT 'REPAIR';
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS work_order_number VARCHAR(100);

