-- Institutions
INSERT INTO institutions (id, name, address, email, phone) VALUES
(1, 'MIT', '77 Massachusetts Ave, Cambridge, MA', 'contact@mit.edu', '617-253-1000'),
(2, 'Stanford', '450 Serra Mall, Stanford, CA', 'contact@stanford.edu', '650-723-2300'),
(3, 'Harvard', 'Harvard Yard, Cambridge, MA', 'contact@harvard.edu', '617-495-1000')
ON CONFLICT DO NOTHING;

-- Departments
INSERT INTO departments (id, institution_id, name) VALUES
-- MIT (1)
(1, 1, 'Computer Science'),
(2, 1, 'Mechanical Engineering'),
(3, 1, 'Physics'),
(4, 1, 'Chemistry'),
(5, 1, 'Biological Engineering'),
-- Stanford (2)
(6, 2, 'Computer Science'),
(7, 2, 'Electrical Engineering'),
(8, 2, 'Bioengineering'),
(9, 2, 'Chemistry'),
(10, 2, 'Applied Physics'),
-- Harvard (3)
(11, 3, 'Computer Science'),
(12, 3, 'Molecular Biology'),
(13, 3, 'Physics'),
(14, 3, 'Chemistry'),
(15, 3, 'Systematic Botany')
ON CONFLICT DO NOTHING;

-- Users (password = 'password', pre-hashed with BCrypt)
INSERT INTO users (id, department_id, name, email, password, role) VALUES
-- Global Admin
(1, 1, 'Global Admin', 'admin@portal.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'SYSTEM_ADMIN'),

-- MIT (Institution 1)
(2, 1, 'MIT Head', 'mit.head@portal.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'INSTITUTION_HEAD'),
(3, 3, 'MIT Physics Head', 'mit.physics.head@portal.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'DEPARTMENT_HEAD'),
(4, 1, 'MIT CS Manager', 'mit.cs.mgr@portal.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'LAB_MANAGER'),
(5, 1, 'MIT CS Technician', 'mit.cs.tech@portal.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'LAB_TECHNICIAN'),
(6, 1, 'MIT CS Researcher', 'mit.cs.res@portal.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'RESEARCHER'),
(7, 1, 'MIT CS Student', 'mit.cs.std@portal.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'STUDENT'),
(8, 3, 'MIT Physics Student', 'mit.physics.std@portal.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'STUDENT'),

-- Stanford (Institution 2)
(9, 6, 'Stanford Head', 'stanford.head@portal.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'INSTITUTION_HEAD'),
(10, 8, 'Stanford Bio Manager', 'stanford.bio.mgr@portal.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'LAB_MANAGER'),
(11, 8, 'Stanford Bio Technician', 'stanford.bio.tech@portal.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'LAB_TECHNICIAN'),
(12, 8, 'Stanford Bio Student', 'stanford.bio.std@portal.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'STUDENT'),

-- Harvard (Institution 3)
(13, 11, 'Harvard Head', 'harvard.head@portal.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'INSTITUTION_HEAD'),
(14, 12, 'Harvard Bio Student', 'harvard.bio.std@portal.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'STUDENT')
ON CONFLICT DO NOTHING;

-- Equipment
INSERT INTO equipment (id, department_id, name, category, manufacturer, model, serial_number, status, purchase_date, is_shared, is_restricted, room_number, contact_email, specifications, description) VALUES
-- MIT CS (Dept 1)
(1, 1, '3D Printer', 'Fabrication', 'Prusa', 'MK4', 'SN-3DP-001', 'AVAILABLE', '2024-01-15', FALSE, FALSE, 'Room 101', 'mit.cs.mgr@portal.edu', 'Build volume: 250x210x220mm', 'High-quality FDM 3D printer for prototyping'),
(2, 1, 'VR Headset', 'Imaging', 'Meta', 'Quest 3', 'SN-VR-002', 'AVAILABLE', '2024-02-10', FALSE, FALSE, 'Room 102', 'mit.cs.mgr@portal.edu', '128GB Storage, 4K Display', 'Virtual reality headset for visualization studies'),
-- MIT Physics (Dept 3)
(3, 3, 'Laser Interferometer', 'Optics', 'Thorlabs', 'INT-500', 'SN-LAS-003', 'AVAILABLE', '2023-08-20', FALSE, TRUE, 'Room 201', 'mit.physics.head@portal.edu', 'Wavelength: 632.8nm, Class 3B', 'Advanced restricted laser interferometer'),
(4, 3, 'Cryostat', 'Cryogenics', 'Oxford Instruments', 'Optistat', 'SN-CRY-004', 'AVAILABLE', '2023-11-05', TRUE, FALSE, 'Room 202', 'mit.physics.head@portal.edu', 'Temperature range: 1.5K - 300K', 'Helium cryostat for low-temperature measurements'),
-- Stanford Bioengineering (Dept 8)
(5, 8, 'PCR Thermal Cycler', 'Biology', 'Bio-Rad', 'T100', 'SN-PCR-005', 'AVAILABLE', '2024-03-01', FALSE, FALSE, 'Room 301', 'stanford.bio.mgr@portal.edu', '96-well, gradient capable', 'Thermal cycler for DNA amplification'),
(6, 8, 'Fluorescence Microscope', 'Imaging', 'Nikon', 'Eclipse', 'SN-MIC-006', 'UNDER_MAINTENANCE', '2023-05-18', FALSE, FALSE, 'Room 302', 'stanford.bio.mgr@portal.edu', 'Magnification: 1000x', 'Fluorescence inverted microscope'),
(7, 8, 'Centrifuge', 'Biology', 'Eppendorf', '5424R', 'SN-CEN-007', 'AVAILABLE', '2023-09-12', TRUE, FALSE, 'Room 303', 'stanford.bio.mgr@portal.edu', 'Max speed: 15000 rpm', 'High-speed refrigerated centrifuge'),
-- Harvard Molecular Biology (Dept 12)
(8, 12, 'DNA Sequencer', 'Genetics', 'Illumina', 'MiSeq', 'SN-SEQ-008', 'AVAILABLE', '2024-04-10', TRUE, TRUE, 'Room 401', 'harvard.head@portal.edu', 'Output: Up to 15 Gb', 'Restricted and shared high-throughput DNA sequencer'),
(9, 12, 'Autoclave', 'Sterilization', 'Tuttnauer', '3870M', 'SN-AUT-009', 'AVAILABLE', '2024-05-15', FALSE, FALSE, 'Room 402', 'harvard.head@portal.edu', 'Volume: 85 Liters', 'Steam sterilizer for biology lab prep')
ON CONFLICT DO NOTHING;

-- Bookings
INSERT INTO bookings (id, equipment_id, user_id, start_time, end_time, purpose, status) VALUES
(1, 1, 7, '2026-07-20 09:00:00', '2026-07-20 12:00:00', 'Print prototypes for robotics class', 'PENDING'),
(2, 4, 8, '2026-07-18 10:00:00', '2026-07-18 13:00:00', 'Low-temp semiconductor experiment', 'APPROVED')
ON CONFLICT DO NOTHING;

-- Maintenance
INSERT INTO maintenance (id, equipment_id, maintenance_date, description, status, next_due_date, technician_id) VALUES
(1, 6, '2026-07-15', 'Light source replacement and mirror alignment', 'PENDING', '2026-10-15', 11),
(2, 1, '2026-07-01', 'Extruder nozzle cleaning', 'COMPLETED', '2026-10-01', 5)
ON CONFLICT DO NOTHING;

-- Utilization
INSERT INTO utilization (id, equipment_id, usage_hours, utilization_percentage, recorded_date) VALUES
(1, 1, 95.50, 59.70, '2026-07-01'),
(2, 3, 40.25, 25.15, '2026-07-01'),
(3, 5, 120.00, 75.00, '2026-07-01'),
(4, 7, 72.80, 45.50, '2026-07-01'),
(5, 8, 140.40, 87.75, '2026-07-01')
ON CONFLICT DO NOTHING;

-- Waitlist
INSERT INTO waitlist (id, equipment_id, user_id, request_time, status) VALUES
(1, 4, 7, '2026-07-16 10:00:00', 'PENDING')
ON CONFLICT DO NOTHING;

-- Notifications
INSERT INTO notifications (id, user_id, message, type, is_read, created_at) VALUES
(1, 7, 'Your booking for 3D Printer is pending approval', 'BOOKING', FALSE, '2026-07-16 09:00:00'),
(2, 4, 'New booking request for 3D Printer from MIT CS Student', 'BOOKING', FALSE, '2026-07-16 09:00:00'),
(3, 8, 'Your booking for Cryostat has been approved', 'BOOKING', TRUE, '2026-07-15 14:00:00'),
(4, 11, 'Maintenance scheduled for Fluorescence Microscope', 'MAINTENANCE', FALSE, '2026-07-14 10:00:00')
ON CONFLICT DO NOTHING;

-- Reset sequences
SELECT setval('institutions_id_seq', COALESCE((SELECT MAX(id) FROM institutions), 1));
SELECT setval('departments_id_seq', COALESCE((SELECT MAX(id) FROM departments), 1));
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval('equipment_id_seq', COALESCE((SELECT MAX(id) FROM equipment), 1));
SELECT setval('bookings_id_seq', COALESCE((SELECT MAX(id) FROM bookings), 1));
SELECT setval('maintenance_id_seq', COALESCE((SELECT MAX(id) FROM maintenance), 1));
SELECT setval('utilization_id_seq', COALESCE((SELECT MAX(id) FROM utilization), 1));
SELECT setval('waitlist_id_seq', COALESCE((SELECT MAX(id) FROM waitlist), 1));
SELECT setval('notifications_id_seq', COALESCE((SELECT MAX(id) FROM notifications), 1));
